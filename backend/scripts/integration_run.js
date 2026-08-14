const fs = require('fs');
const path = require('path');

async function run() {
  const base = 'http://localhost:4000';
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD || 'changeme';

  console.log('Logging in...');
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const loginBody = await loginRes.json();
  console.log('Login response:', loginRes.status, loginBody);
  const setCookie = loginRes.headers.get('set-cookie') || loginRes.headers.get('Set-Cookie');
  const cookie = setCookie ? setCookie.split(';')[0] : null;
  if (!cookie) {
    console.error('No cookie received, aborting');
    process.exit(1);
  }

  console.log('Creating office...');
  const officeRes = await fetch(`${base}/api/offices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ name: 'Integration Office', locality: 'Testland' }),
  });
  const office = await officeRes.json();
  console.log('Office created:', officeRes.status, office);

  console.log('Creating visit...');
  const visitRes = await fetch(`${base}/api/visits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ officeId: office.id, status: 'FOLLOW_UP', priority: 'WARM', contactName: 'Integration' }),
  });
  const visit = await visitRes.json();
  console.log('Visit created:', visitRes.status, visit);

  console.log('Uploading attachment...');
  const form = new FormData();
  const filePath = path.join(__dirname, '..', 'tests', 'fixtures', 'test.jpg');
  const buffer = fs.readFileSync(filePath);
  const blob = new Blob([buffer]);
  form.append('file', blob, 'test.jpg');
  const attachRes = await fetch(`${base}/api/visits/${visit.id}/attachments`, {
    method: 'POST',
    headers: { Cookie: cookie },
    body: form,
  });
  const attach = await attachRes.json();
  console.log('Attachment upload:', attachRes.status, attach);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
