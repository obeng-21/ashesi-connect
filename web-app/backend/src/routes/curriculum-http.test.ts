import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import { curriculumRouter } from './curriculum.js';
import { issueAccessToken } from '../auth.js';

const originalSecret = process.env.JWT_ACCESS_SECRET;
const originalFlag = process.env.ENABLE_CURRICULUM_REVIEW;
const originalAllowlist = process.env.CURRICULUM_REVIEWER_IDS;
let server: Server;
let baseUrl: string;
beforeAll(async () => {
 process.env.JWT_ACCESS_SECRET = 'integration-test-secret-do-not-use-in-production';
 delete process.env.ENABLE_CURRICULUM_REVIEW;
 delete process.env.CURRICULUM_REVIEWER_IDS;
 const app = express();
 app.use(express.json());
 app.use('/api/v1', curriculumRouter);
 await new Promise<void>(resolve => {
  server = app.listen(0, '127.0.0.1', () => resolve());
 });
 const address = server.address();
 if (!address || typeof address === 'string') throw Error('Expected TCP listener');
 baseUrl = 'http://127.0.0.1:' + address.port;
});
afterAll(async () => {
 await new Promise<void>((resolve,reject) => server.close(error => error ? reject(error) : resolve()));
 if (originalSecret === undefined) delete process.env.JWT_ACCESS_SECRET;
 else process.env.JWT_ACCESS_SECRET = originalSecret;
 if (originalFlag === undefined) delete process.env.ENABLE_CURRICULUM_REVIEW;
 else process.env.ENABLE_CURRICULUM_REVIEW = originalFlag;
 if (originalAllowlist === undefined) delete process.env.CURRICULUM_REVIEWER_IDS;
 else process.env.CURRICULUM_REVIEWER_IDS = originalAllowlist;
});
async function review(token?: string) {
 return fetch(baseUrl+'/api/v1/admin/curricula/review',{
  method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},
  body:JSON.stringify({programme:'CS',track:'standard',version:'2028-v1',evidenceReference:'test-evidence'})
 });
}
describe('curriculum review HTTP authorization gates', () => {
 it('rejects unauthenticated requests',async () => {
  const response = await review();
  expect(response.status).toBe(401);
  expect((await response.json()).error).toBe('UNAUTHORIZED');
 });
 it('rejects STUDENT tokens before touching the database',async () => {
  const token = issueAccessToken({id:'student-1',role:'STUDENT',studentId:'student-1'});
  const response = await review(token);
  expect(response.status).toBe(403);
  expect((await response.json()).error).toBe('FORBIDDEN');
 });
 it('returns a disabled response to admins by default',async () => {
  const token = issueAccessToken({id:'admin-1',role:'ADMIN'});
  const response = await review(token);
  expect(response.status).toBe(503);
  expect((await response.json()).error).toBe('CURRICULUM_REVIEW_DISABLED');
 });
 it('denies an admin who is not explicitly allowlisted',async () => {
  process.env.ENABLE_CURRICULUM_REVIEW = 'yes';
  process.env.CURRICULUM_REVIEWER_IDS = 'admin-2';
  try {
   const token = issueAccessToken({id:'admin-1',role:'ADMIN'});
   const response = await review(token);
   expect(response.status).toBe(403);
   expect((await response.json()).error).toBe('REVIEWER_NOT_AUTHORIZED');
  } finally {
   delete process.env.ENABLE_CURRICULUM_REVIEW;
   delete process.env.CURRICULUM_REVIEWER_IDS;
  }
 });
});
