import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

const STARTERS = [
  'Explain how HTTP streaming works in plain terms',
  'Draft a polite follow-up email to a recruiter',
  'Give me a 5-step plan to learn MongoDB indexing',
];

export default function ChatWindow({ conversation, streaming, onRegenerate, onStarter }) {
  const endRef = useRef(null);
  const messages = conversation?.messages ?? [];
  const last = messages.at(-1);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [last?.content, messages.length]);

  if (!messages.length) {
    return (
      <div className="chat empty">
        <h1>What are we working on?</h1>
        <p>Pick a tone below, then ask anything. Switching tone changes the very next reply.</p>
        <div className="starters">
          {STARTERS.map((s) => (
            <button key={s} onClick={() => onStarter(s)}>{s}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="chat" aria-live="polite">
      <div className="thread-col">
        {messages.map((m, i) => (
          <MessageBubble
            key={m._id ?? i}
            message={m}
            canRegenerate={!streaming && i === messages.length - 1 && m.role === 'assistant'}
            onRegenerate={onRegenerate}
          />
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
