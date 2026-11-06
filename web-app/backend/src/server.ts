import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';
import { z } from 'zod';
import { authenticate, issueAccessToken, requireAuth, requireRole, type AuthenticatedRequest } from './auth.js';
import { Student, Enrollment } from './models.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
const origins = (process.env.CORS_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({ origin: origins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.get('/health', (_req, res) => res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({ status: mongoose.connection.readyState === 1 ? 'ok' : 'unavailable' }));
const loginSchema = z.object({ identifier: z.string().min(3).max(64), password: z.string().min(1).max(1024) });
app.post('/api/v1/auth/login', async (req, res) => {
 const parsed = loginSchema.safeParse(req.body);
 if (!parsed.success) { res.status(400).json({ error: 'INVALID_INPUT' }); return; }
 try {
  const user = await authenticate(parsed.data.identifier, parsed.data.password);
  if (!user) { res.status(401).json({ error: 'INVALID_CREDENTIALS' }); return; }
  res.json({ accessToken: issueAccessToken({ id: user.id, role: user.role as 'STUDENT'|'ADMIN', studentId: user.studentId }), role: user.role, forcePasswordChange: user.forcePasswordChange });
 } catch { res.status(500).json({ error: 'INTERNAL_ERROR' }); }
});
app.get('/api/v1/students/me', requireAuth, async (req: AuthenticatedRequest, res) => {
 if (req.auth?.role !== 'STUDENT' || !req.auth.studentId) { res.status(403).json({ error: 'FORBIDDEN' }); return; }
 const student = await Student.findOne({ studentId: req.auth.studentId }).select('-__v').lean();
 if (!student) { res.status(404).json({ error: 'NOT_FOUND' }); return; }
 const courses = await Enrollment.find({ studentId: req.auth.studentId }).select('-__v').lean();
 res.json({ student, courses });
});
app.get('/api/v1/admin/students', requireAuth, requireRole('ADMIN'), async (req, res) => {
 const search = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 64) : '';
 const students = await Student.find(search ? { studentId: { $regex: '^' + search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') } } : {}).limit(50).select('-__v').lean();
 res.json({ students });
});
app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND' }));
async function start() {
 if (!process.env.MONGODB_URI || !process.env.JWT_ACCESS_SECRET) throw new Error('MONGODB_URI and JWT_ACCESS_SECRET are required');
 await mongoose.connect(process.env.MONGODB_URI);
 const server = app.listen(Number(process.env.PORT ?? 4000));
 const shutdown = () => { server.close(() => { void mongoose.disconnect().then(() => process.exit(0)); }); };
 process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
}
start().catch(error => { console.error(error); process.exit(1); });
