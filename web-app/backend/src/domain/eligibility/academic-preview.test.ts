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
 it('keeps below-threshold required coursework outstanding even with a completed grade',()=>{
  const result=previewAcademicProgress([{courseCode:'CS101',attempts:[{credits:1,grade:'D',status:'COMPLETED'}]}],rules);
  expect(result.status).toBe('REQUIREMENTS_OUTSTANDING');
  expect(result.audit?.remainingRequirements).toEqual(expect.arrayContaining([expect.objectContaining({code:'CS101',reason:'FAILED'})]));
  expect(result.officialCertification).toBe(false);
  expect(result.audit?.eligibilityDetermined).toBe(false);
 });
 it('does not silently count an unrelated completed course as a required course',()=>{
  const result=previewAcademicProgress([{courseCode:'CS102',attempts:[{credits:1,grade:'A',status:'COMPLETED'}]}],rules);
  expect(result.status).toBe('REQUIREMENTS_OUTSTANDING');
  expect(result.audit?.remainingRequirements).toEqual(expect.arrayContaining([expect.objectContaining({code:'CS101',reason:'NOT_TAKEN'})]));
  expect(result.provisionalOnly).toBe(true);
  expect(result.officialCertification).toBe(false);
 });
});
