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
