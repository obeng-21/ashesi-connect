import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';

const app = express();
app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean), credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.get('/health', (_req, res) => res.json({ status: mongoose.connection.readyState === 1 ? 'ok' : 'degraded' }));
app.get('/api/v1/status', (_req, res) => res.json({ service: 'ashesi-graduation-tracker', mode: 'foundation' }));
async function start() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(Number(process.env.PORT ?? 4000), () => console.info('API listening'));
}
start().catch(error => { console.error(error); process.exit(1); });
