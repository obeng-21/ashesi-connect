import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../auth.js';
import { CurriculumRecord } from '../models/curriculum.js';
import { Student, Enrollment } from '../models.js';
import { mapEnrollmentTranscript, type EnrollmentRecord } from '../domain/eligibility/transcript-mapping.js';
import { previewAcademicProgress } from '../domain/eligibility/academic-preview.js';
import type { ProgrammeRules } from '../domain/eligibility/programme-audit.js';
import { selectCohortCurriculum, type CohortCurriculum } from '../domain/eligibility/cohort-selection.js';
import { previewGpa } from '../domain/eligibility/gpa-preview.js';
import { planCurriculumReview } from '../domain/eligibility/curriculum-review.js';
import type { CurriculumVersion } from '../domain/eligibility/curriculum-version.js';

export const curriculumRouter = Router();

const reviewRequestSchema = z.object({
 programme: z.string().trim().min(1).max(40),
 track: z.string().trim().min(1).max(100),
 version: z.string().trim().min(1).max(100),
 evidenceReference: z.string().trim().min(1).max(500)
}).strict();

/**
 * Administrator review is deliberately non-certifying. Only a draft with
 * validated rules and recorded evidence may be promoted to REVIEWED.
 * Conditional update prevents two concurrent reviewers from overwriting one another.
 */
curriculumRouter.post('/admin/curricula/review', requireAuth, requireRole('ADMIN'), async (req: AuthenticatedRequest, res) => {
 const parsed = reviewRequestSchema.safeParse(req.body);
 if (!parsed.success) { res.status(400).json({ error:'INVALID_INPUT' }); return; }
 if (!req.auth?.sub) { res.status(401).json({ error:'UNAUTHORIZED' }); return; }
 try {
  const { programme, track, version, evidenceReference } = parsed.data;
  const matches = await CurriculumRecord.find({ programme, track, version }).limit(2).lean();
  if (!matches.length) { res.status(404).json({ error:'CURRICULUM_NOT_FOUND' }); return; }
  if (matches.length !== 1) { res.status(409).json({ error:'AMBIGUOUS_CURRICULUM_RECORD' }); return; }
  const record = matches[0];
  const curriculum: CurriculumVersion = {
   version: String(record.version),
   status: record.status === 'DRAFT' ? 'DRAFT' : record.status === 'REVIEWED' ? 'REVIEWED' : 'SUPERSEDED',
   rules: record.rules as ProgrammeRules,
   sources: record.sources as CurriculumVersion['sources']
  };
  const decision = planCurriculumReview(curriculum,{
   reviewerId:req.auth.sub,evidenceReference,reviewedAt:new Date()
  });
  const existingIssues = Array.isArray(record.validationIssues) ? record.validationIssues : ['INVALID_VALIDATION_ISSUES'];
  if (existingIssues.length || !decision.accepted) {
   res.status(409).json({ error:'CURRICULUM_REVIEW_BLOCKED', issues:[...existingIssues,...decision.issues] }); return;
  }
  const updated = await CurriculumRecord.findOneAndUpdate(
   { programme,track,version,status:'DRAFT',validationIssues:{$size:0} },
   { $set: {status:'REVIEWED',review:decision.review,publishedAt:new Date()} },
   {new:true,runValidators:true}
  ).select('programme track version status review -_id').lean();
  if (!updated) { res.status(409).json({error:'CURRICULUM_REVIEW_CONFLICT'}); return; }
  res.json({ curriculum:updated, officialCertification:false });
 } catch { res.status(503).json({error:'CURRICULUM_REVIEW_UNAVAILABLE'}); }
});


/** Administrative catalogue metadata; no mutable rules or private student records. */
curriculumRouter.get('/admin/curricula', requireAuth, requireRole('ADMIN'), async (_req, res) => {
 try {
  const curricula = await CurriculumRecord.find({})
   .select('programme track version status validationIssues sourceWorkbookHash updatedAt -_id')
   .sort({ programme: 1, track: 1, version: -1 }).limit(200).lean();
  res.json({ curricula });
 } catch { res.status(503).json({ error: 'CURRICULUM_UNAVAILABLE' }); }
});

/** Student-scoped, read-only availability; never claims a graduation decision. */
curriculumRouter.get('/students/me/curriculum', requireAuth, async (req: AuthenticatedRequest, res) => {
 if (req.auth?.role !== 'STUDENT' || !req.auth.studentId) {
  res.status(403).json({ error: 'FORBIDDEN' }); return;
 }
 try {
  const student = await Student.findOne({ studentId: req.auth.studentId })
   .select('programme track yearGroup -_id').lean();
  if (!student) { res.status(404).json({ error: 'STUDENT_NOT_FOUND' }); return; }
  const curricula = await CurriculumRecord.find({
   programme: student.programme, track: student.track ?? 'standard', status: 'REVIEWED',
   validationIssues: { $size: 0 }
  }).select('programme track version status sources validationIssues updatedAt -_id').limit(200).lean();
  const selection = selectCohortCurriculum(student.yearGroup, curricula.map(c => ({
   version: String(c.version),
   status: c.status === 'REVIEWED' ? 'REVIEWED' as const : 'DRAFT' as const,
   validationIssues: Array.isArray(c.validationIssues) ? c.validationIssues.map(String) : ['INVALID_VALIDATION_ISSUES'],
   sources: Array.isArray(c.sources) ? c.sources.map((s: { effectiveYear?: unknown }) => ({
    effectiveYear: typeof s.effectiveYear === 'number' ? s.effectiveYear : Number.NaN
   })) : []
  })));
  res.json({
   programme: student.programme, track: student.track ?? 'standard', yearGroup: student.yearGroup,
   curricula: curricula.map(c => ({ programme:c.programme,track:c.track,version:c.version,status:c.status,updatedAt:c.updatedAt })),
   selectedVersion: selection.selectedVersion, selectionIssue: selection.issue,
   assessmentStatus: 'NOT_YET_CALCULATED', officialCertification: false
  });
 } catch { res.status(503).json({ error: 'CURRICULUM_UNAVAILABLE' }); }
});

