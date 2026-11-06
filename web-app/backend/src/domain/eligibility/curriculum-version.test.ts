import { describe, expect, it } from 'vitest';
import { validateCurriculum, type CurriculumVersion } from './curriculum-version.js';
const sample: CurriculumVersion = {
 version:'2028-v1',status:'DRAFT',
 rules:{programme:'CS',track:'standard',totalCredits:3,verifiedByRegistry:false,requiredCourses:[{courseCode:'CS101',credits:1,minimumGrade:'D+',category:'Major'}],electivePools:[{category:'Electives',creditsRequired:2,courseCodes:['ELE101','ELE102']}]},
 sources:[{sourceUrl:'https://ashesi.edu.gh/',sourceKind:'OFFICIAL_WEBSITE',retrievedAt:'2026-11-06T00:00:00Z',effectiveYear:2028,contentHash:'example-hash'}]
};
describe('curriculum validation',()=>{
 it('accepts a structurally complete draft',()=>expect(validateCurriculum(sample).valid).toBe(true));
 it('rejects a duplicate required course',()=>expect(validateCurriculum({...sample,rules:{...sample.rules,requiredCourses:[...sample.rules.requiredCourses,...sample.rules.requiredCourses]}}).issues).toContain('DUPLICATE_OR_EMPTY_REQUIRED_COURSE'));
 it('rejects totals smaller than required credits',()=>expect(validateCurriculum({...sample,rules:{...sample.rules,totalCredits:2}}).issues).toContain('CREDIT_REQUIREMENTS_EXCEED_TOTAL'));
 it('rejects missing policy provenance',()=>expect(validateCurriculum({...sample,sources:[]}).issues).toContain('NO_POLICY_PROVENANCE'));
});
