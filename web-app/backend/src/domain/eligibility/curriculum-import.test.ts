import { describe, expect, it } from 'vitest';
import { planCurriculumDraftImport } from './curriculum-import.js';
const sample = {
 version:'2028-draft-1',status:'DRAFT',
 rules:{programme:'CS',track:'standard',totalCredits:2,verifiedByRegistry:false,requiredCourses:[{courseCode:'CS101',credits:1,minimumGrade:'D+',category:'Major'}],electivePools:[{category:'Elective',creditsRequired:1,courseCodes:['EL101']}]},
 sources:[{sourceUrl:'https://ashesi.edu.gh/',sourceKind:'OFFICIAL_WEBSITE',retrievedAt:'2026-11-06T00:00:00.000Z',effectiveYear:2028,contentHash:'sample'}]
};
describe('controlled curriculum import',()=>{
 it('plans a validated draft without database writes',()=>{const result=planCurriculumDraftImport(sample);expect(result.accepted).toBe(true);expect(result.draft?.status).toBe('DRAFT');});
 it('rejects purported registry approval in imported data',()=>expect(planCurriculumDraftImport({...sample,rules:{...sample.rules,verifiedByRegistry:true}}).accepted).toBe(false));
 it('rejects contradictory credit totals',()=>expect(planCurriculumDraftImport({...sample,rules:{...sample.rules,totalCredits:1}}).issues).toContain('CREDIT_REQUIREMENTS_EXCEED_TOTAL'));
 it('rejects unknown fields',()=>expect(planCurriculumDraftImport({...sample,officialCertification:true}).accepted).toBe(false));
 it('requires source provenance for every imported draft',()=>{
  const result=planCurriculumDraftImport({...sample,sources:[]});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it('rejects insecure source URLs',()=>{
  const result=planCurriculumDraftImport({...sample,sources:[{...sample.sources[0],sourceUrl:'http://ashesi.edu.gh/'}]});
  expect(result.accepted).toBe(false);
 });
 it('rejects malformed workbook fingerprints',()=>{
  const result=planCurriculumDraftImport({...sample,sourceWorkbookHash:'not-a-sha256'});
  expect(result.accepted).toBe(false);
 });
 it('cannot import a verified curriculum status',()=>{
  const result=planCurriculumDraftImport({...sample,status:'VERIFIED'});
  expect(result.accepted).toBe(false);
 });
 it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])('rejects non-finite required-course credits during draft import (%s)', credits=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,requiredCourses:[{...sample.rules.requiredCourses[0],credits}]}});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it.each(['', '   '])('rejects blank required-course codes during draft import (%s)',courseCode=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,requiredCourses:[{...sample.rules.requiredCourses[0],courseCode}]}});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])('rejects non-finite elective credit requirements during draft import (%s)', creditsRequired=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,electivePools:[{...sample.rules.electivePools[0],creditsRequired}]}});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it.each(['F', 'P', 'INVALID'])('rejects unsupported required-course minimum grades during draft import (%s)', minimumGrade=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,requiredCourses:[{...sample.rules.requiredCourses[0],minimumGrade}]}});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it('rejects unsupported elective minimum grades during draft import',()=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,electivePools:[{...sample.rules.electivePools[0],minimumGrade:'INVALID'}]}});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
});
