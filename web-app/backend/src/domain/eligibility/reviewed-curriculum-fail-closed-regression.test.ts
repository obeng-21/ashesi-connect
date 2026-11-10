import { describe, expect, it } from 'vitest';
import { validateCurriculum, type CurriculumVersion } from './curriculum-version.js';

function reviewedFixture(): CurriculumVersion {
  return {
    version: '2028-reviewed-test',
    status: 'REVIEWED',
    rules: {
      programme: 'CS',
      track: 'standard',
      totalCredits: 3,
      verifiedByRegistry: false,
      requiredCourses: [{ courseCode: 'CS101', credits: 1, minimumGrade: 'D+', category: 'Major' }],
      electivePools: [{ category: 'General', creditsRequired: 1, courseCodes: ['E101'] }],
    },
    sources: [{
      sourceUrl: 'https://example.edu/catalogue',
      sourceKind: 'OFFICIAL_WEBSITE',
      retrievedAt: '2026-11-06T00:00:00.000Z',
      effectiveYear: 2028,
      contentHash: 'sha256-test',
    }],
  };
}

describe('reviewed curriculum invalid metadata and credit regression', () => {
  it('fails closed when reviewed provenance has an invalid retrieval timestamp', () => {
    const curriculum = reviewedFixture();
    curriculum.sources[0].retrievedAt = 'invalid-date';
    const result = validateCurriculum(curriculum);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('INVALID_SOURCE_METADATA');
    expect(result.issues).toContain('REVIEWED_CURRICULUM_INVALID');
  });

  it('fails closed when a reviewed elective requirement is negative', () => {
    const curriculum = reviewedFixture();
    curriculum.rules.electivePools[0].creditsRequired = -1;
    const result = validateCurriculum(curriculum);
    expect(result.valid).toBe(false);
    expect(result.issues).toContain('INVALID_ELECTIVE_CREDITS');
    expect(result.issues).toContain('REVIEWED_CURRICULUM_INVALID');
  });
});
