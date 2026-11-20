import { app } from './app.js';
import { env } from './config/env.js';
import { connectDb } from './config/db.js';

connectDb()
  .then(() => app.listen(env.port, () => console.log(`API on http://localhost:${env.port} (provider: ${env.provider})`)))
  .catch((err) => {
    console.error('Failed to start:', err.message);
    process.exit(1);
  });
