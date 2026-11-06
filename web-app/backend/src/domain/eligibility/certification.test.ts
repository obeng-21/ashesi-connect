import { describe, expect, it } from 'vitest';
import { decideCertification, type CertificationEvidence } from './certification.js';
const evidence: CertificationEvidence = {
 audit: { eligible:true, eligibilityDetermined:true, creditsEarned:40, creditsRequired:40, creditsInProgress:0, percentComplete:100, remainingRequirements:[], severity:'GREEN' },
 cumulativeGpa:2.5, engineeringInternshipRequired:false, engineeringInternshipCompleted:false,
 approvedTranscript:true, academicHoldsCleared:true, programme:'CS', curriculumYear:2028, curriculumHash:'approved-catalogue-sha256',
 registryApproval:{approved:true,approverId:'registry-officer-1',approvedAt:'2026-11-06T09:00:00Z',programme:'CS',curriculumYear:2028,curriculumHash:'approved-catalogue-sha256'}
};
describe('official graduation certification gate', () => {
 it('fails closed without Registry approval', () => expect(decideCertification({...evidence,registryApproval:null}).certified).toBe(false));
 it('fails with a GPA below 2.0', () => expect(decideCertification({...evidence,cumulativeGpa:1.99}).blockers).toContain('GPA_BELOW_2_OR_UNVERIFIED'));
 it('requires engineering internship when applicable', () => expect(decideCertification({...evidence,engineeringInternshipRequired:true}).blockers).toContain('ENGINEERING_INTERNSHIP_INCOMPLETE'));
 it('rejects a mismatched curriculum hash', () => expect(decideCertification({...evidence,curriculumHash:'changed'}).certified).toBe(false));
 it('permits certification only when all supplied approvals are valid', () => expect(decideCertification(evidence).certified).toBe(true));
});
