import type { TranscriptEntry } from './programme-audit.js';
import type { Grade } from './engine.js';

export type EnrollmentRecord = {
 courseCode: string;
 attempts: Array<{ courseCode?: string; credits: number; grade?: string; status: string }>;
};
const grades = new Set<Grade>(['A+','A','B+','B','C+','C','D+','D','E']);
export type TranscriptMapping = { entries: TranscriptEntry[]; issues: string[] };

/** Fail closed when enrollment records contain unsupported grades or missing credits. */
export function mapEnrollmentTranscript(records: EnrollmentRecord[]): TranscriptMapping {
 const entries: TranscriptEntry[] = [];
 const issues: string[] = [];
 for (const record of records) {
  if (!record.courseCode.trim()) { issues.push('EMPTY_COURSE_CODE'); continue; }
  for (const [index, attempt] of record.attempts.entries()) {
   if (attempt.courseCode && attempt.courseCode !== record.courseCode) {
    issues.push('COURSE_CODE_MISMATCH:' + record.courseCode); continue;
   }
   if (!Number.isFinite(attempt.credits) || attempt.credits <= 0) {
    issues.push('INVALID_CREDITS:' + record.courseCode); continue;
   }
   if (attempt.status === 'COMPLETED') {
    if (!attempt.grade || !grades.has(attempt.grade as Grade)) {
     issues.push('UNKNOWN_GRADE:' + record.courseCode); continue;
    }
    entries.push({ courseCode: record.courseCode, grade: attempt.grade as Grade, attempt: index + 1, credits: attempt.credits });
   } else if (attempt.status === 'ENROLLED' || attempt.status === 'INCOMPLETE') {
    entries.push({ courseCode: record.courseCode, status: attempt.status === 'ENROLLED' ? 'IN_PROGRESS' : 'INCOMPLETE', attempt: index + 1, credits: attempt.credits });
   } else {
    issues.push('UNKNOWN_STATUS:' + record.courseCode);
   }
  }
 }
 return { entries, issues };
}
