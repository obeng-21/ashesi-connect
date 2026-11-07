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

 it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])('rejects non-finite African Studies minimum credits during draft import (%s)', africanStudiesMinimum=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,electivePools:[{...sample.rules.electivePools[0],africanStudiesMinimum}]}});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it.each(['', '   '])('rejects blank elective-pool course codes during draft import (%s)',courseCode=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,electivePools:[{...sample.rules.electivePools[0],courseCodes:[courseCode]}]}});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it.each([
  ['required course', {rules:{...sample.rules,requiredCourses:[{...sample.rules.requiredCourses[0],officialCertification:true}]}}],
  ['elective pool', {rules:{...sample.rules,electivePools:[{...sample.rules.electivePools[0],officialCertification:true}]}}],
  ['source provenance', {sources:[{...sample.sources[0],officialCertification:true}]}],
  ['curriculum rules', {rules:{...sample.rules,officialCertification:true}}]
 ])('rejects unknown nested fields in %s',(_label,overrides)=>{
  const result=planCurriculumDraftImport({...sample,...overrides});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it('rejects a required course reused as an elective option',()=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,electivePools:[{...sample.rules.electivePools[0],courseCodes:['CS101']}]}});
  expect(result.accepted).toBe(false);
  expect(result.issues).toContain('REQUIRED_COURSE_IN_ELECTIVE_POOL');
  expect(result.draft).toBeNull();
 });
 it('rejects duplicate elective options within one pool',()=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,electivePools:[{...sample.rules.electivePools[0],courseCodes:['EL101','EL101']}]}});
  expect(result.accepted).toBe(false);
  expect(result.issues).toContain('DUPLICATE_ELECTIVE_COURSE');
  expect(result.draft).toBeNull();
 });
 it('rejects elective courses appearing in multiple pools',()=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,totalCredits:3,electivePools:[sample.rules.electivePools[0],{category:'Second Elective',creditsRequired:1,courseCodes:['EL101']}]}});
  expect(result.accepted).toBe(false);
  expect(result.issues).toContain('ELECTIVE_COURSE_IN_MULTIPLE_POOLS');
  expect(result.draft).toBeNull();
 });
 it('rejects duplicate required course codes in a draft',()=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,totalCredits:3,requiredCourses:[sample.rules.requiredCourses[0],{...sample.rules.requiredCourses[0]}]}});
  expect(result.accepted).toBe(false);
  expect(result.issues).toContain('DUPLICATE_OR_EMPTY_REQUIRED_COURSE');
  expect(result.draft).toBeNull();
 });
 it('rejects duplicate elective pool categories',()=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,totalCredits:3,electivePools:[sample.rules.electivePools[0],{category:'Elective',creditsRequired:1,courseCodes:['EL102']}]}});
  expect(result.accepted).toBe(false);
  expect(result.issues).toContain('DUPLICATE_OR_EMPTY_ELECTIVE_POOL');
  expect(result.draft).toBeNull();
 });
 it('rejects elective credit requirements without any course options',()=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,electivePools:[{...sample.rules.electivePools[0],courseCodes:[]}]}});
  expect(result.accepted).toBe(false);
  expect(result.issues).toContain('EMPTY_ELECTIVE_OPTIONS');
  expect(result.draft).toBeNull();
 });
 it('preserves draft-only, unverified authority for accepted curriculum imports',()=>{
  const result=planCurriculumDraftImport({...sample,sourceWorkbookHash:'a'.repeat(64)});
  expect(result.accepted).toBe(true);
  expect(result.issues).toEqual([]);
  expect(result.draft).toMatchObject({
   status:'DRAFT',
   rules:{verifiedByRegistry:false},
   sourceWorkbookHash:'a'.repeat(64)
  });
  expect(result.draft?.validationIssues).toEqual([]);
 });
 it.each([-1, 1.5, 2])('rejects invalid African Studies minimum course counts (%s)',africanStudiesMinimum=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,electivePools:[{...sample.rules.electivePools[0],africanStudiesMinimum}]}});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
  if (africanStudiesMinimum === 2) expect(result.issues).toContain('INVALID_AFRICAN_STUDIES_MINIMUM');
 });
 it.each([
  ['unsupported provenance kind', {sourceKind:'USER_ASSERTED'}],
  ['invalid retrieval timestamp', {retrievedAt:'not-a-date'}],
  ['non-integer effective year', {effectiveYear:2028.5}],
  ['blank content fingerprint', {contentHash:'   '}]
 ])('rejects %s in curriculum source provenance',(_label,sourceOverride)=>{
  const result=planCurriculumDraftImport({...sample,sources:[{...sample.sources[0],...sourceOverride}]});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it.each(['', '   '])('rejects missing curriculum version labels (%s)',version=>{
  const result=planCurriculumDraftImport({...sample,version});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it('rejects curriculum drafts without required courses',()=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,requiredCourses:[]}});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])('rejects invalid programme total credits (%s)',totalCredits=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,totalCredits}});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it.each(['https://user:password@ashesi.edu.gh/policy','https://user@ashesi.edu.gh/policy'])('rejects credential-bearing source URLs (%s)',sourceUrl=>{
  const result=planCurriculumDraftImport({...sample,sources:[{...sample.sources[0],sourceUrl}]});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it.each(['', '   '])('rejects blank programme identifiers (%s)',programme=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,programme}});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it.each(['', '   '])('rejects blank curriculum track identifiers (%s)',track=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,track}});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it('rejects a draft without source provenance even when a workbook fingerprint is present',()=>{
  const result=planCurriculumDraftImport({...sample,sourceWorkbookHash:'a'.repeat(64),sources:[]});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it('rejects more than the allowed source provenance records',()=>{
  const sources=Array.from({length:31},(_,index)=>({...sample.sources[0],contentHash:`source-${index}`}));
  const result=planCurriculumDraftImport({...sample,sources});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it('rejects oversized elective course option lists',()=>{
  const courseCodes=Array.from({length:501},(_,index)=>`EL${index}`);
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,electivePools:[{...sample.rules.electivePools[0],courseCodes}]}});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it('rejects oversized required course lists before producing a draft',()=>{
  const requiredCourses=Array.from({length:501},(_,index)=>({...sample.rules.requiredCourses[0],courseCode:`CS${index}`}));
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,requiredCourses}});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
});
