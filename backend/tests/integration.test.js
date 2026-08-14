const request = require('supertest');
const path = require('path');

const base = process.env.TEST_BASE_URL || 'http://localhost:4000';
const agent = request.agent(base);

describe('Backend integration tests', () => {
  jest.setTimeout(20000);

  test('login, create office, create visit, upload attachment', async () => {
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'changeme';

    const login = await agent.post('/api/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    expect(login.body.ok).toBeTruthy();

    // create office
    const officeRes = await agent.post('/api/offices').send({ name: 'Test Office', locality: 'Testland' });
    expect(officeRes.status).toBe(201);
    const officeId = officeRes.body.id;
    expect(officeId).toBeDefined();

    // create visit
    const visitRes = await agent.post('/api/visits').send({ officeId, status: 'FOLLOW_UP', priority: 'WARM', contactName: 'Tester' });
    expect(visitRes.status).toBe(201);
    const visitId = visitRes.body.id;
    expect(visitId).toBeDefined();

    // upload attachment
    const filePath = path.join(__dirname, 'fixtures', 'test.jpg');
    const attachRes = await agent.post(`/api/visits/${visitId}/attachments`).attach('file', filePath);
    expect(attachRes.status).toBe(201);
    expect(attachRes.body.fileUrl).toBeDefined();
  });
});
