import { describe, expect, it } from 'vitest';
import { toCurriculumDraft } from './curriculum.js';
import type { CurriculumVersion } from '../domain/eligibility/curriculum-version.js';
const draft: CurriculumVersion = {version:'2028-v1',status:'DRAFT',rules:{programme:'CS',track:'standard',totalCredits:3,verifiedByRegistry:true,requiredCourses:[{courseCode:'CS101',credits:1,minimumGrade:'D+',category:'Major'}],electivePools:[{category:'Elective',creditsRequired:2,courseCodes:['EL101','EL102']}]},sources:[{sourceUrl:'https://ashesi.edu.gh/',sourceKind:'OFFICIAL_WEBSITE',retrievedAt:'2026-11-06T00:00:00Z',effectiveYear:2028,contentHash:'test-hash'}]};
describe('curriculum persistence mapper',()=>{
 it('does not inherit a registry verification flag from imported data',()=>{const mapped=toCurriculumDraft(draft);expect(mapped.status).toBe('DRAFT');expect(mapped.rules.verifiedByRegistry).toBe(false);});
 it('retains source references and version',()=>{const mapped=toCurriculumDraft(draft);expect(mapped.sources).toHaveLength(1);expect(mapped.version).toBe('2028-v1');});
});
