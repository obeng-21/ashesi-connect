import type { TranscriptEntry } from './programme-audit.js';
import type { Grade } from './engine.js';

export type GpaPreview = { gpa: number | null; gradedCredits: number; issues: string[] };
const points: Record<Grade, number> = {
 'A+':4,'A':4,'B+':3.5,'B':3,'C+':2.5,'C':2,'D+':1.5,'D':1,'E':0
};

/**
 * Exploratory GPA only: institutional repeat policies, grade weights and
 * transfer exclusions must be verified before treating this as official GPA.
 */
export function previewGpa(entries: TranscriptEntry[]): GpaPreview {
 const issues: string[] = [];
 const attempts = new Map<string, TranscriptEntry[]>();
 for (const entry of entries) {
  if (!entry.courseCode.trim() || !Number.isFinite(entry.credits) || entry.credits <= 0) {
   issues.push('INVALID_GPA_ENTRY'); continue;
  }
  if (!entry.grade) continue;
  if (!(entry.grade in points)) { issues.push('UNSUPPORTED_GRADE'); continue; }
  const existing = attempts.get(entry.courseCode) ?? [];
  existing.push(entry);
  attempts.set(entry.courseCode, existing);
 }
 if (issues.length) return { gpa:null, gradedCredits:0, issues };
 // Do not guess how repeat attempts contribute to the institutional GPA.
 if ([...attempts.values()].some(items => items.length > 1)) {
  return { gpa:null, gradedCredits:0, issues:['REPEAT_GPA_POLICY_UNVERIFIED'] };
 }
 const graded = [...attempts.values()].flat();
 const gradedCredits = graded.reduce((sum,e)=>sum+e.credits,0);
 if (gradedCredits === 0) return { gpa:null, gradedCredits:0, issues:['NO_GRADED_CREDITS'] };
 const gpa = graded.reduce((sum,e)=>sum+e.credits*points[e.grade!],0)/gradedCredits;
 return { gpa:Math.round(gpa*1000)/1000, gradedCredits, issues:[] };
}
