import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { HttpError } from '../utils/HttpError.js';
import { isValidTone } from '../services/tone.service.js';

export function validateChatBody(req, _res, next) {
  const { conversationId, message, tone, regenerate } = req.body ?? {};

  if (!isValidTone(tone)) throw new HttpError(400, 'tone must be professional, casual or concise');
  if (conversationId !== undefined && conversationId !== null && !mongoose.isValidObjectId(conversationId))
    throw new HttpError(400, 'Invalid conversationId');

  if (regenerate) {
    if (!conversationId) throw new HttpError(400, 'regenerate requires conversationId');
  } else {
    if (typeof message !== 'string' || !message.trim()) throw new HttpError(400, 'message is required');
    if (message.length > env.maxMessageLength)
      throw new HttpError(400, `message must be under ${env.maxMessageLength} characters`);
  }
  next();
}

export function validateObjectId(req, _res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, 'Invalid conversation id');
  next();
}
