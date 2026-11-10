import { validateCurriculum, type CurriculumVersion } from './curriculum-version.js';

export type ReviewInput = {
 reviewerId: string;
 evidenceReference: string;
 reviewedAt: Date;
};
export type ReviewDecision = {
 accepted: boolean;
 issues: string[];
 review: ReviewInput | null;
};

/** A review request never authorizes itself: caller must separately enforce ADMIN RBAC. */
export function planCurriculumReview(curriculum: CurriculumVersion, input: ReviewInput): ReviewDecision {
 const issues: string[] = [];
 if (curriculum.status !== 'DRAFT') issues.push('CURRICULUM_NOT_DRAFT');
 const validation = validateCurriculum(curriculum);
 issues.push(...validation.issues);
 if (!input.reviewerId.trim()) issues.push('REVIEWER_REQUIRED');
 if (!input.evidenceReference.trim() || input.evidenceReference.length > 500) issues.push('EVIDENCE_REFERENCE_REQUIRED');
 if (!(input.reviewedAt instanceof Date) || !Number.isFinite(input.reviewedAt.getTime())) issues.push('INVALID_REVIEW_DATE');
 return { accepted:issues.length===0, issues:[...new Set(issues)], review:issues.length?null:input };
}
