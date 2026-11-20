import { useState, useRef, useCallback } from 'react';
import { api, streamChat } from '../api';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const patchLast = (c, fn) => ({ ...c, messages: c.messages.map((m, i) => (i === c.messages.length - 1 ? fn(m) : m)) });

/**
 * Owns the active conversation + streaming state.
 * Tokens arrive in bursts from the network; a small drain loop feeds them to the UI a few
 * characters per frame so the text appears to be typed character-by-character.
 */
export function useChat({ onSaved }) {
  const [conversation, setConversation] = useState(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef(null);
  const pendingRef = useRef('');
  const convRef = useRef(null);
  const savedRef = useRef(onSaved);
  convRef.current = conversation;
  savedRef.current = onSaved;

  const run = useCallback(async (payload) => {
    setError('');
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;
    pendingRef.current = '';
    let finished = false;
    let convId = payload.conversationId;

    const drain = setInterval(() => {
      const pending = pendingRef.current;
      if (!pending) {
        if (finished) clearInterval(drain);
        return;
      }
      const n = Math.max(1, Math.ceil(pending.length / 25)); // speeds up if we fall behind
      pendingRef.current = pending.slice(n);
      const chunk = pending.slice(0, n);
      setConversation((c) => c && patchLast(c, (m) => ({ ...m, content: m.content + chunk })));
    }, 16);

    try {
      await streamChat(payload, controller.signal, (evt) => {
        if (evt.type === 'meta') {
          convId = evt.conversationId;
          setConversation((c) => ({ ...c, _id: evt.conversationId, title: evt.title }));
        } else if (evt.type === 'token') pendingRef.current += evt.text;
        else if (evt.type === 'error') setError(evt.message);
      });
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message);
    } finally {
      finished = true;
      while (pendingRef.current) await sleep(30);
      if (convId) {
        if (controller.signal.aborted) await sleep(500); // let the server persist the partial reply
        try {
          setConversation(await api.get(convId));
        } catch {
          /* keep local copy */
        }
      }
      setStreaming(false);
      savedRef.current?.();
    }
  }, []);

  const send = useCallback(
    (message, tone) => {
      const c = convRef.current;
      setConversation({
        _id: c?._id ?? null,
        title: c?.title ?? 'New chat',
        messages: [
          ...(c?.messages ?? []),
          { role: 'user', content: message, createdAt: new Date().toISOString() },
          { role: 'assistant', content: '', tone, streaming: true },
        ],
      });
      return run({ conversationId: c?._id ?? undefined, message, tone });
    },
    [run]
  );

  const regenerate = useCallback(
    (tone) => {
      const c = convRef.current;
      if (!c?._id) return;
      const msgs = c.messages.filter((_, i) => !(i === c.messages.length - 1 && c.messages[i].role === 'assistant'));
      setConversation({ ...c, messages: [...msgs, { role: 'assistant', content: '', tone, streaming: true }] });
      return run({ conversationId: c._id, regenerate: true, tone });
    },
    [run]
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const open = useCallback(
    async (id) => {
      if (streaming) return;
      setError('');
      try {
        setConversation(await api.get(id));
      } catch (e) {
        setError(e.message);
      }
    },
    [streaming]
  );

  const reset = useCallback(() => {
    if (!streaming) {
      setConversation(null);
      setError('');
    }
  }, [streaming]);

  const rename = useCallback((id, title) => setConversation((c) => (c?._id === id ? { ...c, title } : c)), []);

  return { conversation, streaming, error, send, regenerate, stop, open, reset, rename };
}
