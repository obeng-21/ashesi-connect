import { describe, expect, it } from 'vitest';
import { assertStagingCurriculumUri, parseImportArgs } from './import-curriculum-draft.js';

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
  expect(() => parseImportArgs(['--write'])).toThrow();
  expect(() => parseImportArgs(['draft.json', 'another.json'])).toThrow();
 });
});


describe('curriculum draft database isolation', () => {
 it('accepts explicit isolated staging database', () => {
  expect(() => assertStagingCurriculumUri('mongodb+srv://user:password@cluster.example.net/ashesi_graduation_staging?retryWrites=true')).not.toThrow();
  expect(() => assertStagingCurriculumUri('mongodb://user:password@localhost:27017/ashesi_graduation_staging')).not.toThrow();
 });
 it('rejects missing, production, and non-MongoDB database targets', () => {
  for (const uri of [
   'mongodb+srv://user:password@cluster.example.net/',
   'mongodb+srv://user:password@cluster.example.net/production',
   'mongodb+srv://user:password@cluster.example.net/ashesi_graduation_staging_backup',
   'mongodb+srv://user:password@cluster.example.net/ashesi_graduation_staging/extra',
   'https://cluster.example.net/ashesi_graduation_staging',
   'not-a-uri'
  ]) expect(() => assertStagingCurriculumUri(uri)).toThrow();
 });
});
