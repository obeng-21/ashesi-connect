import { describe, expect, it } from 'vitest';
import { mapEnrollmentTranscript } from './transcript-mapping.js';

describe('enrollment transcript mapping', () => {
 it('maps completed and enrolled attempts without conflating their status', () => {
  const mapped = mapEnrollmentTranscript([{ courseCode: 'CS101', attempts: [
   { credits: 1, grade: 'D+', status: 'COMPLETED' },
   { credits: 1, status: 'ENROLLED' }
  ] }]);
  expect(mapped.issues).toEqual([]);
  expect(mapped.entries).toEqual([
   { courseCode: 'CS101', credits: 1, grade: 'D+', attempt: 1 },
   { courseCode: 'CS101', credits: 1, status: 'IN_PROGRESS', attempt: 2 }
  ]);
 });
 it('rejects an unsupported grade', () => {
  const mapped = mapEnrollmentTranscript([{ courseCode: 'CS101', attempts: [{ credits: 1, grade: 'P', status: 'COMPLETED' }] }]);
  expect(mapped.issues).toContain('UNKNOWN_GRADE:CS101');
 });
 it('rejects contradictory course identity and invalid credits', () => {
  const mapped = mapEnrollmentTranscript([{ courseCode: 'CS101', attempts: [
   { courseCode: 'CS102', credits: 1, grade: 'A', status: 'COMPLETED' },
   { credits: 0, grade: 'A', status: 'COMPLETED' }
  ] }]);
  expect(mapped.issues).toContain('COURSE_CODE_MISMATCH:CS101');
  expect(mapped.issues).toContain('INVALID_CREDITS:CS101');
 });
});
