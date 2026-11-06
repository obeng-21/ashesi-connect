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
 it('keeps enrolled required coursework provisional and outstanding',()=>{
  const result=previewAcademicProgress([{courseCode:'CS101',attempts:[{credits:1,status:'ENROLLED'}]}],rules);
  expect(result.status).toBe('REQUIREMENTS_OUTSTANDING');
  expect(result.audit?.remainingRequirements).toEqual(expect.arrayContaining([expect.objectContaining({code:'CS101',reason:'IN_PROGRESS'})]));
  expect(result.audit?.creditsInProgress).toBe(1);
  expect(result.officialCertification).toBe(false);
 });
 it('keeps incomplete required coursework outstanding',()=>{
  const result=previewAcademicProgress([{courseCode:'CS101',attempts:[{credits:1,status:'INCOMPLETE'}]}],rules);
  expect(result.status).toBe('REQUIREMENTS_OUTSTANDING');
  expect(result.audit?.remainingRequirements).toEqual(expect.arrayContaining([expect.objectContaining({code:'CS101',reason:'INCOMPLETE'})]));
  expect(result.officialCertification).toBe(false);
 });
 it('fails closed on mismatched course codes in transcript attempts',()=>{
  const result=previewAcademicProgress([{courseCode:'CS101',attempts:[{courseCode:'CS102',credits:1,grade:'A',status:'COMPLETED'}]}],rules);
  expect(result.status).toBe('INSUFFICIENT_DATA');
  expect(result.issues).toContain('COURSE_CODE_MISMATCH:CS101');
  expect(result.audit).toBeNull();
  expect(result.officialCertification).toBe(false);
 });
 it('fails closed on invalid curriculum rules without certifying',()=>{
  const result=previewAcademicProgress([{courseCode:'CS101',attempts:[{credits:1,grade:'A',status:'COMPLETED'}]}],{...rules,totalCredits:0});
  expect(result.status).toBe('INSUFFICIENT_DATA');
  expect(result.issues).toContain('INVALID_CURRICULUM_OR_TRANSCRIPT');
  expect(result.audit).toBeNull();
  expect(result.officialCertification).toBe(false);
 });
 it('fails closed when a completed attempt has invalid credits',()=>{
  const result=previewAcademicProgress([{courseCode:'CS101',attempts:[{credits:0,grade:'A',status:'COMPLETED'}]}],rules);
  expect(result.status).toBe('INSUFFICIENT_DATA');
  expect(result.issues).toContain('INVALID_CREDITS:CS101');
  expect(result.audit).toBeNull();
  expect(result.officialCertification).toBe(false);
 });
 it('fails closed on unknown transcript statuses',()=>{
  const result=previewAcademicProgress([{courseCode:'CS101',attempts:[{credits:1,grade:'A',status:'TRANSFER_PENDING'}]}],rules);
  expect(result.status).toBe('INSUFFICIENT_DATA');
  expect(result.issues).toContain('UNKNOWN_STATUS:CS101');
  expect(result.audit).toBeNull();
  expect(result.officialCertification).toBe(false);
 });
 it('fails closed on mixed valid and malformed transcript attempts',()=>{
  const result=previewAcademicProgress([{courseCode:'CS101',attempts:[{credits:1,grade:'A',status:'COMPLETED'},{credits:1,grade:'P',status:'COMPLETED'}]}],rules);
  expect(result.status).toBe('INSUFFICIENT_DATA');
  expect(result.issues).toContain('UNKNOWN_GRADE:CS101');
  expect(result.audit).toBeNull();
  expect(result.officialCertification).toBe(false);
 });
 it('fails closed on duplicate required-course rules',()=>{
  const result=previewAcademicProgress([{courseCode:'CS101',attempts:[{credits:1,grade:'A',status:'COMPLETED'}]}],{
   ...rules,requiredCourses:[...rules.requiredCourses,...rules.requiredCourses]
  });
  expect(result.status).toBe('INSUFFICIENT_DATA');
  expect(result.issues).toContain('INVALID_CURRICULUM_OR_TRANSCRIPT');
  expect(result.audit).toBeNull();
  expect(result.officialCertification).toBe(false);
 });
 it('reports a total-credit shortfall despite completing required courses',()=>{
  const result=previewAcademicProgress([{courseCode:'CS101',attempts:[{credits:1,grade:'A',status:'COMPLETED'}]}],{
   ...rules,totalCredits:2
  });
  expect(result.status).toBe('REQUIREMENTS_OUTSTANDING');
  expect(result.audit?.remainingRequirements).toEqual(expect.arrayContaining([expect.objectContaining({code:'TOTAL_CREDITS',reason:'CREDIT_SHORTFALL',credits:1})]));
  expect(result.officialCertification).toBe(false);
  expect(result.audit?.eligibilityDetermined).toBe(false);
 });

 it('keeps an unfilled elective pool outstanding even when required credits are met',()=>{
  const result=previewAcademicProgress([{courseCode:'CS101',attempts:[{credits:1,grade:'A',status:'COMPLETED'}]}],{
   ...rules,electivePools:[{category:'Elective',creditsRequired:1,courseCodes:['EL101'],minimumGrade:'D+'}]
  });
  expect(result.status).toBe('REQUIREMENTS_OUTSTANDING');
  expect(result.audit?.remainingRequirements).toEqual(expect.arrayContaining([expect.objectContaining({code:'Elective',reason:'ELECTIVE_SLOT_OPEN',credits:1})]));
  expect(result.officialCertification).toBe(false);
  expect(result.audit?.eligibilityDetermined).toBe(false);
 });
 it('rejects a curriculum with a negative elective credit requirement',()=>{
  const result=previewAcademicProgress([{courseCode:'CS101',attempts:[{credits:1,grade:'A',status:'COMPLETED'}]}],{
   ...rules,electivePools:[{category:'Elective',creditsRequired:-1,courseCodes:['EL101']}]
  });
  expect(result.status).toBe('INSUFFICIENT_DATA');
  expect(result.issues).toContain('INVALID_CURRICULUM_OR_TRANSCRIPT');
  expect(result.audit).toBeNull();
  expect(result.officialCertification).toBe(false);
 });
});
