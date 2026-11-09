import { describe, expect, it } from 'vitest';
import { validateCurriculum, type CurriculumVersion } from './curriculum-version.js';

function fixture(): CurriculumVersion {
 return {
  version:'2028-v1',status:'DRAFT',
  rules:{programme:'CS',track:'standard',totalCredits:4,verifiedByRegistry:false,
   requiredCourses:[{courseCode:'CS101',credits:1,minimumGrade:'D+',category:'Major'}],
   electivePools:[{category:'General',creditsRequired:1,courseCodes:['E101','E102']}]},
  sources:[{sourceUrl:'https://example.edu/catalogue',sourceKind:'OFFICIAL_WEBSITE',
   retrievedAt:'2026-11-06T00:00:00.000Z',effectiveYear:2028,contentHash:'sha256-test'}]
 };
}
describe('curriculum elective allocation safeguards',()=>{
 it('accepts non-overlapping elective choices',()=>{
  expect(validateCurriculum(fixture()).valid).toBe(true);
 });
 it('rejects duplicate courses within an elective pool',()=>{
  const input=fixture();input.rules.electivePools[0].courseCodes=['E101','E101'];
  expect(validateCurriculum(input).issues).toContain('DUPLICATE_ELECTIVE_COURSE');
 });
 it('rejects the same elective course in multiple pools',()=>{
  const input=fixture();input.rules.electivePools.push({category:'Other',creditsRequired:1,courseCodes:['E101']});
  expect(validateCurriculum(input).issues).toContain('ELECTIVE_COURSE_IN_MULTIPLE_POOLS');
 });
 it('rejects impossible African Studies minima',()=>{
  const input=fixture();input.rules.electivePools[0].africanStudiesMinimum=3;
  expect(validateCurriculum(input).issues).toContain('INVALID_AFRICAN_STUDIES_MINIMUM');
 });
});

describe('curriculum credit feasibility safeguards', () => {
 it('rejects required and elective minimum credits exceeding the published total', () => {
  const input = fixture();
  input.rules.totalCredits = 1;
  expect(validateCurriculum(input).issues).toContain('CREDIT_REQUIREMENTS_EXCEED_TOTAL');
 });
 it('accepts required and elective minimum credits equal to the published total', () => {
  const input = fixture();
  input.rules.totalCredits = 2;
  expect(validateCurriculum(input).valid).toBe(true);
 });
 it('rejects non-finite published total credits', () => {
  const input = fixture();
  input.rules.totalCredits = Number.POSITIVE_INFINITY;
  expect(validateCurriculum(input).issues).toContain('INVALID_TOTAL_CREDITS');
 });
 it('rejects non-finite required course credits', () => {
  const input = fixture();
  input.rules.requiredCourses[0].credits = Number.NaN;
  expect(validateCurriculum(input).issues).toContain('INVALID_COURSE_CREDITS');
 });
 it('rejects non-finite elective credit requirements', () => {
  const input = fixture();
  input.rules.electivePools[0].creditsRequired = Number.NaN;
  expect(validateCurriculum(input).issues).toContain('INVALID_ELECTIVE_CREDITS');
 });
 it('rejects zero required course credits', () => {
  const input = fixture();
  input.rules.requiredCourses[0].credits = 0;
  expect(validateCurriculum(input).issues).toContain('INVALID_COURSE_CREDITS');
 });
 it('rejects zero published total credits', () => {
  const input = fixture();
  input.rules.totalCredits = 0;
  expect(validateCurriculum(input).issues).toContain('INVALID_TOTAL_CREDITS');
 });
 it('rejects positive elective requirements without any eligible course options', () => {
  const input = fixture();
  input.rules.electivePools[0].courseCodes = [];
  expect(validateCurriculum(input).issues).toContain('EMPTY_ELECTIVE_OPTIONS');
 });
 it('rejects negative required course credits', () => {
  const input = fixture();
  input.rules.requiredCourses[0].credits = -1;
  expect(validateCurriculum(input).issues).toContain('INVALID_COURSE_CREDITS');
 });
 it('rejects negative elective credit requirements', () => {
  const input = fixture();
  input.rules.electivePools[0].creditsRequired = -1;
  expect(validateCurriculum(input).issues).toContain('INVALID_ELECTIVE_CREDITS');
 });
 it('rejects required courses reused as elective options', () => {
  const input = fixture();
  input.rules.electivePools[0].courseCodes.push('CS101');
  expect(validateCurriculum(input).issues).toContain('REQUIRED_COURSE_IN_ELECTIVE_POOL');
 });
});

describe('curriculum identity and provenance safeguards', () => {
 it('rejects duplicate required course codes', () => {
  const input = fixture();
  input.rules.requiredCourses.push({courseCode:'CS101',credits:1,minimumGrade:'D+',category:'Major'});
  expect(validateCurriculum(input).issues).toContain('DUPLICATE_OR_EMPTY_REQUIRED_COURSE');
 });
 it('rejects duplicate elective pool categories', () => {
  const input = fixture();
  input.rules.electivePools.push({category:'General',creditsRequired:0,courseCodes:['E103']});
  expect(validateCurriculum(input).issues).toContain('DUPLICATE_OR_EMPTY_ELECTIVE_POOL');
 });
 it('rejects curricula without required courses', () => {
  const input = fixture();
  input.rules.requiredCourses = [];
  expect(validateCurriculum(input).issues).toContain('NO_REQUIRED_COURSES');
 });
 it('rejects curricula without policy provenance', () => {
  const input = fixture();
  input.sources = [];
  expect(validateCurriculum(input).issues).toContain('NO_POLICY_PROVENANCE');
 });
});

describe('curriculum provenance URL safeguards', () => {
 it('rejects malformed HTTPS URLs that merely have the expected prefix', () => {
  const input = fixture();
  input.sources[0].sourceUrl = 'https://';
  expect(validateCurriculum(input).issues).toContain('INVALID_SOURCE_METADATA');
 });
 it('rejects embedded credentials in provenance URLs', () => {
  const input = fixture();
  input.sources[0].sourceUrl = 'https://user:password@example.edu/catalogue';
  expect(validateCurriculum(input).issues).toContain('INVALID_SOURCE_METADATA');
 });

 it('rejects invalid provenance retrieval timestamps', () => {
  const input = fixture();
  input.sources[0].retrievedAt = 'not-a-date';
  expect(validateCurriculum(input).issues).toContain('INVALID_SOURCE_METADATA');
 });
 it('rejects fractional provenance effective years', () => {
  const input = fixture();
  input.sources[0].effectiveYear = 2028.5;
  expect(validateCurriculum(input).issues).toContain('INVALID_SOURCE_METADATA');
 });
 it('accepts a well-formed HTTPS provenance URL', () => {
  expect(validateCurriculum(fixture()).valid).toBe(true);
 });
});
