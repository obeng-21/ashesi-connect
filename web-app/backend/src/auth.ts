import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { Schema, model } from 'mongoose';
import type { Request, Response, NextFunction } from 'express';

export type Role = 'STUDENT' | 'ADMIN';
const userSchema = new Schema({
  identifier: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, required: true, enum: ['STUDENT', 'ADMIN'] },
  studentId: { type: String, index: true },
  forcePasswordChange: { type: Boolean, default: true },
  failedLogins: { type: Number, default: 0 },
  lockedUntil: { type: Date }
}, { timestamps: true });
export const User = model('User', userSchema);

export async function authenticate(identifier: string, password: string) {
  const user = await User.findOne({ identifier }).select('+passwordHash');
  if (!user || (user.lockedUntil && user.lockedUntil > new Date())) return null;
  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) {
    user.failedLogins += 1;
    if (user.failedLogins >= 5) user.lockedUntil = new Date(Date.now() + 15 * 60_000);
    await user.save();
    return null;
  }
  user.failedLogins = 0;
  user.lockedUntil = undefined;
  await user.save();
  return user;
}
export function issueAccessToken(user: { id: string; role: Role; studentId?: string }) {
  if (!process.env.JWT_ACCESS_SECRET) throw new Error('JWT_ACCESS_SECRET required');
  return jwt.sign({ role: user.role, studentId: user.studentId }, process.env.JWT_ACCESS_SECRET, {
    subject: user.id, expiresIn: '15m', issuer: 'ashesi-graduation-tracker', audience: 'ashesi-api'
  });
}
export interface AuthenticatedRequest extends Request {
  auth?: { sub: string; role: Role; studentId?: string };
}
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = /^Bearer (.+)$/.exec(req.header('authorization') ?? '')?.[1];
  if (!token || !process.env.JWT_ACCESS_SECRET) { res.status(401).json({ error: 'UNAUTHORIZED' }); return; }
  try {
    const claims = jwt.verify(token, process.env.JWT_ACCESS_SECRET, { issuer: 'ashesi-graduation-tracker', audience: 'ashesi-api' });
    if (typeof claims === 'string' || !claims.sub || !['ADMIN','STUDENT'].includes(claims.role)) throw Error('Invalid token');
    req.auth = { sub: claims.sub, role: claims.role as Role, studentId: claims.studentId };
    next();
  } catch { res.status(401).json({ error: 'UNAUTHORIZED' }); }
}
export function requireRole(role: Role) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.auth?.role !== role) { res.status(403).json({ error: 'FORBIDDEN' }); return; }
    next();
  };
}
