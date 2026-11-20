async function json(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText);
  }
  return res.status === 204 ? null : res.json();
}

const headers = { 'Content-Type': 'application/json' };

export const api = {
  tones: () => fetch('/api/tones').then(json),
  list: (q = '') => fetch(`/api/conversations?q=${encodeURIComponent(q)}`).then(json),
  get: (id) => fetch(`/api/conversations/${id}`).then(json),
  rename: (id, title) => fetch(`/api/conversations/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ title }) }).then(json),
  remove: (id) => fetch(`/api/conversations/${id}`, { method: 'DELETE' }).then(json),
  exportUrl: (id) => `/api/conversations/${id}/export`,
};

// POST + read the SSE stream manually (EventSource can't POST).
export async function streamChat(payload, signal, onEvent) {
  const res = await fetch('/api/chat/stream', { method: 'POST', headers, body: JSON.stringify(payload), signal });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Request failed');
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const frames = buffer.split('\n\n');
    buffer = frames.pop();
    for (const frame of frames) if (frame.startsWith('data: ')) onEvent(JSON.parse(frame.slice(6)));
  }
}
