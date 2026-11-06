import { Schema, model, models } from 'mongoose';
import type { CurriculumVersion } from '../domain/eligibility/curriculum-version.js';
import { validateCurriculum } from '../domain/eligibility/curriculum-version.js';

const sourceSchema = new Schema({
 sourceUrl: { type: String, required: true },
 sourceKind: { type: String, enum: ['OFFICIAL_WEBSITE','REGISTRY_PROVIDED_WORKBOOK'], required: true },
 retrievedAt: { type: String, required: true },
 effectiveYear: { type: Number, required: true },
 contentHash: { type: String, required: true }
}, { _id: false });

const curriculumSchema = new Schema({
 programme: { type: String, required: true },
 track: { type: String, required: true },
 version: { type: String, required: true },
 status: { type: String, enum: ['DRAFT','REVIEWED','SUPERSEDED'], default: 'DRAFT', required: true },
 rules: { type: Schema.Types.Mixed, required: true },
 sources: { type: [sourceSchema], required: true },
 validationIssues: { type: [String], default: [] },
 sourceWorkbookHash: String,
 review: { reviewerId: String, reviewedAt: Date, evidenceReference: String },
 publishedAt: Date
}, { timestamps: true, strict: true });
curriculumSchema.index({ programme: 1, track: 1, version: 1 }, { unique: true });
curriculumSchema.index({ programme: 1, track: 1, status: 1 });

export const CurriculumRecord = models.CurriculumRecord || model('CurriculumRecord', curriculumSchema);

export type CurriculumDraftInput = CurriculumVersion & { sourceWorkbookHash?: string };
export function toCurriculumDraft(input: CurriculumDraftInput) {
 const validation = validateCurriculum(input);
 return {
  programme: input.rules.programme,
  track: input.rules.track,
  version: input.version,
  status: 'DRAFT' as const,
  rules: { ...input.rules, verifiedByRegistry: false },
  sources: input.sources,
  validationIssues: validation.issues,
  sourceWorkbookHash: input.sourceWorkbookHash
 };
}
