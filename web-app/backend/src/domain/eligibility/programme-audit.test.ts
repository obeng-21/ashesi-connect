import { describe, expect, it } from 'vitest';
import { evaluateProgramme, type ProgrammeRules } from './programme-audit.js';
const rules: ProgrammeRules = {
 programme: 'TEST', track: 'standard', verifiedByRegistry: true, totalCredits: 3,
 requiredCourses: [{ courseCode: 'CORE101', credits: 1, minimumGrade: 'C', category: 'Core' }],
 electivePools: [{ category: 'Non-major', creditsRequired: 2, courseCodes: ['AFR101','ELE102'], africanStudiesMinimum: 1 }]
};
describe('programme audit', () => {
 it('never certifies unverified rules', () => {
  const result = evaluateProgramme([], { ...rules, verifiedByRegistry: false });
  expect(result.eligible).toBe(false);
  expect(result.eligibilityDetermined).toBe(false);
  expect(result.severity).toBe('UNDETERMINED');
 });
 it('recognises a passing retake and avoids double-counting', () => {
  const result = evaluateProgramme([
   { courseCode:'CORE101',grade:'D+',attempt:1,credits:1 },
   { courseCode:'CORE101',grade:'C',attempt:2,credits:1 },
   { courseCode:'AFR101',grade:'A',attempt:1,credits:1,africanStudies:true },
   { courseCode:'ELE102',grade:'B',attempt:1,credits:1 }
  ],rules);
  expect(result.eligible).toBe(true);
  expect(result.creditsEarned).toBe(3);
 });
 it('requires African Studies even with enough elective credits', () => {
  const result = evaluateProgramme([
   { courseCode:'CORE101',grade:'C',attempt:1,credits:1 },
   { courseCode:'AFR101',grade:'A',attempt:1,credits:1 },
   { courseCode:'ELE102',grade:'B',attempt:1,credits:1 }
  ],rules);
  expect(result.eligible).toBe(false);
  expect(result.remainingRequirements.some(x=>x.reason==='AFRICAN_STUDIES_MISSING')).toBe(true);
 });
 it('does not treat an enrolled course as passed', () => {
  const result = evaluateProgramme([{courseCode:'CORE101',status:'IN_PROGRESS',attempt:1,credits:1}],rules);
  expect(result.eligible).toBe(false);
  expect(result.remainingRequirements.some(x=>x.reason==='IN_PROGRESS')).toBe(true);
 });
});
