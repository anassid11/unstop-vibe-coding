import { Conversation } from '../models/Conversation.js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';
import { buildSystemPrompt } from '../services/tone.service.js';
import { streamCompletion } from '../services/llm.service.js';

const makeTitle = (text) => {
  const clean = text.trim().replace(/\s+/g, ' ');
  return clean.length > 48 ? `${clean.slice(0, 48)}…` : clean;
};

/**
 * POST /api/chat/stream  (Server-Sent Events)
 * body: { conversationId?, message, tone, regenerate? }
 * Events: meta -> token* -> (error) -> done
 */
export async function streamChat(req, res) {
  const { conversationId, message, tone, regenerate } = req.body;

  let convo = null;
  if (conversationId) {
    convo = await Conversation.findById(conversationId);
    if (!convo) throw new HttpError(404, 'Conversation not found');
  }

  if (regenerate) {
    if (convo.messages.at(-1)?.role === 'assistant') convo.messages.pop();
    if (convo.messages.at(-1)?.role !== 'user') throw new HttpError(400, 'Nothing to regenerate');
  } else {
    convo ??= new Conversation({ title: makeTitle(message), messages: [] });
    convo.messages.push({ role: 'user', content: message.trim(), tone });
  }
  await convo.save();

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  const send = (payload) => {
    if (!res.writableEnded && !res.destroyed) res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  // Client pressed "Stop" or closed the tab -> cancel the upstream LLM request.
  const abort = new AbortController();
  res.on('close', () => {
    if (!res.writableEnded) abort.abort();
  });

  send({ type: 'meta', conversationId: convo.id, title: convo.title });

  const history = convo.messages.slice(-env.maxHistory).map((m) => ({ role: m.role, content: m.content }));
  while (history[0]?.role === 'assistant') history.shift();

  let text = '';
  let stopped = false;
  try {
    for await (const delta of streamCompletion({ system: buildSystemPrompt(tone), messages: history, signal: abort.signal })) {
      text += delta;
      send({ type: 'token', text: delta });
    }
  } catch (err) {
    if (abort.signal.aborted) stopped = true;
    else {
      console.error('LLM error:', err.message);
      send({ type: 'error', message: 'The AI provider failed to respond. Check the API key and try again.' });
    }
  }
  if (abort.signal.aborted) stopped = true;

  if (text) {
    convo.messages.push({ role: 'assistant', content: text, tone, stopped });
    await convo.save();
  }
  send({ type: 'done' });
  res.end();
}
