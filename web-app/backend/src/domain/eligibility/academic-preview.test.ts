import { describe, expect, it } from 'vitest';
import { previewAcademicProgress } from './academic-preview.js';
import type { ProgrammeRules } from './programme-audit.js';
const rules: ProgrammeRules = {
 programme:'CS',track:'standard',totalCredits:1,verifiedByRegistry:true,
 requiredCourses:[{courseCode:'CS101',credits:1,minimumGrade:'D+',category:'Major'}],electivePools:[]
};
describe('provisional academic progress preview',()=>{
 it('reports requirements met but never determines official eligibility',()=>{
  const result=previewAcademicProgress([{courseCode:'CS101',attempts:[{credits:1,grade:'A',status:'COMPLETED'}]}],rules);
  expect(result.status).toBe('ACADEMIC_REQUIREMENTS_MET');
  expect(result.officialCertification).toBe(false);
  expect(result.audit?.eligibilityDetermined).toBe(false);
  expect(result.audit?.eligible).toBe(false);
 });
 it('reports outstanding coursework',()=>{
  const result=previewAcademicProgress([],rules);
  expect(result.status).toBe('INSUFFICIENT_DATA');
 });
 it('fails closed on unsupported transcript grades',()=>{
  const result=previewAcademicProgress([{courseCode:'CS101',attempts:[{credits:1,grade:'P',status:'COMPLETED'}]}],rules);
  expect(result.status).toBe('INSUFFICIENT_DATA');
  expect(result.audit).toBeNull();
 });
 it('fails closed without curriculum',()=>{
  const result=previewAcademicProgress([{courseCode:'CS101',attempts:[{credits:1,grade:'A',status:'COMPLETED'}]}],null);
  expect(result.issues).toContain('CURRICULUM_UNAVAILABLE');
 });
});
