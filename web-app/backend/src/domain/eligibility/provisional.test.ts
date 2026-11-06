import { describe, expect, it } from 'vitest';
import { assessProvisionalGraduation } from './certification.js';
const base = { audit: {eligible:true,eligibilityDetermined:true,creditsEarned:35,creditsRequired:35,creditsInProgress:0,percentComplete:100,remainingRequirements:[],severity:'GREEN' as const}, cumulativeGpa:2.5,engineeringInternshipRequired:false,engineeringInternshipCompleted:false,programme:'CS',curriculumYear:2028,curriculumHash:'draft',serviceLearningCompleted:true,writingLabRequired:true,writingLabCompleted:true,financialClearance:true };
describe('provisional audit',()=>{
 it('allows provisional result without signature',()=>{const result=assessProvisionalGraduation(base);expect(result.status).toBe('PROVISIONALLY_ELIGIBLE');expect(result.officialCertification).toBe(false);});
 it('blocks missing financial clearance',()=>expect(assessProvisionalGraduation({...base,financialClearance:false}).status).not.toBe('PROVISIONALLY_ELIGIBLE'));
});
