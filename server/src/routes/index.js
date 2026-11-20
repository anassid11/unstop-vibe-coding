import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { validateChatBody, validateObjectId } from '../middleware/validate.js';
import { streamChat } from '../controllers/chat.controller.js';
import * as c from '../controllers/conversation.controller.js';

const router = Router();

router.get('/health', (_req, res) => res.json({ ok: true }));
router.get('/tones', c.getTones);

router.post('/chat/stream', validateChatBody, h(streamChat));

router.get('/conversations', h(c.listConversations));
router.get('/conversations/:id', validateObjectId, h(c.getConversation));
router.patch('/conversations/:id', validateObjectId, h(c.renameConversation));
router.delete('/conversations/:id', validateObjectId, h(c.deleteConversation));
router.get('/conversations/:id/export', validateObjectId, h(c.exportConversation));

export default router;
