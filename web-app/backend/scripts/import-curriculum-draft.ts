/**
 * Controlled, create-only curriculum draft importer.
 * Usage:
 *   npx tsx scripts/import-curriculum-draft.ts ./draft.json
 *   ALLOW_CURRICULUM_DRAFT_WRITE=yes MONGODB_URI=... npx tsx scripts/import-curriculum-draft.ts ./draft.json --write
 *
 * Dry-run by default. Never promotes a draft, overwrites existing versions,
 * or marks a curriculum verified. A reviewed curriculum requires a separate
 * authorization workflow, not this script.
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import mongoose from 'mongoose';
import { planCurriculumDraftImport } from '../src/domain/eligibility/curriculum-import.js';
import { CurriculumRecord } from '../src/models/curriculum.js';

/** Refuse curriculum draft writes unless the URI explicitly selects isolated staging. */
export function assertStagingCurriculumUri(uri: string) {
 let parsed: URL;
 try { parsed = new URL(uri); } catch { throw new Error('Invalid MongoDB URI'); }
 if (!['mongodb:', 'mongodb+srv:'].includes(parsed.protocol) ||
     decodeURIComponent(parsed.pathname.slice(1)) !== 'ashesi_graduation_staging') {
  throw new Error('Curriculum draft writes require an explicit /ashesi_graduation_staging database in MONGODB_URI');
 }
}

export function parseImportArgs(args: string[]) {
 const usage = 'Usage: import-curriculum-draft.ts <draft.json> [--write]';
 // Accept exactly one positional file followed by an optional explicit write flag.
 // Never silently ignore extra positional arguments or misplaced flags.
 if (args.length < 1 || args.length > 2 ||
     !args[0] || args[0].startsWith('--') ||
     (args.length === 2 && args[1] !== '--write')) {
  throw new Error(usage);
 }
 return { file: args[0], write: args.length === 2 };
}

async function main() {
 const { file, write } = parseImportArgs(process.argv.slice(2));
 const bytes = readFileSync(file);
 if (bytes.byteLength > 2_000_000) throw new Error('Draft exceeds 2 MB limit');
 const sourceFileHash = createHash('sha256').update(bytes).digest('hex');
 const plan = planCurriculumDraftImport(JSON.parse(bytes.toString('utf8')) as unknown);
 if (!plan.accepted || !plan.draft) {
  console.error(JSON.stringify({ accepted: false, issues: plan.issues }));
  process.exitCode = 1;
  return;
 }
 const { programme, track, version } = plan.draft;
 console.log(JSON.stringify({ accepted: true, mode: write ? 'CREATE_DRAFT' : 'DRY_RUN', programme, track, version, sourceFileHash }));
 if (!write) return;
 if (process.env.ALLOW_CURRICULUM_DRAFT_WRITE !== 'yes' || !process.env.MONGODB_URI) {
  throw new Error('Writes require ALLOW_CURRICULUM_DRAFT_WRITE=yes and MONGODB_URI');
 }
 assertStagingCurriculumUri(process.env.MONGODB_URI);
 await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
 if (mongoose.connection.db?.databaseName !== 'ashesi_graduation_staging') {
  await mongoose.disconnect();
  throw new Error('Connected database mismatch: refusing curriculum draft write');
 }
 try {
  // Create-only. Unique programme/track/version index prevents duplicate imports.
  await CurriculumRecord.create(plan.draft);
  console.log(JSON.stringify({ created: true, programme, track, version, status: 'DRAFT' }));
 } finally {
  await mongoose.disconnect();
 }
}

if (process.argv[1]?.includes('import-curriculum-draft')) {
 main().catch(error => {
  console.error('Curriculum import failed:', error instanceof Error ? error.message : 'unknown error');
  process.exitCode = 1;
 });
}
