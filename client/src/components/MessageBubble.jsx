import ReactMarkdown from 'react-markdown';

const time = (d) => (d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

export default function MessageBubble({ message, canRegenerate, onRegenerate }) {
  const isUser = message.role === 'user';
  return (
    <div className={isUser ? 'row user' : 'row ai'}>
      <div className={isUser ? 'bubble user' : 'bubble ai'}>
        {isUser ? (
          <p className="plain">{message.content}</p>
        ) : (
          <div className={message.streaming ? 'md streaming' : 'md'}>
            {message.content ? <ReactMarkdown>{message.content}</ReactMarkdown> : <span className="thinking">Thinking</span>}
          </div>
        )}
      </div>
      <div className="meta">
        {!isUser && message.tone && <span>{message.tone}</span>}
        {message.stopped && <span>stopped</span>}
        {message.createdAt && <span>{time(message.createdAt)}</span>}
        {canRegenerate && !message.streaming && (
          <button className="link" onClick={onRegenerate}>Regenerate</button>
        )}
      </div>
    </div>
  );
}
