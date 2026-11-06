import { describe, expect, it } from 'vitest';
import { evaluate, isPassing, type Requirement } from './engine.js';
const req: Requirement[] = [{courseCode:'DEMO-101',credits:1,minPassingGrade:'D+',category:'Core'},{courseCode:'DEMO-201',credits:1,minPassingGrade:'C',category:'Major'}];
describe('graduation audit starter',()=>{
  it('treats D+ as passing when minimum is D+',()=>expect(isPassing('D+','D+')).toBe(true));
  it('does not treat D+ as passing when minimum is C',()=>expect(isPassing('D+','C')).toBe(false));
  it('counts a passed course only once after retakes',()=>{
    const result=evaluate([{courseCode:'DEMO-101',grade:'E',attempt:1},{courseCode:'DEMO-101',grade:'B',attempt:2},{courseCode:'DEMO-201',grade:'C',attempt:1}],req,2);
    expect(result.creditsEarned).toBe(2);expect(result.outstanding).toHaveLength(0);expect(result.eligible).toBe(false);expect(result.eligibilityDetermined).toBe(false);
  });
  it('shows failure and in-progress courses separately',()=>{
    const result=evaluate([{courseCode:'DEMO-101',grade:'D',attempt:1},{courseCode:'DEMO-201',status:'IN_PROGRESS',attempt:1}],req,2);
    expect(result.findings.map(f=>f.status)).toEqual(['FAILED','IN_PROGRESS']);expect(result.creditsInProgress).toBe(1);
  });
  it('rejects duplicate requirements',()=>expect(()=>evaluate([], [...req,req[0]],2)).toThrow());
});
