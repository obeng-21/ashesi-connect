import type { ProgrammeRules } from './programme-audit.js';

export type CurriculumSource = {
  sourceUrl: string;
  sourceKind: 'OFFICIAL_WEBSITE' | 'REGISTRY_PROVIDED_WORKBOOK';
  retrievedAt: string;
  effectiveYear: number;
  contentHash: string;
};
export type CurriculumVersion = {
  rules: ProgrammeRules;
  sources: CurriculumSource[];
  version: string;
  status: 'DRAFT' | 'REVIEWED' | 'SUPERSEDED';
};
export type CurriculumValidation = { valid: boolean; issues: string[] };

/** Validate completeness before making a programme ruleset available for assessments. */
export function validateCurriculum(input: CurriculumVersion): CurriculumValidation {
  const issues: string[] = [];
  const { rules } = input;
  if (!input.version.trim()) issues.push('MISSING_VERSION');
  if (!rules.programme.trim() || !rules.track.trim()) issues.push('MISSING_PROGRAMME_OR_TRACK');
  if (!Number.isFinite(rules.totalCredits) || rules.totalCredits <= 0) issues.push('INVALID_TOTAL_CREDITS');
  if (!rules.requiredCourses.length) issues.push('NO_REQUIRED_COURSES');
  const required = new Set<string>();
  for (const course of rules.requiredCourses) {
    if (!course.courseCode.trim() || required.has(course.courseCode)) issues.push('DUPLICATE_OR_EMPTY_REQUIRED_COURSE');
    required.add(course.courseCode);
    if (!Number.isFinite(course.credits) || course.credits <= 0) issues.push('INVALID_COURSE_CREDITS');
  }
  const poolCategories = new Set<string>();
  for (const pool of rules.electivePools) {
    if (!pool.category.trim() || poolCategories.has(pool.category)) issues.push('DUPLICATE_OR_EMPTY_ELECTIVE_POOL');
    poolCategories.add(pool.category);
    if (!Number.isFinite(pool.creditsRequired) || pool.creditsRequired < 0) issues.push('INVALID_ELECTIVE_CREDITS');
    if (pool.creditsRequired > 0 && !pool.courseCodes.length) issues.push('EMPTY_ELECTIVE_OPTIONS');
    if (pool.courseCodes.some(code => required.has(code))) issues.push('REQUIRED_COURSE_IN_ELECTIVE_POOL');
    if (pool.courseCodes.some(code => !code.trim())) issues.push('EMPTY_ELECTIVE_COURSE_CODE');
    if (new Set(pool.courseCodes).size !== pool.courseCodes.length) issues.push('DUPLICATE_ELECTIVE_COURSE');
    if (pool.africanStudiesMinimum !== undefined && (!Number.isInteger(pool.africanStudiesMinimum) || pool.africanStudiesMinimum < 0 || pool.africanStudiesMinimum > pool.courseCodes.length)) issues.push('INVALID_AFRICAN_STUDIES_MINIMUM');
  }
  const allElectiveCodes = rules.electivePools.flatMap(pool => pool.courseCodes);
  if (new Set(allElectiveCodes).size !== allElectiveCodes.length) issues.push('ELECTIVE_COURSE_IN_MULTIPLE_POOLS');
  const requiredCredits = rules.requiredCourses.reduce((sum, c) => sum + c.credits, 0);
  const poolCredits = rules.electivePools.reduce((sum, p) => sum + p.creditsRequired, 0);
  if (requiredCredits + poolCredits > rules.totalCredits + 0.0001) issues.push('CREDIT_REQUIREMENTS_EXCEED_TOTAL');
  if (input.sources.length === 0) issues.push('NO_POLICY_PROVENANCE');
  for (const source of input.sources) {
    if (!isValidHttpsUrl(source.sourceUrl) || !source.contentHash.trim() || !Number.isFinite(Date.parse(source.retrievedAt)) || !Number.isInteger(source.effectiveYear)) issues.push('INVALID_SOURCE_METADATA');
  }
  if (input.status === 'REVIEWED' && issues.length > 0) issues.push('REVIEWED_CURRICULUM_INVALID');
  return { valid: issues.length === 0, issues: [...new Set(issues)] };
}

function isValidHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}
