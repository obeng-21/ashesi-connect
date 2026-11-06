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
});
