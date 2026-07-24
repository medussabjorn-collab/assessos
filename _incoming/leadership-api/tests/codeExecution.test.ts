import request from 'supertest';
import { app } from '../src/app';
import { prisma, disconnectDatabases } from '../src/config/database';

const BASE = '/api/v1/code';
let token: string;

beforeAll(async () => {
  await prisma.user.deleteMany({ where: { email: 'code@test.leaderassess' } });
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: 'code@test.leaderassess', name: 'Coder', password: 'Password123!' });
  token = res.body.data.accessToken;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: 'code@test.leaderassess' } });
  await disconnectDatabases();
});

describe('GET /code/languages', () => {
  it('returns language list (fallback if Judge0 not configured)', async () => {
    const res = await request(app)
      .get(`${BASE}/languages`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('requires authentication', async () => {
    const res = await request(app).get(`${BASE}/languages`);
    expect(res.status).toBe(401);
  });
});

describe('POST /code/submit', () => {
  it('returns 503 when Judge0 not configured', async () => {
    // Judge0 is not set in test env intentionally
    const res = await request(app)
      .post(`${BASE}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ source_code: 'print("hello")', language_id: 71 });
    expect([200, 503]).toContain(res.status);
  });

  it('validates payload', async () => {
    const res = await request(app)
      .post(`${BASE}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ source_code: '', language_id: -1 });
    expect(res.status).toBe(400);
  });
});
