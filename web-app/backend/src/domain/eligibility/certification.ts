import type { DetailedAudit } from './programme-audit.js';

export type RegistryApproval = {
  approved: boolean;
  approverId: string;
  approvedAt: string;
  programme: string;
  curriculumYear: number;
  curriculumHash: string;
};
export type CertificationEvidence = {
  audit: DetailedAudit;
  cumulativeGpa: number | null;
  engineeringInternshipRequired: boolean;
  engineeringInternshipCompleted: boolean;
  approvedTranscript: boolean;
  academicHoldsCleared: boolean;
  registryApproval: RegistryApproval | null;
  programme: string;
  curriculumYear: number;
  curriculumHash: string;
};
export type CertificationDecision = { certified: boolean; blockers: string[] };
/** Official certification is fail-closed and requires independently recorded Registry approval. */
export function decideCertification(e: CertificationEvidence): CertificationDecision {
 const blockers: string[] = [];
 if (!e.audit.eligibilityDetermined || !e.audit.eligible || e.audit.remainingRequirements.length) blockers.push('ACADEMIC_REQUIREMENTS_INCOMPLETE');
 if (e.cumulativeGpa === null || !Number.isFinite(e.cumulativeGpa) || e.cumulativeGpa < 2) blockers.push('GPA_BELOW_2_OR_UNVERIFIED');
 if (e.engineeringInternshipRequired && !e.engineeringInternshipCompleted) blockers.push('ENGINEERING_INTERNSHIP_INCOMPLETE');
 if (!e.approvedTranscript) blockers.push('TRANSCRIPT_NOT_APPROVED');
 if (!e.academicHoldsCleared) blockers.push('ACADEMIC_HOLDS_NOT_CLEARED');
 const a = e.registryApproval;
 if (!a?.approved || !a.approverId || !a.approvedAt || !a.curriculumHash || a.programme !== e.programme || a.curriculumYear !== e.curriculumYear || a.curriculumHash !== e.curriculumHash || !Number.isFinite(Date.parse(a.approvedAt))) blockers.push('REGISTRY_APPROVAL_REQUIRED');
 return { certified: blockers.length === 0, blockers };
}

/**
 * Development-only, policy-based assessment. Never represents an Ashesi-issued
 * graduation certificate, degree conferral, or Registry endorsement.
 */
export type ProvisionalAssessment = {
  status: 'PROVISIONALLY_ELIGIBLE' | 'REQUIREMENTS_OUTSTANDING' | 'INSUFFICIENT_DATA';
  basis: 'PUBLISHED_POLICY_AND_PROVIDED_CURRICULUM';
  officialCertification: false;
  blockers: string[];
};
export function assessProvisionalGraduation(
  evidence: Omit<CertificationEvidence, 'registryApproval' | 'approvedTranscript' | 'academicHoldsCleared'> & {
    serviceLearningCompleted?: boolean;
    writingLabRequired?: boolean;
    writingLabCompleted?: boolean;
    financialClearance?: boolean;
  }
): ProvisionalAssessment {
  const blockers: string[] = [];
  if (!evidence.audit.eligibilityDetermined) blockers.push('CURRICULUM_UNVERIFIED');
  if (!evidence.audit.eligible || evidence.audit.remainingRequirements.length) blockers.push('COURSE_REQUIREMENTS_OUTSTANDING');
  if (evidence.cumulativeGpa === null || !Number.isFinite(evidence.cumulativeGpa)) blockers.push('GPA_UNAVAILABLE');
  else if (evidence.cumulativeGpa < 2) blockers.push('GPA_BELOW_2');
  if (evidence.engineeringInternshipRequired && !evidence.engineeringInternshipCompleted) blockers.push('ENGINEERING_INTERNSHIP_OUTSTANDING');
  if (evidence.serviceLearningCompleted !== true) blockers.push('SERVICE_LEARNING_UNCONFIRMED');
  if (evidence.writingLabRequired !== false && evidence.writingLabCompleted !== true) blockers.push('WRITING_LAB_UNCONFIRMED');
  if (evidence.financialClearance !== true) blockers.push('FINANCIAL_CLEARANCE_UNCONFIRMED');
  const insufficient = blockers.some(x => ['CURRICULUM_UNVERIFIED','GPA_UNAVAILABLE','SERVICE_LEARNING_UNCONFIRMED','WRITING_LAB_UNCONFIRMED','FINANCIAL_CLEARANCE_UNCONFIRMED'].includes(x));
  return { status: blockers.length === 0 ? 'PROVISIONALLY_ELIGIBLE' : insufficient ? 'INSUFFICIENT_DATA' : 'REQUIREMENTS_OUTSTANDING', basis: 'PUBLISHED_POLICY_AND_PROVIDED_CURRICULUM', officialCertification: false, blockers };
}
