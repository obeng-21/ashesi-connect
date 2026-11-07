import { describe, expect, it } from 'vitest';
import { PROGRAMMES, validateWorkbookRows } from './workbook-preview.js';
const complete = Object.fromEntries(PROGRAMMES.map(code => [code, [['Course', 'Credits'], ['ABC101', 1]] ]));
describe('2028 workbook structure', () => {
 it('accepts ten populated sheets', () => expect(validateWorkbookRows(complete)).toEqual([]));
 it('detects missing sheets', () => expect(validateWorkbookRows({})).toContain('MISSING_SHEET:CS'));
 it('detects empty sheets', () => expect(validateWorkbookRows({...complete, CS: [[null, '']] })).toContain('EMPTY_SHEET:CS'));
});
