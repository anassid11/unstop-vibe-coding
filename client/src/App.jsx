import { useCallback, useEffect, useState } from 'react';
import { api } from './api';
import { useChat } from './hooks/useChat';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import Composer from './components/Composer';

const FALLBACK_TONES = [
  { id: 'professional', label: 'Professional', description: '' },
  { id: 'casual', label: 'Casual', description: '' },
  { id: 'concise', label: 'Concise', description: '' },
];

export default function App() {
  const [tones, setTones] = useState(FALLBACK_TONES);
  const [tone, setTone] = useState(() => localStorage.getItem('tone') || 'professional');
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setItems(await api.list(query));
    } catch {
      /* sidebar stays as is */
    }
  }, [query]);

  const chat = useChat({ onSaved: refresh });
  const activeId = chat.conversation?._id;

  useEffect(() => {
    api.tones().then(setTones).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(refresh, 250);
    return () => clearTimeout(t);
  }, [refresh]);

  const changeTone = (t) => {
    setTone(t);
    localStorage.setItem('tone', t);
  };

  const afterListChange = (deletedId) => {
    if (deletedId && deletedId === activeId) chat.reset();
    refresh();
  };

  return (
    <div className="app">
      <Sidebar
        items={items}
        activeId={activeId}
        query={query}
        onQuery={setQuery}
        open={menu}
        onNew={() => { chat.reset(); setMenu(false); }}
        onOpen={(id) => { chat.open(id); setMenu(false); }}
        onChanged={afterListChange}
        onRenamed={chat.rename}
      />
      <main className="main">
        <header className="topbar">
          <button className="menu" onClick={() => setMenu((v) => !v)} aria-label="Toggle history">History</button>
          <h2>{chat.conversation?.title ?? 'New chat'}</h2>
          {activeId && <a className="export" href={api.exportUrl(activeId)}>Export Markdown</a>}
        </header>
        <ChatWindow
          conversation={chat.conversation}
          streaming={chat.streaming}
          onRegenerate={() => chat.regenerate(tone)}
          onStarter={(s) => chat.send(s, tone)}
        />
        {chat.error && <div className="error" role="alert">{chat.error}</div>}
        <Composer
          tones={tones}
          tone={tone}
          onTone={changeTone}
          streaming={chat.streaming}
          onSend={(m) => chat.send(m, tone)}
          onStop={chat.stop}
        />
      </main>
    </div>
  );
}
