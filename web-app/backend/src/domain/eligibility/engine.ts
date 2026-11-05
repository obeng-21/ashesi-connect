export type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D+' | 'D' | 'E';
export type Attempt = { courseCode: string; grade?: Grade; status?: 'IN_PROGRESS' | 'INCOMPLETE'; attempt: number };
export type Requirement = { courseCode: string; credits: number; minPassingGrade: Grade; category: string };
export type RequirementStatus = 'PASSED' | 'IN_PROGRESS' | 'FAILED' | 'NOT_TAKEN';
export type RequirementFinding = { courseCode: string; credits: number; category: string; status: RequirementStatus; passingAttempt?: number };
export type AuditResult = { eligible: boolean; eligibilityDetermined: boolean; creditsEarned: number; creditsRequired: number; creditsInProgress: number; percentComplete: number; findings: RequirementFinding[]; outstanding: RequirementFinding[] };
const grades: Grade[] = ['E','D','D+','C','C+','B','B+','A','A+'];
export function isPassing(grade: Grade, minimum: Grade): boolean {
  return grades.indexOf(grade) >= grades.indexOf(minimum);
}
/**
 * Starter-only evaluation of a VERIFIED list of required courses.
 * This does NOT implement elective pools, category credit minima, IAP, programme
 * tracks, capstone conditions or the full Ashesi 2028 graduation rules.
 * eligibilityDetermined stays false until the full ruleset is implemented.
 */
export function evaluate(attempts: Attempt[], requirements: Requirement[], creditsRequired: number): AuditResult {
  if (!Number.isFinite(creditsRequired) || creditsRequired < 0) throw new Error('Invalid creditsRequired');
  const seen = new Set<string>();
  let creditsEarned = 0, creditsInProgress = 0;
  const findings: RequirementFinding[] = [];
  for (const requirement of requirements) {
    if (!requirement.courseCode || seen.has(requirement.courseCode)) throw new Error('Duplicate or empty requirement code');
    seen.add(requirement.courseCode);
    if (!Number.isFinite(requirement.credits) || requirement.credits < 0) throw new Error('Invalid requirement credits');
    const courseAttempts = attempts.filter(a => a.courseCode === requirement.courseCode);
    const passingAttempt = courseAttempts.filter(a => a.grade && isPassing(a.grade, requirement.minPassingGrade)).sort((a,b) => b.attempt-a.attempt)[0];
    const inProgress = courseAttempts.some(a => a.status === 'IN_PROGRESS');
    const hasFailure = courseAttempts.some(a => a.grade !== undefined && !isPassing(a.grade,requirement.minPassingGrade));
    let status: RequirementStatus;
    if (passingAttempt) { status='PASSED'; creditsEarned+=requirement.credits; }
    else if (inProgress) { status='IN_PROGRESS'; creditsInProgress+=requirement.credits; }
    else status=hasFailure?'FAILED':'NOT_TAKEN';
    findings.push({courseCode:requirement.courseCode,credits:requirement.credits,category:requirement.category,status,...(passingAttempt?{passingAttempt:passingAttempt.attempt}:{})});
  }
  const outstanding = findings.filter(f => f.status !== 'PASSED');
  return {eligible:false,eligibilityDetermined:false,creditsEarned,creditsRequired,creditsInProgress,percentComplete:creditsRequired>0?Math.min(100,Math.round(creditsEarned/creditsRequired*100)):0,findings,outstanding};
}
