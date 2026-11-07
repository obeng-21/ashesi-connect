/** An explicit opt-in is required before any curriculum review write is attempted. */
export function isCurriculumReviewEnabled(value: string | undefined): boolean {
 return value === 'yes';
}
