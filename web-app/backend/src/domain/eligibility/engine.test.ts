import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluate, evaluateProgramme, meetsThreshold, type CourseRecord } from './engine.js';

const req = [
  { code: 'CS101', credits: 1, category: 'Major', minPassingGrade: 'C' as const },
  { code: 'ENG101', credits: 1, category: 'Core', minPassingGrade: 'D+' as const }
];
const record = (code: string, grade: CourseRecord['grade'], attempt = 1): CourseRecord =>
  ({ code, credits: 1, grade, attempt });

describe('eligibility evaluator', () => {
  it('applies different C and D+ passing thresholds', () => {
    assert.equal(meetsThreshold('D+', 'C'), false);
    assert.equal(meetsThreshold('D+', 'D+'), true);
    assert.equal(meetsThreshold('C', 'C'), true);
  });
  it('does not graduate students with failed required courses', () => {
    const result = evaluate([record('CS101', 'D+'), record('ENG101', 'D+')], req, 2);
    assert.equal(result.eligible, false);
    assert.equal(result.creditsEarned, 1);
    assert.ok(result.remainingRequirements.some(x => x.code === 'CS101' && x.reason === 'FAILED'));
  });
  it('accepts a passing retake and does not double count credits', () => {
    const result = evaluate([
      record('CS101', 'D', 1), record('CS101', 'B+', 2),
      record('ENG101', 'A')
    ], req, 2);
    assert.equal(result.eligible, true);
    assert.equal(result.creditsEarned, 2);
  });
  it('does not count in-progress courses as earned credits', () => {
    const result = evaluate([{ code: 'CS101', credits: 1, status: 'Enrolled', attempt: 1 }], req, 2);
    assert.equal(result.creditsEarned, 0);
    assert.equal(result.creditsInProgress, 1);
    assert.ok(result.remainingRequirements.some(x => x.reason === 'IN_PROGRESS'));
  });
  it('requires African Studies when configured', () => {
    const base = { requiredCourses: [], creditsRequired: 1, requiresAfricanStudies: true,
      africanStudiesCourseCodes: ['AFR101'],
      electiveGroups: [{ id: 'ELECTIVE', category: 'Non-major', credits: 1, eligibleCourseCodes: ['AFR101'] }] };
    assert.equal(evaluateProgramme([record('AFR101', 'B')], base).eligible, true);
    assert.ok(evaluateProgramme([record('ENG101', 'B')], base)
      .remainingRequirements.some(x => x.reason === 'AFRICAN_STUDIES_MISSING'));
  });
  it('enforces elective credit and count minimums', () => {
    const result = evaluateProgramme([record('ELE101', 'A')], {
      requiredCourses: [], creditsRequired: 2,
      electiveGroups: [{ id: 'MAJOR_ELECTIVES', category: 'Major', credits: 2,
        minCourses: 2, eligibleCourseCodes: ['ELE101', 'ELE102'] }]
    });
    assert.equal(result.eligible, false);
    assert.ok(result.remainingRequirements.some(x => x.reason === 'ELECTIVE_SLOT_OPEN'));
  });
  it('rejects duplicate required courses', () => {
    assert.throws(() => evaluate([], [req[0], req[0]], 2), /Duplicate required course/);
  });
});
