import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDatabase } from '../src/database.js';
import { Appeal, Dossier } from '../src/models.js';

const origin = 'http://localhost:5174';
const appealsPath = '/api/dossiers/himass/appeals';
let server;
let baseUrl;
let TestAppeal;
let deadlineMs;
let nowMs;

before(async () => {
  await connectDatabase();
  TestAppeal = mongoose.model('AppealApiTest', Appeal.schema, 'appeals_api_test');
  await TestAppeal.init();
  const seeded = await Dossier.findOne({ playerID: 'himass' }).lean();
  assert.ok(seeded, 'Run npm run seed before npm test');
  deadlineMs = seeded.deadlineAt.getTime();
  nowMs = deadlineMs - 60_000;
  server = createApp({ frontendOrigin: origin, appealModel: TestAppeal, now: () => nowMs }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
});

async function request(path, options) {
  const response = await fetch(baseUrl + path, options);
  return { status: response.status, headers: response.headers, body: response.status === 204 ? null : await response.json() };
}

function post(path, body) {
  return request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

function draft(changes = {}) {
  return { ground: 'PROCEDURAL_ERROR', statement: 'This illustrative appeal has enough information.', operationId: randomUUID(), ...changes };
}

test('reads the seeded dossiers and returns their UTC deadlines and the server clock', async () => {
  const list = await request('/api/dossiers');
  assert.equal(list.status, 200);
  assert.deepEqual(list.body, { dossiers: [
    { playerID: 'himass', displayName: 'Himass' }, { playerID: 'tanvuu', displayName: 'TanVuu' },
  ] });
  for (const playerID of ['himass', 'tanvuu']) {
    const detail = await request(`/api/dossiers/${playerID}`);
    const stored = await Dossier.findOne({ playerID }).lean();
    assert.equal(detail.status, 200);
    assert.equal(detail.body.dossier.playerID, playerID);
    assert.match(detail.body.dossier.summary, /classroom/);
    assert.equal(detail.body.dossier.reference, stored.reference);
    assert.equal(detail.body.dossier.topic, stored.topic);
    assert.equal(detail.body.dossier.deadlineAt, stored.deadlineAt.toISOString());
    assert.equal(detail.body.serverNow, new Date(nowMs).toISOString());
    assert.equal(detail.headers.get('cache-control'), 'no-store');
  }
  for (const playerID of ['unknown', '__proto__', 'HIMASS']) {
    const missing = await request(`/api/dossiers/${playerID}`);
    assert.equal(missing.status, 404);
    assert.equal(missing.body.error.code, 'DOSSIER_NOT_FOUND');
    assert.equal((await post(`/api/dossiers/${playerID}/appeals`, draft())).status, 404);
  }
  const malformedPath = await request('/api/dossiers/%ZZ');
  assert.equal(malformedPath.status, 400);
  assert.equal(malformedPath.body.error.code, 'INVALID_PATH');
});

test('limits CORS to one configured origin', async () => {
  const accepted = await request('/api/dossiers', { headers: { Origin: origin } });
  assert.equal(accepted.headers.get('access-control-allow-origin'), origin);
  const preflight = await request(appealsPath, { method: 'OPTIONS', headers: {
    Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type',
  } });
  assert.equal(preflight.status, 204);
  assert.match(preflight.headers.get('access-control-allow-methods'), /POST/);
  const blocked = await request('/api/dossiers', { headers: { Origin: 'http://localhost:5173' } });
  assert.equal(blocked.status, 403);
  assert.equal(blocked.headers.get('access-control-allow-origin'), null);
});

test('validates required fields, strict payload shape and cross-field evidence at the server', async () => {
  const valid = draft();
  const invalidInputs = [null, [], { ...valid, playerID: 'tanvuu' }, { ...valid, operationId: 'bad' },
    { ...valid, ground: 'OTHER' }, { ...valid, statement: '  ' }, { ...valid, statement: 'x'.repeat(2001) },
    { ...valid, evidenceUrl: null }, { ...valid, evidenceUrl: 'https:example.com' }, { ...valid, ground: 'NEW_EVIDENCE' }];
  for (const body of invalidInputs) assert.equal((await post(appealsPath, body)).status, 400);
  const errors = await post(appealsPath, { ...valid, ground: 'NEW_EVIDENCE', statement: 'Too short' });
  assert.equal(errors.body.error.code, 'INVALID_PAYLOAD');
  assert.deepEqual(Object.keys(errors.body.error.fields).sort(), ['evidenceUrl', 'statement']);
  const malformed = await request(appealsPath, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' });
  assert.equal(malformed.status, 400);
  assert.equal(malformed.body.error.code, 'INVALID_JSON');
  assert.equal((await post(appealsPath, { ...valid, statement: 'x'.repeat(17 * 1024) })).status, 413);
  assert.equal(await TestAppeal.countDocuments({ operationId: valid.operationId }), 0);
});

test('stores one normalized appeal for concurrent retries and returns its receipt after expiration', async () => {
  nowMs = deadlineMs - 1;
  const valid = draft({ ground: 'NEW_EVIDENCE', evidenceUrl: ' https://example.com/evidence ', statement: '  A sufficiently detailed classroom example.  ' });
  const replies = await Promise.all([post(appealsPath, valid), post(appealsPath, valid)]);
  assert.deepEqual(replies.map(({ status }) => status).sort(), [200, 201]);
  assert.deepEqual(replies[0].body, replies[1].body);
  assert.deepEqual(replies[0].body, { id: replies[0].body.id, playerID: 'himass', submittedAt: new Date(nowMs).toISOString() });
  const stored = await TestAppeal.findOne({ operationId: valid.operationId }).lean();
  assert.equal(String(stored._id), replies[0].body.id);
  assert.equal(stored.statement, valid.statement.trim());
  assert.equal(stored.evidenceUrl, valid.evidenceUrl.trim());
  assert.equal(await TestAppeal.countDocuments({ operationId: valid.operationId }), 1);

  nowMs = deadlineMs;
  const replay = await post(appealsPath, valid);
  assert.equal(replay.status, 200);
  assert.deepEqual(replay.body, replies[0].body);
  const reused = await post(appealsPath, { ...valid, statement: 'A different valid statement for the same request.' });
  assert.equal(reused.status, 409);
  assert.equal(reused.body.error.code, 'OPERATION_ID_REUSED');
});

test('rejects new appeals at and after the deadline without writing a record', async () => {
  const payload = draft();
  for (const time of [deadlineMs, deadlineMs + 1]) {
    nowMs = time;
    const response = await post(appealsPath, payload);
    assert.equal(response.status, 409);
    assert.equal(response.body.error.code, 'APPEAL_DEADLINE_EXPIRED');
  }
  assert.equal(await TestAppeal.countDocuments({ operationId: payload.operationId }), 0);
});
