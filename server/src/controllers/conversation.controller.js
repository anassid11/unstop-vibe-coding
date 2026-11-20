import { Conversation } from '../models/Conversation.js';
import { HttpError } from '../utils/HttpError.js';
import { listTones } from '../services/tone.service.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getTones = (_req, res) => res.json(listTones());

// GET /api/conversations?q=term  -> sidebar list with optional search over titles and messages
export async function listConversations(req, res) {
  const q = String(req.query.q ?? '').trim().slice(0, 100);
  let filter = {};
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter = { $or: [{ title: rx }, { 'messages.content': rx }] };
  }
  const items = await Conversation.find(filter).select('title createdAt updatedAt').sort({ updatedAt: -1 }).limit(100);
  res.json(items);
}

export async function getConversation(req, res) {
  const convo = await Conversation.findById(req.params.id);
  if (!convo) throw new HttpError(404, 'Conversation not found');
  res.json(convo);
}

export async function renameConversation(req, res) {
  const title = String(req.body?.title ?? '').trim();
  if (!title || title.length > 80) throw new HttpError(400, 'Title must be 1-80 characters');
  const convo = await Conversation.findByIdAndUpdate(req.params.id, { title }, { new: true });
  if (!convo) throw new HttpError(404, 'Conversation not found');
  res.json({ _id: convo.id, title: convo.title });
}

export async function deleteConversation(req, res) {
  const convo = await Conversation.findByIdAndDelete(req.params.id);
  if (!convo) throw new HttpError(404, 'Conversation not found');
  res.status(204).end();
}

// GET /api/conversations/:id/export -> Markdown download
export async function exportConversation(req, res) {
  const convo = await Conversation.findById(req.params.id);
  if (!convo) throw new HttpError(404, 'Conversation not found');
  const body = convo.messages
    .map((m) => `### ${m.role === 'user' ? 'You' : 'Assistant'} (${m.createdAt.toISOString()})\n\n${m.content}`)
    .join('\n\n');
  const filename = convo.title.replace(/[^\w-]+/g, '_').slice(0, 40) || 'conversation';
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.md"`);
  res.send(`# ${convo.title}\n\n${body}\n`);
}
