import { describe, expect, it } from 'vitest';
import { selectCohortCurriculum, type CohortCurriculum } from './cohort-selection.js';
const valid: CohortCurriculum = {
 version:'2028-v1',status:'REVIEWED',validationIssues:[],sources:[{effectiveYear:2028}]
};
describe('cohort curriculum selection',()=>{
 it('selects the only matching reviewed cohort version',()=>{
  expect(selectCohortCurriculum(2028,[valid])).toEqual({selectedVersion:'2028-v1',issue:null});
 });
 it('does not select an unrelated cohort',()=>{
  expect(selectCohortCurriculum(2027,[valid]).issue).toBe('NO_APPLICABLE_CURRICULUM');
 });
 it('rejects ambiguous versions rather than choosing the latest',()=>{
  expect(selectCohortCurriculum(2028,[valid,{...valid,version:'2028-v2'}]).issue).toBe('AMBIGUOUS_COHORT_CURRICULUM');
 });
 it('rejects draft and invalid reviewed curricula',()=>{
  expect(selectCohortCurriculum(2028,[{...valid,status:'DRAFT'},{...valid,validationIssues:['INVALID_CREDITS']}]).selectedVersion).toBeNull();
 });
 it('rejects invalid cohort years',()=>{
  expect(selectCohortCurriculum(Number.NaN,[valid]).issue).toBe('INVALID_COHORT_YEAR');
 });
});
