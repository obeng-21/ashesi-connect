/**
 * Framework-independent audit evaluator.
 * Only programme requirements loaded from a verified workbook should be used.
 * Financial, disciplinary and institutional clearance are out of scope.
 */
export type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'E';
export type CourseRecord = {
  code: string;
  credits: number;
  grade?: Grade;
  status?: 'Enrolled' | 'Incomplete';
  attempt: number;
};
export type Requirement = {
  code: string;
  credits: number;
  minPassingGrade: Grade;
  category: string;
};
export type ElectiveRequirement = {
  id: string;
  category: string;
  credits: number;
  eligibleCourseCodes: string[];
  minCourses?: number;
};
export type ProgrammeRules = {
  requiredCourses: Requirement[];
  electiveGroups?: ElectiveRequirement[];
  creditsRequired: number;
  africanStudiesCourseCodes?: string[];
  requiresAfricanStudies?: boolean;
};
export type RemainingReason =
  | 'NOT_TAKEN' | 'FAILED' | 'IN_PROGRESS' | 'INCOMPLETE'
  | 'ELECTIVE_SLOT_OPEN' | 'AFRICAN_STUDIES_MISSING' | 'CREDITS_SHORT';
export type AuditResult = {
  eligible: boolean;
  creditsEarned: number;
  creditsRequired: number;
  creditsInProgress: number;
  percentComplete: number;
  remainingRequirements: { code: string; reason: RemainingReason; credits: number }[];
  categoryCredits: Record<string, number>;
};
const gradeOrder: Grade[] = ['E', 'D', 'D+', 'C', 'C+', 'B', 'B+', 'A', 'A+'];
const round = (n: number) => Math.round(n * 100) / 100;
export function meetsThreshold(grade: Grade, threshold: Grade): boolean {
  return gradeOrder.indexOf(grade) >= gradeOrder.indexOf(threshold);
}
/** A passed attempt satisfies a course even if a later attempt exists. */
function bestPassedAttempt(attempts: CourseRecord[], threshold: Grade): CourseRecord | undefined {
  return attempts.filter(a => a.grade && meetsThreshold(a.grade, threshold))
    .sort((a, b) => b.attempt - a.attempt)[0];
}
export function evaluateProgramme(records: CourseRecord[], rules: ProgrammeRules): AuditResult {
  if (!Number.isFinite(rules.creditsRequired) || rules.creditsRequired <= 0) {
    throw new Error('creditsRequired must be positive and finite');
  }
  const seen = new Set<string>();
  for (const r of rules.requiredCourses) {
    if (seen.has(r.code)) throw new Error('Duplicate required course: ' + r.code);
    if (!Number.isFinite(r.credits) || r.credits <= 0) throw new Error('Invalid credits for ' + r.code);
    seen.add(r.code);
  }
  const byCode = new Map<string, CourseRecord[]>();
  for (const r of records) {
    if (!Number.isFinite(r.credits) || r.credits < 0) throw new Error('Invalid transcript credits');
    const arr = byCode.get(r.code) ?? [];
    arr.push(r);
    byCode.set(r.code, arr);
  }
  const remainingRequirements: AuditResult['remainingRequirements'] = [];
  const categoryCredits: Record<string, number> = {};
  const consumed = new Set<string>();
  let creditsEarned = 0, creditsInProgress = 0;
  for (const req of rules.requiredCourses) {
    const attempts = byCode.get(req.code) ?? [];
    const passed = bestPassedAttempt(attempts, req.minPassingGrade);
    if (passed) {
      creditsEarned += req.credits;
      categoryCredits[req.category] = round((categoryCredits[req.category] ?? 0) + req.credits);
      consumed.add(req.code);
      continue;
    }
    const inProgress = attempts.some(a => a.status === 'Enrolled');
    if (inProgress) creditsInProgress += req.credits;
    const reason: RemainingReason = inProgress ? 'IN_PROGRESS'
      : attempts.some(a => a.status === 'Incomplete') ? 'INCOMPLETE'
      : attempts.some(a => a.grade) ? 'FAILED' : 'NOT_TAKEN';
    remainingRequirements.push({ code: req.code, reason, credits: req.credits });
  }
  for (const group of rules.electiveGroups ?? []) {
    if (group.credits < 0 || !Number.isFinite(group.credits)) throw new Error('Invalid elective credits');
    let groupCredits = 0, count = 0;
    for (const code of group.eligibleCourseCodes) {
      if (consumed.has(code)) continue;
      const passed = bestPassedAttempt(byCode.get(code) ?? [], 'D+');
      if (!passed) continue;
      consumed.add(code);
      groupCredits += passed.credits;
      count++;
    }
    const recognized = Math.min(groupCredits, group.credits);
    creditsEarned += recognized;
    categoryCredits[group.category] = round((categoryCredits[group.category] ?? 0) + recognized);
    if (groupCredits < group.credits || count < (group.minCourses ?? 0)) {
      remainingRequirements.push({
        code: group.id,
        reason: 'ELECTIVE_SLOT_OPEN',
        credits: round(Math.max(0, group.credits - groupCredits))
      });
    }
  }
  if (rules.requiresAfricanStudies) {
    const codes = rules.africanStudiesCourseCodes ?? [];
    const passed = codes.some(code => bestPassedAttempt(byCode.get(code) ?? [], 'D+'));
    if (!passed) remainingRequirements.push({
      code: 'AFRICAN_STUDIES',
      reason: 'AFRICAN_STUDIES_MISSING',
      credits: 0
    });
  }
  creditsEarned = round(creditsEarned);
  if (creditsEarned < rules.creditsRequired) {
    remainingRequirements.push({
      code: 'TOTAL_CREDITS', reason: 'CREDITS_SHORT',
      credits: round(rules.creditsRequired - creditsEarned)
    });
  }
  return {
    eligible: remainingRequirements.length === 0,
    creditsEarned,
    creditsRequired: rules.creditsRequired,
    creditsInProgress: round(creditsInProgress),
    percentComplete: Math.min(100, round(creditsEarned / rules.creditsRequired * 100)),
    remainingRequirements,
    categoryCredits
  };
}
/** Compatibility adapter for the initial simple engine API. */
export function evaluate(records: CourseRecord[], requirements: Requirement[], creditsRequired: number): AuditResult {
  return evaluateProgramme(records, { requiredCourses: requirements, creditsRequired });
}
