/**
 * Explicit, opt-in synthetic staging seed. NEVER run against real academic data.
 * Run only after a human verifies the Atlas cluster and the isolated database.
 * Defaults to dry-run and does not print passwords or connection strings.
 *
 * Required environment: MONGODB_URI, DEMO_STUDENT_PASSWORD, DEMO_ADMIN_PASSWORD
 * To write: SEED_SYNTHETIC_STAGING=I_CONFIRM_ISOLATED_STAGING
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import argon2 from 'argon2';
import { User } from '../dist/auth.js';
import { Student } from '../dist/models.js';

const dbName = 'ashesi_graduation_staging';
const studentId = 'DEMO-2028-001';
const accounts = [
  { identifier: 'demo.student.2028', role: 'STUDENT', studentId, password: process.env.DEMO_STUDENT_PASSWORD },
  { identifier: 'demo.admin', role: 'ADMIN', password: process.env.DEMO_ADMIN_PASSWORD }
];
const fail = (message) => { throw new Error(message); };
const uri = process.env.MONGODB_URI;
if (!uri) fail('MONGODB_URI is required');
let parsed;
try { parsed = new URL(uri); } catch { fail('Invalid MongoDB URI'); }
if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol) || decodeURIComponent(parsed.pathname.slice(1)) !== dbName) {
  fail('Refusing to run: MongoDB URI must explicitly target /' + dbName);
}
if (accounts.some(a => !a.password || a.password.length < 16 || a.password.length > 1024)) {
  fail('Set two distinct, randomly generated demo passwords of at least 16 characters via private environment variables');
}
if (accounts[0].password === accounts[1].password) fail('Demo passwords must be distinct');
if (process.env.SEED_SYNTHETIC_STAGING !== 'I_CONFIRM_ISOLATED_STAGING') {
  console.log('Dry run: would create/update two synthetic identities and one fictional student in', dbName);
  console.log('No database connection was made and no records were written.');
  process.exit(0);
}
try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  if (mongoose.connection.db?.databaseName !== dbName) fail('Database mismatch: refusing writes');
  const existingStudent = await Student.findOne({ studentId });
  if (existingStudent && existingStudent.fullName !== 'Demo Student (Synthetic)') {
    fail('Synthetic student ID collision: refusing overwrite');
  }
  for (const account of accounts) {
    const existing = await User.findOne({ identifier: account.identifier });
    if (existing && (existing.role !== account.role || (account.role === 'STUDENT' && existing.studentId !== studentId))) {
      fail('Account identifier collision: refusing overwrite');
    }
  }
  await Student.updateOne({ studentId }, { $setOnInsert: {
    studentId, fullName: 'Demo Student (Synthetic)', programme: 'CS', yearGroup: 2028, track: 'standard'
  } }, { upsert: true });
  for (const account of accounts) {
    const passwordHash = await argon2.hash(account.password, { type: argon2.argon2id });
    await User.updateOne({ identifier: account.identifier }, {
      $set: { passwordHash, role: account.role, ...(account.studentId ? { studentId: account.studentId } : {}), forcePasswordChange: false, failedLogins: 0 },
      $unset: { lockedUntil: '' }
    }, { upsert: true, runValidators: true });
  }
  console.log('Created/updated isolated synthetic staging accounts; no passwords printed.');
  console.log('Curriculum records remain unreviewed; academic previews must stay provisional.');
} finally {
  await mongoose.disconnect();
}
