import { useState } from 'react';
import ToneToggle from './ToneToggle';

export default function Composer({ tones, tone, onTone, streaming, onSend, onStop }) {
  const [text, setText] = useState('');

  const submit = () => {
    const value = text.trim();
    if (!value || streaming) return;
    onSend(value);
    setText('');
  };

  return (
    <div className="composer">
      <ToneToggle tones={tones} value={tone} onChange={onTone} />
      <div className="input-row">
        <textarea
          rows={1}
          value={text}
          placeholder="Message the assistant"
          maxLength={4000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        {streaming ? (
          <button className="send stop" onClick={onStop}>Stop</button>
        ) : (
          <button className="send" onClick={submit} disabled={!text.trim()}>Send</button>
        )}
      </div>
    </div>
  );
}
