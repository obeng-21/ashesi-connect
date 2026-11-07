import { z } from 'zod';
import { validateCurriculum, type CurriculumVersion } from './curriculum-version.js';
import { toCurriculumDraft } from '../../models/curriculum.js';

const grade = z.enum(['A+','A','B+','B','C+','C','D+','D' ,'E']);
const rule = z.object({
 courseCode: z.string().trim().min(1).max(32),
 credits: z.number().finite().positive().max(10),
 minimumGrade: grade,
 category: z.string().trim().min(1).max(100)
}).strict();
const pool = z.object({
 category: z.string().trim().min(1).max(100),
 creditsRequired: z.number().finite().nonnegative().max(100),
 courseCodes: z.array(z.string().trim().min(1).max(32)).max(500),
 africanStudiesMinimum: z.number().finite().nonnegative().optional(),
 minimumGrade: grade.optional()
}).strict();
const source = z.object({
 sourceUrl: z.string().url().startsWith('https://'),
 sourceKind: z.enum(['OFFICIAL_WEBSITE','REGISTRY_PROVIDED_WORKBOOK']),
 retrievedAt: z.string().datetime(),
 effectiveYear: z.number().int().min(2000).max(2200),
 contentHash: z.string().trim().min(1).max(256)
}).strict();
export const curriculumDraftSchema = z.object({
 version: z.string().trim().min(1).max(100),
 status: z.literal('DRAFT'),
 rules: z.object({
  programme: z.string().trim().min(1).max(40),
  track: z.string().trim().min(1).max(100),
  totalCredits: z.number().finite().positive().max(200),
  verifiedByRegistry: z.literal(false),
  requiredCourses: z.array(rule).min(1).max(500),
  electivePools: z.array(pool).max(100)
 }).strict(),
 sources: z.array(source).min(1).max(30),
 sourceWorkbookHash: z.string().regex(/^[a-f0-9]{64}$/i).optional()
}).strict();

export type ImportPlan = {
 accepted: boolean;
 issues: string[];
 draft: ReturnType<typeof toCurriculumDraft> | null;
};
export function planCurriculumDraftImport(raw: unknown): ImportPlan {
 const parsed = curriculumDraftSchema.safeParse(raw);
 if (!parsed.success) return { accepted: false, issues: parsed.error.issues.map(x => x.path.join('.') + ':' + x.code), draft: null };
 const input = parsed.data as CurriculumVersion & { sourceWorkbookHash?: string };
 const validation = validateCurriculum(input);
 if (!validation.valid) return { accepted: false, issues: validation.issues, draft: null };
 return { accepted: true, issues: [], draft: toCurriculumDraft(input) };
}
