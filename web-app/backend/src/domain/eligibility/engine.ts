export type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'E';
export type CourseRecord = { code: string; credits: number; grade?: Grade; status?: 'Enrolled' | 'Incomplete'; attempt: number };
export type Requirement = { code: string; credits: number; minPassingGrade: Grade; category: string };
export type AuditResult = { eligible: boolean; creditsEarned: number; creditsRequired: number; creditsInProgress: number; percentComplete: number; remainingRequirements: { code: string; reason: string; credits: number }[] };
const order: Grade[] = ['E','D','D+','C','C+','B','B+','A','A+'];
export function evaluate(records: CourseRecord[], requirements: Requirement[], creditsRequired: number): AuditResult {
  const remainingRequirements: AuditResult['remainingRequirements'] = [];
  let creditsEarned = 0, creditsInProgress = 0;
  for (const requirement of requirements) {
    const attempts = records.filter(record => record.code === requirement.code).sort((a,b) => b.attempt-a.attempt);
    const passed = attempts.some(attempt => attempt.grade && order.indexOf(attempt.grade) >= order.indexOf(requirement.minPassingGrade));
    if (passed) { creditsEarned += requirement.credits; continue; }
    const inProgress = attempts.some(attempt => attempt.status === 'Enrolled');
    if (inProgress) creditsInProgress += requirement.credits;
    remainingRequirements.push({code: requirement.code, credits: requirement.credits, reason: inProgress ? 'IN_PROGRESS' : attempts.some(attempt => attempt.grade) ? 'FAILED' : 'NOT_TAKEN'});
  }
  return { eligible: remainingRequirements.length === 0 && creditsEarned >= creditsRequired, creditsEarned, creditsRequired, creditsInProgress, percentComplete: creditsRequired ? Math.min(100, Math.round(creditsEarned/creditsRequired*100)) : 0, remainingRequirements };
}