/** Read-only student transcript readiness; does not infer GPA or issue graduation decisions. */
curriculumRouter.get('/students/me/audit-readiness', requireAuth, async (req: AuthenticatedRequest, res) => {
 if (req.auth?.role !== 'STUDENT' || !req.auth.studentId) {
  res.status(403).json({ error: 'FORBIDDEN' }); return;
 }
 try {
  const student = await Student.findOne({ studentId: req.auth.studentId })
   .select('programme track yearGroup -_id').lean();
  if (!student) { res.status(404).json({ error: 'STUDENT_NOT_FOUND' }); return; }
  const records = await Enrollment.find({ studentId: req.auth.studentId })
   .select('courseCode attempts -_id').lean();
  const mapping = mapEnrollmentTranscript(records as EnrollmentRecord[]);
  const curricula = await CurriculumRecord.find({
   programme: student.programme, track: student.track ?? 'standard', status: 'REVIEWED',
   validationIssues: { $size: 0 }
  }).select('version status validationIssues sources -_id').limit(200).lean();
  const selection = selectCohortCurriculum(student.yearGroup, curricula.map(c => ({
   version: String(c.version),
   status: c.status === 'REVIEWED' ? 'REVIEWED' as const : 'DRAFT' as const,
   validationIssues: Array.isArray(c.validationIssues) ? c.validationIssues.map(String) : ['INVALID_VALIDATION_ISSUES'],
   sources: Array.isArray(c.sources) ? c.sources.map((s: { effectiveYear?: unknown }) => ({
    effectiveYear: typeof s.effectiveYear === 'number' ? s.effectiveYear : Number.NaN
   })) : []
  })));
  const issues = [...mapping.issues];
  if (selection.issue) issues.push(selection.issue);
  if (!mapping.entries.length) issues.push('NO_USABLE_TRANSCRIPT_ENTRIES');
  res.json({
   programme: student.programme, track: student.track ?? 'standard',
   transcriptEntries: mapping.entries.length,
   curriculumVersion: selection.selectedVersion,
   status: 'INSUFFICIENT_DATA', issues,
   nextStep: 'CURRICULUM_AND_TRANSCRIPT_RECONCILIATION',
   officialCertification: false
  });
 } catch { res.status(503).json({ error: 'AUDIT_READINESS_UNAVAILABLE' }); }
});

/**
 * Provisional course-progress preview. The selected curriculum must be reviewed,
 * issue-free, and student-scoped. No official graduation certification is issued.
 */
curriculumRouter.get('/students/me/academic-preview', requireAuth, async (req: AuthenticatedRequest, res) => {
 if (req.auth?.role !== 'STUDENT' || !req.auth.studentId) {
  res.status(403).json({ error: 'FORBIDDEN' }); return;
 }
 try {
  const student = await Student.findOne({ studentId: req.auth.studentId })
   .select('programme track yearGroup -_id').lean();
  if (!student) { res.status(404).json({ error: 'STUDENT_NOT_FOUND' }); return; }
  const track = student.track ?? 'standard';
  const [records, curricula] = await Promise.all([
   Enrollment.find({ studentId: req.auth.studentId }).select('courseCode attempts -_id').lean(),
   CurriculumRecord.find({
    programme: student.programme, track, status: 'REVIEWED',
    validationIssues: { $size: 0 }
   }).select('version rules status validationIssues sources -_id').limit(200).lean()
  ]);
  const cohortCandidates: CohortCurriculum[] = curricula.map(c => ({
   version: String(c.version),
   status: c.status === 'REVIEWED' ? 'REVIEWED' : c.status === 'SUPERSEDED' ? 'SUPERSEDED' : 'DRAFT',
   validationIssues: Array.isArray(c.validationIssues) ? c.validationIssues.map(String) : ['INVALID_VALIDATION_ISSUES'],
   sources: Array.isArray(c.sources) ? c.sources.map((s: { effectiveYear?: unknown }) => ({
    effectiveYear: typeof s.effectiveYear === 'number' ? s.effectiveYear : Number.NaN
   })) : []
  }));
  const selection = selectCohortCurriculum(student.yearGroup, cohortCandidates);
  const selected = selection.selectedVersion
   ? curricula.find(c => c.version === selection.selectedVersion)
   : undefined;
  const enrollmentRecords = records as EnrollmentRecord[];
  const preview = previewAcademicProgress(enrollmentRecords, selected?.rules as ProgrammeRules | undefined ?? null);
  const transcript = mapEnrollmentTranscript(enrollmentRecords);
  const gpa = transcript.issues.length
   ? { gpa: null, gradedCredits: 0, issues: transcript.issues }
   : previewGpa(transcript.entries);
  const issues = [...preview.issues];
  if (selection.issue) issues.push(selection.issue);
  res.json({
   programme: student.programme, track, yearGroup: student.yearGroup,
   curriculumVersion: selected?.version ?? null,
   exploratoryGpa: gpa,
   ...preview,
   status: issues.length ? 'INSUFFICIENT_DATA' : preview.status,
   issues,
   officialCertification: false
  });
 } catch { res.status(503).json({ error: 'ACADEMIC_PREVIEW_UNAVAILABLE' }); }
});
