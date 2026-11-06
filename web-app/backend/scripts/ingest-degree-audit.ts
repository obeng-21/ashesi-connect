/**
 * Workbook inspection and normalization preview.
 * Usage: npx tsx scripts/ingest-degree-audit.ts /path/to/Degree_Audit_2028.xlsx
 * This script never writes to the production database.
 */
import * as XLSX from 'xlsx';
import { writeFileSync } from 'node:fs';
const input = process.argv[2];
if (!input) throw Error('Usage: ingest-degree-audit.ts <workbook.xlsx>');
const workbook = XLSX.readFile(input, { cellDates: false });
const programmes = ['BA','ECON','LLB','MIS','CS','CE','EE','ME','MT','BE'];
const output = programmes.map(programme => {
 const sheet = workbook.Sheets[programme];
 if (!sheet) throw Error('Missing programme sheet: ' + programme);
 const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
 return { programme, sourceSheet: programme, rows: rows.map((cells, index) => ({ sourceRow: index + 1, cells })).filter(row => row.cells.some(cell => cell !== null && cell !== '')) };
});
writeFileSync('degree-audit-normalized-preview.json', JSON.stringify({ source: input, programmes: output }, null, 2));
console.log('Inspected', output.length, 'programme sheets. Output requires registry reconciliation before import.');
