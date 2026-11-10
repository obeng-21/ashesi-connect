import { evaluateProgramme, type DetailedAudit, type ProgrammeRules } from './programme-audit.js';
import { mapEnrollmentTranscript, type EnrollmentRecord } from './transcript-mapping.js';

export type PreviewResult = {
 status: 'INSUFFICIENT_DATA' | 'REQUIREMENTS_OUTSTANDING' | 'ACADEMIC_REQUIREMENTS_MET';
 officialCertification: false;
 provisionalOnly: true;
 audit: DetailedAudit | null;
 issues: string[];
};

/** Preview is not a Registry decision, degree conferral or certification. */
export function previewAcademicProgress(records: EnrollmentRecord[], rules: ProgrammeRules | null): PreviewResult {
 const mapping = mapEnrollmentTranscript(records);
 const issues = [...mapping.issues];
 if (!rules) issues.push('CURRICULUM_UNAVAILABLE');
 if (!mapping.entries.length) issues.push('TRANSCRIPT_UNAVAILABLE');
 if (!rules || issues.length) {
  return { status: 'INSUFFICIENT_DATA', officialCertification: false, provisionalOnly: true, audit: null, issues };
 }
 try {
  // A provisional preview must never inherit Registry verification from a caller.
  const audit = evaluateProgramme(mapping.entries, { ...rules, verifiedByRegistry: false });
  return {
   status: audit.remainingRequirements.length ? 'REQUIREMENTS_OUTSTANDING' : 'ACADEMIC_REQUIREMENTS_MET',
   officialCertification: false, provisionalOnly: true, audit, issues: []
  };
 } catch {
  return { status: 'INSUFFICIENT_DATA', officialCertification: false, provisionalOnly: true, audit: null, issues: ['INVALID_CURRICULUM_OR_TRANSCRIPT'] };
 }
}
