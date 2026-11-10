import { describe, expect, it } from 'vitest';
import { isCurriculumReviewEnabled } from './review-feature-gate.js';
import { isAllowedCurriculumReviewer } from './reviewer-allowlist.js';
import { planCurriculumReview } from './curriculum-review.js';
import type { CurriculumVersion } from './curriculum-version.js';

const validDraft: CurriculumVersion = {
 version:'2028-v1', status:'DRAFT',
 rules:{programme:'CS',track:'standard',totalCredits:3,verifiedByRegistry:false,
  requiredCourses:[{courseCode:'CS101',credits:1,minimumGrade:'D+',category:'Major'}],electivePools:[]},
 sources:[{sourceUrl:'https://example.edu',sourceKind:'OFFICIAL_WEBSITE',
  retrievedAt:'2026-11-06T00:00:00Z',effectiveYear:2028,contentHash:'test-hash'}]
};
function reviewAttempt(flag:string|undefined, allowlist:string|undefined, id:string|undefined, draft:CurriculumVersion) {
 if (!isCurriculumReviewEnabled(flag)) return 'DISABLED';
 if (!isAllowedCurriculumReviewer(id,allowlist)) return 'DENIED';
 return planCurriculumReview(draft,{
  reviewerId:id!,evidenceReference:'registry-reference-123',reviewedAt:new Date('2026-11-06')
 }).accepted ? 'REVIEWABLE' : 'BLOCKED';
}
describe('curriculum review defense-in-depth decision matrix',()=>{
 it('denies by default even when a reviewer ID is configured',()=>{
  expect(reviewAttempt(undefined,'admin-1','admin-1',validDraft)).toBe('DISABLED');
 });
 it('denies non-allowlisted administrators even when enabled',()=>{
  expect(reviewAttempt('yes','admin-2','admin-1',validDraft)).toBe('DENIED');
 });
 it('denies invalid curriculum even for allowlisted admins',()=>{
  expect(reviewAttempt('yes','admin-1','admin-1',{...validDraft,rules:{...validDraft.rules,requiredCourses:[]}})).toBe('BLOCKED');
 });
 it('allows planning only when all guards pass',()=>{
  expect(reviewAttempt('yes','admin-1','admin-1',validDraft)).toBe('REVIEWABLE');
 });
});
