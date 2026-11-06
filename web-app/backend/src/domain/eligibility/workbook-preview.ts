export const PROGRAMMES = ['BA','ECON','LLB','MIS','CS','CE','EE','ME','MT','BE'] as const;
export type WorkbookRows = Record<string, unknown[][]>;
export function validateWorkbookRows(sheets: WorkbookRows): string[] {
 const errors: string[] = [];
 for (const code of PROGRAMMES) {
  const rows = sheets[code];
  if (!rows) { errors.push('MISSING_SHEET:' + code); continue; }
  if (!rows.some(row => row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ''))) errors.push('EMPTY_SHEET:' + code);
 }
 return errors;
}
