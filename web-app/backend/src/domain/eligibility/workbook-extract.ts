export type WorkbookRow = { sourceRow: number; cells: unknown[] };
export type PrintedTotal = { category: string; credits: number; sourceRow: number };
export type CourseLine = { name: string; category: string; credits: number; sourceRow: number };
export type ProgrammeExtraction = {
 courses: CourseLine[]; printedTotals: PrintedTotal[];
 issues: string[]; calculatedCredits: number;
};
/**
 * Parse audit sheet's visible rows without inventing elective names or track choices.
 * Rows with printed totals are preserved as evidence rather than treated as courses.
 */
export function extractProgramme(rows: WorkbookRow[]): ProgrammeExtraction {
 const courses: CourseLine[] = [];
 const printedTotals: PrintedTotal[] = [];
 const issues: string[] = [];
 let category = 'Unclassified';
 for (const row of rows) {
  const cells = row.cells;
  const section = typeof cells[1] === 'string' ? cells[1].trim() : '';
  if (section && !/^total credits/i.test(section)) category = section;
  const raw = typeof cells[2] === 'string' ? cells[2].trim() : '';
  if (!raw) continue;
  const total = raw.match(/^(\d+(?:\.\d+)?)\s*(?:Ashesi\s*)?Credits?$/i);
  if (total) {
   printedTotals.push({ category: section || category, credits: Number(total[1]), sourceRow: row.sourceRow });
   continue;
  }
  if (/^\(?(?:\d+(?:\.\d+)?\s+if\b)/i.test(raw) || /^\d+\s+.*electives?/i.test(raw)) continue;
  if (/^\(.*track\)/i.test(raw) || /^\* indicates/i.test(raw)) continue;
  if (/^\d+(?:\.\d+)?\s+Ashesi\s+Credit/i.test(raw)) continue;
  if (/^\d+(?:\.\d+)?\s+credits?\b/i.test(raw)) continue;
  if (/^\d+(?:\.\d+)?\s+.*credit/i.test(raw)) continue;
  if (raw.includes(' / ') || raw.includes(' only') || raw.includes('could be')) {
   issues.push('CONDITIONAL_COURSE_ROW:' + row.sourceRow);
  }
  if (/^\d+\s+(?:Non-Major|[A-Z]+)\s+Electives?/i.test(raw)) continue;
  if (/^\d+(?:\.\d+)?\s+Ashesi/i.test(raw)) continue;
  if (/^\(\d/.test(raw)) continue;
  if (section.toLowerCase().startsWith('total credits')) continue;
  if (/^total credits overall$/i.test(section)) continue;
  if (raw === '0 Ashesi Credit') continue;
  courses.push({ name: raw, category, credits: raw.includes('*') ? 0.5 : 1, sourceRow: row.sourceRow });
 }
 const calculatedCredits = courses.reduce((sum, course) => sum + course.credits, 0);
 if (printedTotals.length === 0) issues.push('NO_PRINTED_TOTALS');
 return { courses, printedTotals, issues, calculatedCredits };
}
