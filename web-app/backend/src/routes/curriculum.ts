import { Router } from 'express';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../auth.js';
import { CurriculumRecord } from '../models/curriculum.js';
import { Student, Enrollment } from '../models.js';
import { mapEnrollmentTranscript, type EnrollmentRecord } from '../domain/eligibility/transcript-mapping.js';
import { previewAcademicProgress } from '../domain/eligibility/academic-preview.js';
import type { ProgrammeRules } from '../domain/eligibility/programme-audit.js';
import { selectCohortCurriculum, type CohortCurriculum } from '../domain/eligibility/cohort-selection.js';

export const curriculumRouter = Router();

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
  }).select('programme track version status updatedAt -_id').sort({ version: -1 }).limit(20).lean();
  res.json({
   programme: student.programme, track: student.track ?? 'standard', yearGroup: student.yearGroup,
   curricula, assessmentStatus: 'NOT_YET_CALCULATED', officialCertification: false
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
  }).select('version -_id').limit(1).lean();
  const issues = [...mapping.issues];
  if (!curricula.length) issues.push('NO_REVIEWED_CURRICULUM');
  if (!mapping.entries.length) issues.push('NO_USABLE_TRANSCRIPT_ENTRIES');
  res.json({
   programme: student.programme, track: student.track ?? 'standard',
   transcriptEntries: mapping.entries.length,
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
  const selection = selectCohortCurriculum(student.yearGroup, curricula as CohortCurriculum[]);
  const selected = selection.selectedVersion
   ? curricula.find(c => c.version === selection.selectedVersion)
   : undefined;
  const preview = previewAcademicProgress(records as EnrollmentRecord[], selected?.rules as ProgrammeRules | undefined ?? null);
  const issues = [...preview.issues];
  if (selection.issue) issues.push(selection.issue);
  res.json({
   programme: student.programme, track, yearGroup: student.yearGroup,
   curriculumVersion: selected?.version ?? null,
   ...preview,
   status: issues.length ? 'INSUFFICIENT_DATA' : preview.status,
   issues,
   officialCertification: false
  });
 } catch { res.status(503).json({ error: 'ACADEMIC_PREVIEW_UNAVAILABLE' }); }
});
