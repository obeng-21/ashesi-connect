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
 it('rejects more than 100 elective pools before creating a draft',()=>{
  const electivePools=Array.from({length:101},(_,index)=>({category:`Elective ${index}`,creditsRequired:0,courseCodes:[]}));
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,electivePools}});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it.each([0,-1,10.01])('rejects out-of-range required-course credits (%s)',credits=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,requiredCourses:[{...sample.rules.requiredCourses[0],credits}]}});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it.each([1999,2201])('rejects out-of-range curriculum effective years (%s)',effectiveYear=>{
  const result=planCurriculumDraftImport({...sample,sources:[{...sample.sources[0],effectiveYear}]});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it('does not mutate source data while planning a provisional draft',()=>{
  const input=structuredClone(sample);
  const before=structuredClone(input);
  const result=planCurriculumDraftImport(input);
  expect(result.accepted).toBe(true);
  expect(input).toEqual(before);
  expect(result.draft?.status).toBe('DRAFT');
 });
 it.each([null,undefined,[],42,'not a curriculum'])('rejects non-object curriculum payloads (%s)',raw=>{
  const result=planCurriculumDraftImport(raw);
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });
 it.each([2000,2200])('accepts valid effective-year boundary %s as an unverified draft',effectiveYear=>{
  const result=planCurriculumDraftImport({...sample,sources:[{...sample.sources[0],effectiveYear}]});
  expect(result.accepted).toBe(true);
  expect(result.issues).toEqual([]);
  expect(result.draft?.status).toBe('DRAFT');
  expect(result.draft?.rules.verifiedByRegistry).toBe(false);
 });
 it('accepts the maximum 30 provenance records without granting certification',()=>{
  const sources=Array.from({length:30},(_,index)=>({...sample.sources[0],contentHash:`source-${index}`}));
  const result=planCurriculumDraftImport({...sample,sources});
  expect(result.accepted).toBe(true);
  expect(result.draft?.status).toBe('DRAFT');
  expect(result.draft?.rules.verifiedByRegistry).toBe(false);
 });
 it('isolates the accepted provisional draft from caller-owned nested input',()=>{
  const input=structuredClone(sample);
  const result=planCurriculumDraftImport(input);
  expect(result.accepted).toBe(true);
  expect(result.draft).not.toBeNull();
  if (!result.draft) return;
  result.draft.rules.requiredCourses[0].courseCode='CHANGED';
  result.draft.sources[0].contentHash='changed';
  expect(input.rules.requiredCourses[0].courseCode).toBe('CS101');
  expect(input.sources[0].contentHash).toBe(sample.sources[0].contentHash);
  expect(input.status).toBe('DRAFT');
 });
 it('isolates accepted provisional drafts from later changes to caller-owned input',()=>{
  const input=structuredClone(sample);
  const result=planCurriculumDraftImport(input);
  expect(result.accepted).toBe(true);
  expect(result.draft).not.toBeNull();
  input.rules.requiredCourses[0].courseCode='MODIFIED_AFTER_IMPORT';
  input.sources[0].contentHash='modified-after-import';
  expect(result.draft?.rules.requiredCourses[0].courseCode).toBe('CS101');
  expect(result.draft?.sources[0].contentHash).toBe(sample.sources[0].contentHash);
  expect(result.draft?.status).toBe('DRAFT');
  expect(result.draft?.rules.verifiedByRegistry).toBe(false);
 });

 it('isolates nested elective options in accepted provisional drafts',()=>{
  const input=structuredClone(sample);
  const result=planCurriculumDraftImport(input);
  expect(result.accepted).toBe(true);
  expect(result.draft?.status).toBe('DRAFT');
  expect(result.draft?.rules.verifiedByRegistry).toBe(false);
  if (!result.draft) return;
  input.rules.electivePools[0].courseCodes[0]='CHANGED_INPUT';
  expect(result.draft.rules.electivePools[0].courseCodes[0]).toBe('EL101');
  result.draft.rules.electivePools[0].courseCodes[0]='CHANGED_DRAFT';
  expect(input.rules.electivePools[0].courseCodes[0]).toBe('CHANGED_INPUT');
 });

 it('keeps separately planned provisional drafts independent',()=>{
  const first=planCurriculumDraftImport(structuredClone(sample));
  const second=planCurriculumDraftImport(structuredClone(sample));
  expect(first.accepted).toBe(true);
  expect(second.accepted).toBe(true);
  expect(first.draft).not.toBeNull();
  expect(second.draft).not.toBeNull();
  if (!first.draft || !second.draft) return;
  first.draft.rules.requiredCourses[0].courseCode='FIRST_ONLY';
  first.draft.rules.electivePools[0].courseCodes[0]='FIRST_ELECTIVE_ONLY';
  first.draft.sources[0].contentHash='first-only';
  expect(second.draft.rules.requiredCourses[0].courseCode).toBe('CS101');
  expect(second.draft.rules.electivePools[0].courseCodes[0]).toBe('EL101');
  expect(second.draft.sources[0].contentHash).toBe(sample.sources[0].contentHash);
  expect(second.draft.status).toBe('DRAFT');
  expect(second.draft.rules.verifiedByRegistry).toBe(false);
 });
 it('does not leak validation failures into subsequent independent import previews',()=>{
  const invalid=planCurriculumDraftImport({...sample,status:'VERIFIED'});
  expect(invalid.accepted).toBe(false);
  expect(invalid.draft).toBeNull();
  const valid=planCurriculumDraftImport(structuredClone(sample));
  expect(valid.accepted).toBe(true);
  expect(valid.issues).toEqual([]);
  expect(valid.draft?.validationIssues).toEqual([]);
  expect(valid.draft?.status).toBe('DRAFT');
  expect(valid.draft?.rules.verifiedByRegistry).toBe(false);
 });
 it.each([
  ['missing rules', {rules:undefined}],
  ['null rules', {rules:null}],
  ['non-array required courses', {rules:{...sample.rules,requiredCourses:{0:sample.rules.requiredCourses[0]}}}],
  ['null elective pools', {rules:{...sample.rules,electivePools:null}}],
  ['non-array provenance', {sources:{0:sample.sources[0]}}],
  ['null elective course options', {rules:{...sample.rules,electivePools:[{...sample.rules.electivePools[0],courseCodes:null}]}}]
 ])('rejects malformed nested curriculum structures: %s',(_label,overrides)=>{
  const result=planCurriculumDraftImport({...sample,...overrides});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
  expect(result.issues.length).toBeGreaterThan(0);
 });

 it.each([
  ['top-level authority flag', {certified:true}],
  ['registry verification override', {rules:{...sample.rules,verifiedByRegistry:true}}],
  ['unexpected nested course metadata', {rules:{...sample.rules,requiredCourses:[{...sample.rules.requiredCourses[0],approvedByRegistry:true}]}}],
  ['unexpected provenance metadata', {sources:[{...sample.sources[0],officiallyCertified:true}]}]
 ])('rejects unrecognized or elevated certification claims: %s',(_label,overrides)=>{
  const result=planCurriculumDraftImport({...sample,...overrides});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
  expect(result.issues.length).toBeGreaterThan(0);
 });

 it.each([
  ['invalid retrieval timestamp', {retrievedAt:'not-a-timestamp'}],
  ['timestamp without timezone', {retrievedAt:'2026-11-06T00:00:00'}],
  ['unsupported provenance kind', {sourceKind:'UNVERIFIED_UPLOAD'}],
  ['insecure provenance URL', {sourceUrl:'http://ashesi.edu.gh/'}],
  ['credential-bearing provenance URL', {sourceUrl:'https://user:password@ashesi.edu.gh/curriculum'}],
  ['malformed provenance URL', {sourceUrl:'https://'}]
 ])('rejects untrustworthy source provenance: %s',(_label,sourceOverride)=>{
  const result=planCurriculumDraftImport({...sample,sources:[{...sample.sources[0],...sourceOverride}]});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
  expect(result.issues.length).toBeGreaterThan(0);
 });

 it('accepts timezone-qualified provenance and uppercase SHA-256 fingerprints as provisional only',()=>{
  const result=planCurriculumDraftImport({
   ...sample,
   sourceWorkbookHash:'A'.repeat(64),
   sources:[{...sample.sources[0],retrievedAt:'2026-11-06T03:30:00+03:30',sourceUrl:'https://ashesi.edu.gh/curriculum/2028'}]
  });
  expect(result.accepted).toBe(true);
  expect(result.issues).toEqual([]);
  expect(result.draft?.status).toBe('DRAFT');
  expect(result.draft?.rules.verifiedByRegistry).toBe(false);
  expect(result.draft?.sourceWorkbookHash).toBe('A'.repeat(64));
 });

 it.each(['2026-11-06T00:00:00Z','2026-11-06T00:00:00-05:00'])('accepts timezone-qualified provenance timestamp %s without granting registry authority',retrievedAt=>{
  const result=planCurriculumDraftImport({...sample,sources:[{...sample.sources[0],retrievedAt}]});
  expect(result.accepted).toBe(true);
  expect(result.issues).toEqual([]);
  expect(result.draft?.status).toBe('DRAFT');
  expect(result.draft?.rules.verifiedByRegistry).toBe(false);
 });
 it.each(['2026-11-06T00:00:00.123Z','2026-11-06T00:00:00+00:00'])('accepts fractional or explicit UTC provenance timestamp %s as a draft only',retrievedAt=>{
  const result=planCurriculumDraftImport({...sample,sources:[{...sample.sources[0],retrievedAt}]});
  expect(result.accepted).toBe(true);
  expect(result.issues).toEqual([]);
  expect(result.draft?.status).toBe('DRAFT');
  expect(result.draft?.rules.verifiedByRegistry).toBe(false);
 });

 it('preserves multiple independent provenance records in an unverified preview',()=>{
  const sources=[
   {...sample.sources[0],contentHash:'first-source'},
   {...sample.sources[0],sourceKind:'REGISTRY_PROVIDED_WORKBOOK',sourceUrl:'https://ashesi.edu.gh/registry/curriculum',contentHash:'second-source'}
  ];
  const result=planCurriculumDraftImport({...sample,sources});
  expect(result.accepted).toBe(true);
  expect(result.issues).toEqual([]);
  expect(result.draft?.sources).toEqual(sources);
  expect(result.draft?.status).toBe('DRAFT');
  expect(result.draft?.rules.verifiedByRegistry).toBe(false);
 });


 it('rejects a multi-source import when any provenance record is untrusted',()=>{
  const sources=[
   {...sample.sources[0],contentHash:'trusted-source'},
   {...sample.sources[0],sourceUrl:'http://untrusted.example/curriculum',contentHash:'untrusted-source'}
  ];
  const result=planCurriculumDraftImport({...sample,sources});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
  expect(result.issues.length).toBeGreaterThan(0);
 });
 it('rejects a multi-source import when a later provenance URL embeds credentials',()=>{
  const sources=[
   {...sample.sources[0],contentHash:'trusted-source'},
   {...sample.sources[0],sourceUrl:'https://user:secret@ashesi.edu.gh/curriculum',contentHash:'credential-bearing-source'}
  ];
  const result=planCurriculumDraftImport({...sample,sources});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
  expect(result.issues.length).toBeGreaterThan(0);
 });

 it('rejects all sources when a later provenance timestamp omits timezone',()=>{
  const sources=[
   {...sample.sources[0],contentHash:'trusted-source'},
   {...sample.sources[0],retrievedAt:'2026-11-06T12:00:00',contentHash:'timezone-missing'}
  ];
  const result=planCurriculumDraftImport({...sample,sources});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
  expect(result.issues.length).toBeGreaterThan(0);
 });


 it('rejects a multi-source import when a later provenance kind is unsupported',()=>{
  const sources=[
   {...sample.sources[0],contentHash:'trusted-source'},
   {...sample.sources[0],sourceKind:'UNVERIFIED_UPLOAD',contentHash:'unsupported-kind'}
  ];
  const result=planCurriculumDraftImport({...sample,sources});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
  expect(result.issues.length).toBeGreaterThan(0);
 });

 it('rejects a multi-source import when a later source claims certification authority',()=>{
  const sources=[
   {...sample.sources[0],contentHash:'trusted-source'},
   {...sample.sources[0],contentHash:'elevated-source',officiallyCertified:true}
  ];
  const result=planCurriculumDraftImport({...sample,sources});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
  expect(result.issues.length).toBeGreaterThan(0);
 });

 it('rejects an entire multi-source import when a later source has an out-of-range effective year',()=>{
  const sources=[
   {...sample.sources[0],contentHash:'trusted-source'},
   {...sample.sources[0],effectiveYear:2201,contentHash:'invalid-year-source'}
  ];
  const result=planCurriculumDraftImport({...sample,sources});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
  expect(result.issues.length).toBeGreaterThan(0);
 });

 it('rejects a multi-source import when a later source lacks a content fingerprint',()=>{
  const sources=[
   {...sample.sources[0],contentHash:'trusted-source'},
   {...sample.sources[0],contentHash:'   '}
  ];
  const result=planCurriculumDraftImport({...sample,sources});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
  expect(result.issues.length).toBeGreaterThan(0);
 });

 it('rejects an entire multi-source import when a later provenance URL is malformed',()=>{
  const sources=[
   {...sample.sources[0],contentHash:'trusted-source'},
   {...sample.sources[0],sourceUrl:'https://',contentHash:'malformed-url-source'}
  ];
  const result=planCurriculumDraftImport({...sample,sources});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
  expect(result.issues.length).toBeGreaterThan(0);
 });


 it('rejects an entire multi-source import when a later provenance URL is missing',()=>{
  const sources=[
   {...sample.sources[0],contentHash:'trusted-source'},
   {...sample.sources[0],sourceUrl:'',contentHash:'missing-url-source'}
  ];
  const result=planCurriculumDraftImport({...sample,sources});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
  expect(result.issues.length).toBeGreaterThan(0);
 });

 it('rejects embedded credentials in provenance HTTPS URLs',()=>{
  const result=planCurriculumDraftImport({...sample,sources:[{...sample.sources[0],sourceUrl:'https://user:password@ashesi.edu.gh/catalogue'}]});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });

 it('rejects unexpected certification authority fields nested in draft rules',()=>{
  const result=planCurriculumDraftImport({...sample,rules:{...sample.rules,officiallyCertified:true}});
  expect(result.accepted).toBe(false);
  expect(result.draft).toBeNull();
 });

});
