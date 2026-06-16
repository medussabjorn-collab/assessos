import request from 'supertest';
import { app } from '../src/app';
import { prisma, disconnectDatabases } from '../src/config/database';

const BASE = '/api/v1/auth';

beforeAll(async () => {
  // Clean test users
  await prisma.user.deleteMany({ where: { email: { contains: '@test.leaderassess' } } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: '@test.leaderassess' } } });
  await disconnectDatabases();
});

describe('POST /auth/register', () => {
  it('creates a new user and returns tokens', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'register@test.leaderassess', name: 'Test User', password: 'Password123!' });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('user.email', 'register@test.leaderassess');
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('returns 409 for duplicate email', async () => {
    const payload = { email: 'dup@test.leaderassess', name: 'Dup', password: 'Password123!' };
    await request(app).post(`${BASE}/register`).send(payload);
    const res = await request(app).post(`${BASE}/register`).send(payload);
    expect(res.status).toBe(409);
  });

  it('returns 400 for invalid payload', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'not-an-email', name: 'X', password: '123' });
    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  const email = 'login@test.leaderassess';
  const password = 'Password123!';

  beforeAll(async () => {
    await request(app)
      .post(`${BASE}/register`)
      .send({ email, name: 'Login User', password });
  });

  it('returns tokens for valid credentials', async () => {
    const res = await request(app).post(`${BASE}/login`).send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app).post(`${BASE}/login`).send({ email, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for unknown email', async () => {
    const res = await request(app).post(`${BASE}/login`).send({ email: 'nobody@test.leaderassess', password });
    expect(res.status).toBe(401);
  });
});

describe('GET /auth/me', () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'me@test.leaderassess', name: 'Me User', password: 'Password123!' });
    token = res.body.data.accessToken;
  });

  it('returns the authenticated user', async () => {
    const res = await request(app)
      .get(`${BASE}/me`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('email', 'me@test.leaderassess');
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get(`${BASE}/me`);
    expect(res.status).toBe(401);
  });
});

describe('PUT /auth/me', () => {
  let token: string;

  beforeAll(async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'updateme@test.leaderassess', name: 'Old Name', password: 'Password123!' });
    token = res.body.data.accessToken;
  });

  it('updates the user name', async () => {
    const res = await request(app)
      .put(`${BASE}/me`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name' });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('name', 'New Name');
  });
});

describe('POST /auth/refresh', () => {
  it('returns new access token from cookie', async () => {
    const loginRes = await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'refresh@test.leaderassess', name: 'Refresh User', password: 'Password123!' });

    const cookies = loginRes.headers['set-cookie'] as string[];
    expect(cookies).toBeDefined();

    const res = await request(app)
      .post(`${BASE}/refresh`)
      .set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
  });
});

describe('POST /auth/logout', () => {
  it('clears the refresh cookie', async () => {
    const regRes = await request(app)
      .post(`${BASE}/register`)
      .send({ email: 'logout@test.leaderassess', name: 'Logout User', password: 'Password123!' });

    const token = regRes.body.data.accessToken;
    const res = await request(app)
      .post(`${BASE}/logout`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

describe('POST /auth/forgot-password', () => {
  it('always returns 200 (no email-existence leak)', async () => {
    const res = await request(app)
      .post(`${BASE}/forgot-password`)
      .send({ email: 'anyone@example.com' });
    expect(res.status).toBe(200);
  });
});

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });
});
