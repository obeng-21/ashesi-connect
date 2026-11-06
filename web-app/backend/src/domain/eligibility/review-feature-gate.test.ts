import { describe, expect, it } from 'vitest';
import { isCurriculumReviewEnabled } from './review-feature-gate.js';

describe('curriculum review feature gate', () => {
 it('is disabled when configuration is absent', () => {
  expect(isCurriculumReviewEnabled(undefined)).toBe(false);
 });
 it.each(['', 'true', '1', 'YES', 'yes ', 'no'])('rejects unsafe or ambiguous opt-in %s', value => {
  expect(isCurriculumReviewEnabled(value)).toBe(false);
 });
 it('accepts only an exact explicit opt-in', () => {
  expect(isCurriculumReviewEnabled('yes')).toBe(true);
 });
});
