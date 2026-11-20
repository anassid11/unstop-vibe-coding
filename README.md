# AI Chat Assistant

Streaming chat app: React (Vite) + Express + MongoDB, with Anthropic/OpenAI behind one service.

## Run
```bash
# 1. backend
cd server && cp .env.example .env     # add ANTHROPIC_API_KEY (or set LLM_PROVIDER=openai / mock)
npm install && npm run dev            # http://localhost:5000

# 2. frontend
cd client && npm install && npm run dev   # http://localhost:5173 (proxies /api to :5000)
```
Needs MongoDB running locally (or set `MONGODB_URI` to Atlas). `LLM_PROVIDER=mock` demos the UI with no API key.

## Features
- Scrollable chat with distinct user / AI bubbles (Markdown rendered)
- Streaming: server relays provider tokens over SSE; client types them out smoothly
- History sidebar: past threads, open / rename / delete
- MongoDB persistence: conversation `{ title, messages[{ role, content, tone, createdAt }] }`
- **Tone Toggle** (Professional / Casual / Concise): client sends a tone id, the server maps it to a
  system-instruction modifier on every request, so the next reply changes instantly
- **Extra 1: Stop + Regenerate** — Stop aborts the upstream LLM call and saves the partial reply;
  Regenerate re-answers the last prompt (try it with a different tone)
- **Extra 2: Search + Export** — search sidebar by title or message content; export a thread as Markdown

## API
| Method | Path | Purpose |
|---|---|---|
| POST | `/api/chat/stream` | SSE: `meta` → `token`* → `done` (body: `conversationId?`, `message`, `tone`, `regenerate?`) |
| GET | `/api/conversations?q=` | list / search |
| GET / PATCH / DELETE | `/api/conversations/:id` | read / rename / delete |
| GET | `/api/conversations/:id/export` | Markdown download |
| GET | `/api/tones` | tone options (server is the source of truth) |

## Structure
```
server/src  config/ models/ services/(tone, llm) controllers/ routes/ middleware/(validate, error) utils/
client/src  api.js hooks/useChat.js components/(Sidebar, ChatWindow, MessageBubble, Composer, ToneToggle)
```
All validation, tone logic, title generation, history trimming and persistence are server-side; the client only renders.
