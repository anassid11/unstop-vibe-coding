import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ai-chat-assistant',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  provider: (process.env.LLM_PROVIDER || 'anthropic').toLowerCase(),
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
  openaiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  maxHistory: 20,
  maxMessageLength: 4000,
};
