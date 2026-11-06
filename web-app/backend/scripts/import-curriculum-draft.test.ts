import { describe, expect, it } from 'vitest';
import { parseImportArgs } from './import-curriculum-draft.js';

describe('controlled import CLI', () => {
 it('defaults to dry-run', () => {
  expect(parseImportArgs(['draft.json'])).toEqual({ file: 'draft.json', write: false });
 });
 it('requires explicit write flag', () => {
  expect(parseImportArgs(['draft.json', '--write'])).toEqual({ file: 'draft.json', write: true });
 });
 it('rejects absent or unsupported flags', () => {
  expect(() => parseImportArgs([])).toThrow();
  expect(() => parseImportArgs(['draft.json', '--force'])).toThrow();
  expect(() => parseImportArgs(['draft.json', '--write', '--write'])).toThrow();
 });
});
