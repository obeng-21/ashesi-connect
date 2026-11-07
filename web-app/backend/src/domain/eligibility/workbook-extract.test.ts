import { describe, expect, it } from 'vitest';
import { extractProgramme } from './workbook-extract.js';
describe('source workbook extraction', () => {
 it('preserves courses, half credits and printed totals', () => {
  const result = extractProgramme([{sourceRow:7,cells:[null,'Humanities','Written and Oral Comm.']},{sourceRow:9,cells:[null,null,'Leadership 1*']},{sourceRow:15,cells:[null,null,'1.5 Ashesi Credits']}]);
  expect(result.courses.map(x => x.credits)).toEqual([1,0.5]);
  expect(result.printedTotals[0].credits).toBe(1.5);
  expect(result.courses[1].sourceRow).toBe(9);
 });
 it('flags conditional tracks for manual mapping', () => {
  const result = extractProgramme([{sourceRow:20,cells:[null,'Mathematics','Pre-Calculus 1 / Calculus 1']}]);
  expect(result.issues).toContain('CONDITIONAL_COURSE_ROW:20');
 });
});
