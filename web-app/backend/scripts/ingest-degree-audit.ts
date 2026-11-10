/**
 * Workbook inspection and normalization preview.
 * Usage: npx tsx scripts/ingest-degree-audit.ts /path/to/Degree_Audit_2028.xlsx
 * This script never writes to the production database.
 */
import * as XLSX from 'xlsx';
import { writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { validateWorkbookRows } from '../src/domain/eligibility/workbook-preview.js';
import { extractProgramme } from '../src/domain/eligibility/workbook-extract.js';
const input = process.argv[2];
if (!input) throw Error('Usage: ingest-degree-audit.ts <workbook.xlsx>');
const workbook = XLSX.readFile(input, { cellDates: false });
const programmes = ['BA','ECON','LLB','MIS','CS','CE','EE','ME','MT','BE'];
const allRows: Record<string, unknown[][]> = {};
const output = programmes.map(programme => {
 const sheet = workbook.Sheets[programme];
 if (!sheet) throw Error('Missing programme sheet: ' + programme);
 const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
 allRows[programme] = rows;
 const sourceRows = rows.map((cells, index) => ({ sourceRow: index + 1, cells })).filter(row => row.cells.some(cell => cell !== null && cell !== ''));
 return { programme, sourceSheet: programme, rows: sourceRows, extraction: extractProgramme(sourceRows) };
});
const issues = validateWorkbookRows(allRows);
if (issues.length) throw Error('Workbook validation failed: ' + issues.join(', '));
const sourceSha256 = createHash('sha256').update(readFileSync(input)).digest('hex');
writeFileSync('degree-audit-normalized-preview.json', JSON.stringify({ schemaVersion: 1, sourceSha256, programmes: output, readyForCertification: false, mappingStatus: 'PENDING_RECONCILIATION' }, null, 2));
console.log('Inspected', output.length, 'programme sheets. Output requires registry reconciliation before import.');
