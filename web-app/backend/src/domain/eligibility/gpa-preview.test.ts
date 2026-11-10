import { describe, expect, it } from 'vitest';
import { previewGpa } from './gpa-preview.js';

describe('exploratory GPA preview',()=>{
 it('calculates credit-weighted GPA for distinct graded courses',()=>{
  const result=previewGpa([
   {courseCode:'CS101',attempt:1,credits:1,grade:'A'},
   {courseCode:'CS102',attempt:1,credits:2,grade:'B'}
  ]);
  expect(result).toEqual({gpa:3.333,gradedCredits:3,issues:[]});
 });
 it('does not invent repeat-course policy',()=>{
  const result=previewGpa([
   {courseCode:'CS101',attempt:1,credits:1,grade:'E'},
   {courseCode:'CS101',attempt:2,credits:1,grade:'A'}
  ]);
  expect(result.gpa).toBeNull();
  expect(result.issues).toContain('REPEAT_GPA_POLICY_UNVERIFIED');
 });
 it('does not count in-progress courses as graded',()=>{
  expect(previewGpa([{courseCode:'CS101',attempt:1,credits:1,status:'IN_PROGRESS'}]).issues).toContain('NO_GRADED_CREDITS');
 });
 it('fails closed on invalid credits',()=>{
  expect(previewGpa([{courseCode:'CS101',attempt:1,credits:-1,grade:'A'}]).gpa).toBeNull();
 });
});
