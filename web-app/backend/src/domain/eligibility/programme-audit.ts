import type { Grade } from './engine.js';

export type TranscriptEntry = {
  courseCode: string; grade?: Grade; status?: 'IN_PROGRESS' | 'INCOMPLETE';
  attempt: number; credits: number; africanStudies?: boolean;
};
export type CourseRule = { courseCode: string; credits: number; minimumGrade: Grade; category: string };
export type ElectiveRule = { category: string; creditsRequired: number; courseCodes: string[]; africanStudiesMinimum?: number; minimumGrade?: Grade };
export type ProgrammeRules = {
  programme: string; track: string; requiredCourses: CourseRule[];
  electivePools: ElectiveRule[]; totalCredits: number;
  verifiedByRegistry: boolean;
};
export type Remaining = { code: string; category: string; credits: number; reason: 'NOT_TAKEN' | 'FAILED' | 'IN_PROGRESS' | 'INCOMPLETE' | 'ELECTIVE_SLOT_OPEN' | 'AFRICAN_STUDIES_MISSING' | 'CREDIT_SHORTFALL' };
export type DetailedAudit = { eligible: boolean; eligibilityDetermined: boolean; creditsEarned: number; creditsRequired: number; creditsInProgress: number; percentComplete: number; remainingRequirements: Remaining[]; severity: 'GREEN' | 'YELLOW' | 'RED' | 'UNDETERMINED' };

const gradeRank: Grade[] = ['E','D','D+','C','C+','B','B+','A','A+'];
const passes = (grade: Grade | undefined, minimum: Grade) => grade !== undefined && gradeRank.indexOf(grade) >= gradeRank.indexOf(minimum);
const round = (n: number) => Math.round(n * 100) / 100;
function latestPassing(entries: TranscriptEntry[], minimum: Grade) {
 return entries.filter(e => passes(e.grade, minimum)).sort((a,b) => b.attempt - a.attempt)[0];
}
/** Conservative audit: no student can be certified until registrar rules are verified. */
export function evaluateProgramme(transcript: TranscriptEntry[], rules: ProgrammeRules): DetailedAudit {
 if (!Number.isFinite(rules.totalCredits) || rules.totalCredits <= 0) throw Error('Invalid total credits');
 const seen = new Set<string>();
 for (const r of rules.requiredCourses) {
  if (!r.courseCode.trim() || seen.has(r.courseCode) || !Number.isFinite(r.credits) || r.credits <= 0) throw Error('Invalid or duplicate required course');
  seen.add(r.courseCode);
 }
 const remainingRequirements: Remaining[] = [];
 const earned = new Map<string, TranscriptEntry>();
 let inProgress = 0;
 for (const entry of transcript) {
  if (!entry.courseCode || !Number.isFinite(entry.credits) || entry.credits < 0) throw Error('Invalid transcript');
 }
 const addPassing = (entry: TranscriptEntry) => {
  const prior = earned.get(entry.courseCode);
  if (!prior || entry.attempt > prior.attempt) earned.set(entry.courseCode, entry);
 };
 for (const rule of rules.requiredCourses) {
  const attempts = transcript.filter(e => e.courseCode === rule.courseCode);
  const passed = latestPassing(attempts, rule.minimumGrade);
  if (passed) { addPassing({ ...passed, credits: rule.credits }); continue; }
  const active = attempts.some(e => e.status === 'IN_PROGRESS');
  if (active) inProgress += rule.credits;
  remainingRequirements.push({ code: rule.courseCode, category: rule.category, credits: rule.credits, reason: active ? 'IN_PROGRESS' : attempts.some(e => e.status === 'INCOMPLETE') ? 'INCOMPLETE' : attempts.some(e => e.grade) ? 'FAILED' : 'NOT_TAKEN' });
 }
 for (const pool of rules.electivePools) {
  if (!Number.isFinite(pool.creditsRequired) || pool.creditsRequired < 0) throw Error('Invalid elective requirement');
  const eligible = transcript.filter(e => pool.courseCodes.includes(e.courseCode) && passes(e.grade, pool.minimumGrade ?? 'D'));
  const distinct = new Map<string, TranscriptEntry>();
  for (const e of eligible) if (!distinct.has(e.courseCode) || distinct.get(e.courseCode)!.attempt < e.attempt) distinct.set(e.courseCode,e);
  let credits = 0;
  for (const e of distinct.values()) { if (!earned.has(e.courseCode)) { addPassing(e); credits += e.credits; } }
  if (credits < pool.creditsRequired) remainingRequirements.push({ code: pool.category, category: pool.category, credits: round(pool.creditsRequired - credits), reason: 'ELECTIVE_SLOT_OPEN' });
  if (pool.africanStudiesMinimum && [...distinct.values()].filter(e => e.africanStudies).length < pool.africanStudiesMinimum) remainingRequirements.push({ code: 'AFRICAN_STUDIES', category: pool.category, credits: 0, reason: 'AFRICAN_STUDIES_MISSING' });
 }
 const creditsEarned = round([...earned.values()].reduce((sum,e) => sum + e.credits,0));
 if (creditsEarned < rules.totalCredits) remainingRequirements.push({ code: 'TOTAL_CREDITS', category: 'Overall', credits: round(rules.totalCredits - creditsEarned), reason: 'CREDIT_SHORTFALL' });
 const eligibilityDetermined = rules.verifiedByRegistry;
 const eligible = eligibilityDetermined && remainingRequirements.length === 0;
 return { eligible, eligibilityDetermined, creditsEarned, creditsRequired: rules.totalCredits, creditsInProgress: round(inProgress), percentComplete: Math.min(100,round(100 * creditsEarned / rules.totalCredits)), remainingRequirements, severity: !eligibilityDetermined ? 'UNDETERMINED' : eligible ? 'GREEN' : 'YELLOW' };
}
