export type CohortCurriculum = {
 version: string;
 status: 'DRAFT' | 'REVIEWED' | 'SUPERSEDED';
 validationIssues: string[];
 sources: Array<{ effectiveYear: number }>;
};

export type CohortSelection = {
 selectedVersion: string | null;
 issue: 'NO_APPLICABLE_CURRICULUM' | 'AMBIGUOUS_COHORT_CURRICULUM' | 'INVALID_COHORT_YEAR' | null;
};

/**
 * Select only an issue-free reviewed curriculum whose source year matches
 * the student's recorded cohort. Never choose by version string ordering.
 * An explicit cohort mapping is required if multiple versions match.
 */
export function selectCohortCurriculum(yearGroup: number, versions: CohortCurriculum[]): CohortSelection {
 if (!Number.isInteger(yearGroup) || yearGroup < 2000 || yearGroup > 2200) {
  return { selectedVersion: null, issue: 'INVALID_COHORT_YEAR' };
 }
 const matches = versions.filter(v =>
  v.status === 'REVIEWED' &&
  v.validationIssues.length === 0 &&
  v.sources.length > 0 &&
  v.sources.every(s => s.effectiveYear === yearGroup)
 );
 if (matches.length === 0) return { selectedVersion: null, issue: 'NO_APPLICABLE_CURRICULUM' };
 if (matches.length !== 1) return { selectedVersion: null, issue: 'AMBIGUOUS_COHORT_CURRICULUM' };
 return { selectedVersion: matches[0].version, issue: null };
}
