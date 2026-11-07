/**
 * Temporary additional gate: restrict review writes to explicitly configured
 * authenticated user IDs. This is not proof of Registry authority.
 */
export function isAllowedCurriculumReviewer(userId: string | undefined, configuredIds: string | undefined): boolean {
 if (!userId || !configuredIds) return false;
 const ids = configuredIds.split(',').map(id => id.trim()).filter(Boolean);
 return ids.length > 0 && ids.includes(userId);
}
