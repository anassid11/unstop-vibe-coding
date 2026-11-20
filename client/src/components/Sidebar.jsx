import { api } from '../api';

const fmt = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export default function Sidebar({ items, activeId, query, onQuery, onNew, onOpen, onChanged, onRenamed, open }) {
  const rename = async (e, c) => {
    e.stopPropagation();
    const title = window.prompt('Rename conversation', c.title)?.trim();
    if (!title || title === c.title) return;
    try {
      await api.rename(c._id, title);
      onRenamed(c._id, title);
      onChanged();
    } catch (err) {
      window.alert(err.message);
    }
  };

  const remove = async (e, c) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${c.title}"?`)) return;
    await api.remove(c._id);
    onChanged(c._id);
  };

  return (
    <aside className={open ? 'sidebar open' : 'sidebar'}>
      <button className="new-chat" onClick={onNew}>New chat</button>
      <input
        className="search"
        type="search"
        placeholder="Search conversations"
        value={query}
        onChange={(e) => onQuery(e.target.value)}
        aria-label="Search conversations"
      />
      <ul className="history">
        {items.map((c) => (
          <li key={c._id}>
            <div
              role="button"
              tabIndex={0}
              className={c._id === activeId ? 'thread active' : 'thread'}
              onClick={() => onOpen(c._id)}
              onKeyDown={(e) => e.key === 'Enter' && onOpen(c._id)}
            >
              <span className="thread-title">{c.title}</span>
              <span className="thread-date">{fmt(c.updatedAt)}</span>
              <span className="thread-actions">
                <button onClick={(e) => rename(e, c)} aria-label="Rename">Rename</button>
                <button onClick={(e) => remove(e, c)} aria-label="Delete">Delete</button>
              </span>
            </div>
          </li>
        ))}
        {!items.length && <li className="empty-note">{query ? 'No conversations match.' : 'Your conversations will appear here.'}</li>}
      </ul>
    </aside>
  );
}
