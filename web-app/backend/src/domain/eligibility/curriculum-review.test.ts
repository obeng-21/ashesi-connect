import { describe, expect, it } from 'vitest';
import { planCurriculumReview } from './curriculum-review.js';
import type { CurriculumVersion } from './curriculum-version.js';

const draft: CurriculumVersion = {
 version:'2028-v1',status:'DRAFT',
 rules:{programme:'CS',track:'standard',totalCredits:3,verifiedByRegistry:false,
  requiredCourses:[{courseCode:'CS101',credits:1,minimumGrade:'D+',category:'Major'}],
  electivePools:[]},
 sources:[{sourceUrl:'https://example.edu',sourceKind:'OFFICIAL_WEBSITE',
  retrievedAt:'2026-11-06T00:00:00Z',effectiveYear:2028,contentHash:'test-hash'}]
};
const review = {reviewerId:'admin-1',evidenceReference:'registry-approval-123',reviewedAt:new Date('2026-11-06T00:00:00Z')};
describe('curriculum review planning',()=>{
 it('accepts a valid draft with reviewer and evidence',()=>{
  expect(planCurriculumReview(draft,review).accepted).toBe(true);
 });
 it('rejects missing approval evidence',()=>{
  expect(planCurriculumReview(draft,{...review,evidenceReference:''}).issues).toContain('EVIDENCE_REFERENCE_REQUIRED');
 });
 it('rejects re-review of an already reviewed record',()=>{
  expect(planCurriculumReview({...draft,status:'REVIEWED'},review).issues).toContain('CURRICULUM_NOT_DRAFT');
 });
 it('rejects invalid curriculum rules',()=>{
  expect(planCurriculumReview({...draft,rules:{...draft.rules,requiredCourses:[]}},review).issues).toContain('NO_REQUIRED_COURSES');
 });
});
