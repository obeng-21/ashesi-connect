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

export function parseImportArgs(args: string[]) {
 if (args.length < 1 || args.length > 2 || args.some(x => x.startsWith('--') && x !== '--write')) {
  throw new Error('Usage: import-curriculum-draft.ts <draft.json> [--write]');
 }
 const file = args.find(x => x !== '--write');
 if (!file || args.filter(x => x === '--write').length > 1) throw new Error('Invalid import arguments');
 return { file, write: args.includes('--write') };
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
 await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
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
