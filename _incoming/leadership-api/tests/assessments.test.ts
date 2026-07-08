import request from 'supertest';
import { app } from '../src/app';
import { prisma, disconnectDatabases } from '../src/config/database';

const BASE = '/api/v1';
let adminToken: string;
let candidateToken: string;

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@assess.leaderassess' } } });

  const adminRes = await request(app)
    .post(`${BASE}/auth/register`)
    .send({ email: 'admin@assess.leaderassess', name: 'Admin', password: 'Password123!', role: 'admin' });
  adminToken = adminRes.body.data.accessToken;

  const candidateRes = await request(app)
    .post(`${BASE}/auth/register`)
    .send({ email: 'candidate@assess.leaderassess', name: 'Candidate', password: 'Password123!' });
  candidateToken = candidateRes.body.data.accessToken;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@assess.leaderassess' } } });
  await disconnectDatabases();
});

describe('POST /assessments/start', () => {
  it('starts a new assessment session', async () => {
    const res = await request(app)
      .post(`${BASE}/assessments/start`)
      .set('Authorization', `Bearer ${candidateToken}`)
      .send({ module: 'technical', language: 'en' });

    expect([200, 201]).toContain(res.status);
    if (res.status === 201 || res.status === 200) {
      expect(res.body.data).toHaveProperty('sessionId');
    }
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .post(`${BASE}/assessments/start`)
      .send({ module: 'technical' });
    expect(res.status).toBe(401);
  });
});

describe('GET /assessments', () => {
  it('returns assessment history for authenticated user', async () => {
    const res = await request(app)
      .get(`${BASE}/assessments`)
      .set('Authorization', `Bearer ${candidateToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('sessions');
  });
});
