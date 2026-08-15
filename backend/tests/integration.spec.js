/* eslint-env jest */
const request = require('supertest');
const app = require('../src/app');

describe('Basic integration', () => {
  beforeAll(() => {
    process.env.ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'test@local'
    process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123'
  })

  test('ping returns ok', async () => {
    const res = await request(app).get('/api/ping');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  test('login with env admin works and sets cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });

    expect([200, 201]).toContain(res.status);
    expect(res.body.ok).toBeTruthy();
    const cookies = res.headers['set-cookie'] || [];
    expect(cookies.some(c => /token=/.test(c))).toBeTruthy();
  });
});
