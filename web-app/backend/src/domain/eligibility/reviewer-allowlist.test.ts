import { describe, expect, it } from 'vitest';
import { isAllowedCurriculumReviewer } from './reviewer-allowlist.js';

describe('curriculum reviewer allowlist', () => {
 it('rejects missing identity or configuration', () => {
  expect(isAllowedCurriculumReviewer(undefined, 'admin-1')).toBe(false);
  expect(isAllowedCurriculumReviewer('admin-1', undefined)).toBe(false);
  expect(isAllowedCurriculumReviewer('admin-1', '')).toBe(false);
 });
 it('requires an exact authenticated user ID match', () => {
  expect(isAllowedCurriculumReviewer('admin-1', 'admin-10,admin-2')).toBe(false);
  expect(isAllowedCurriculumReviewer('admin-1', 'admin-1, admin-2')).toBe(true);
  expect(isAllowedCurriculumReviewer('admin-1', 'ADMIN-1')).toBe(false);
 });
 it('rejects empty list elements', () => {
  expect(isAllowedCurriculumReviewer('admin-1', ' , , ')).toBe(false);
 });
});
