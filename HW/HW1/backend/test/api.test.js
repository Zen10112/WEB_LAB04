import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import mongoose from 'mongoose';
import { createApp } from '../src/app.js';
import { connectDatabase } from '../src/database.js';

const origin = 'http://localhost:5173';
const deckId = `test-${randomUUID()}`;
let server;
let baseUrl;
let profiles;

before(async () => {
  await connectDatabase();
  server = createApp({ frontendOrigin: origin, deckId }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server?.listening) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
});

async function request(path, options) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const payload = response.status === 204 ? null : await response.json();
  return { status: response.status, headers: response.headers, payload };
}

function post(path, body) {
  return request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

test('returns ordered seeded profiles and limits CORS to the configured origin', async () => {
  const response = await request('/api/profiles', { headers: { Origin: origin } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), origin);
  profiles = response.payload;
  assert.ok(profiles.length >= 3, 'Run npm run seed before npm test');
  for (const profile of profiles) {
    assert.deepEqual(Object.keys(profile), ['id', 'name', 'age', 'bio', 'imageUrl']);
    assert.match(profile.id, /^[0-9a-f]{24}$/);
  }
  assert.deepEqual((await request('/api/profiles')).payload, profiles);
  const preflight = await request('/api/swipe', {
    method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' },
  });
  assert.equal(preflight.status, 204);
  assert.match(preflight.headers.get('access-control-allow-methods'), /POST/);
  const blocked = await request('/api/profiles', { headers: { Origin: 'http://localhost:8000' } });
  assert.equal(blocked.status, 403);
  assert.equal(blocked.headers.get('access-control-allow-origin'), null);
});

test('rejects malformed JSON, object IDs, action kinds, revisions, operation IDs, and extra fields', async () => {
  const valid = { profileId: 'a'.repeat(24), kind: 'LIKE', expectedRevision: 0, operationId: randomUUID() };
  for (const invalid of [null, [], { ...valid, profileId: 'bad' }, { ...valid, kind: 'right' },
    { ...valid, expectedRevision: -1 }, { ...valid, operationId: 'bad' }, { ...valid, extra: true }]) {
    assert.equal((await post('/api/swipe', invalid)).status, 400);
  }
  const malformed = await request('/api/swipe', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad',
  });
  assert.equal(malformed.status, 400);
  assert.equal(malformed.payload.error.code, 'INVALID_JSON');
  assert.equal((await post('/api/swipe', { ...valid, extra: 'x'.repeat(17 * 1024) })).status, 413);
  const unsupported = await request('/api/swipe', {
    method: 'POST', headers: { 'Content-Type': 'application/json; charset=iso-8859-1' }, body: JSON.stringify(valid),
  });
  assert.equal(unsupported.status, 415);
  const unknown = new mongoose.Types.ObjectId().toString();
  assert.equal((await post('/api/swipe', { ...valid, profileId: unknown })).status, 404);
  assert.equal((await post('/api/swipe/bad/undo', { expectedRevision: 0, operationId: randomUUID() })).status, 400);
  assert.equal((await post(`/api/swipe/${unknown}/undo`, { expectedRevision: 0, operationId: randomUUID() })).status, 404);
});

test('persists LIFO history, deduplicates concurrent retries, and rejects stale or out-of-order writes', async () => {
  const snapshot = async () => (await request('/api/swipes')).payload;
  assert.deepEqual(await snapshot(), { revision: 0, history: [] });
  const first = { profileId: profiles[0].id, kind: 'LIKE', expectedRevision: 0, operationId: randomUUID() };
  assert.equal((await post('/api/swipe', { ...first, profileId: profiles[1].id })).status, 409);

  const retries = await Promise.all([post('/api/swipe', first), post('/api/swipe', first)]);
  assert.deepEqual(retries.map(({ status }) => status).sort(), [200, 201]);
  const firstRecord = { id: retries[0].payload.history[0].id, profileId: first.profileId, kind: 'LIKE' };
  assert.deepEqual(await snapshot(), { revision: 1, history: [firstRecord] });
  assert.equal((await post('/api/swipe', { ...first, kind: 'PASS' })).status, 409);

  const second = { profileId: profiles[1].id, kind: 'PASS', expectedRevision: 1, operationId: randomUUID() };
  assert.equal((await post('/api/swipe', { ...second, expectedRevision: 0 })).status, 409);
  const competitors = await Promise.all([post('/api/swipe', second), post('/api/swipe', { ...second, operationId: randomUUID() })]);
  assert.deepEqual(competitors.map(({ status }) => status).sort(), [201, 409]);
  const persisted = await snapshot();
  assert.equal(persisted.revision, 2);
  assert.deepEqual(persisted.history.map(({ profileId }) => profileId), [first.profileId, second.profileId]);
  assert.deepEqual((await post('/api/swipe', first)).payload, persisted);

  const undo = { expectedRevision: 2, operationId: randomUUID() };
  assert.equal((await post(`/api/swipe/${firstRecord.id}/undo`, undo)).status, 409);
  const latestPath = `/api/swipe/${persisted.history.at(-1).id}/undo`;
  const undone = await post(latestPath, undo);
  assert.equal(undone.status, 200);
  assert.deepEqual(undone.payload, { revision: 3, history: [firstRecord] });
  assert.deepEqual((await post(latestPath, undo)).payload, undone.payload);
  assert.equal((await post(`/api/swipe/${firstRecord.id}/undo`, { ...undo, expectedRevision: 3 })).status, 409);
  await post(`/api/swipe/${firstRecord.id}/undo`, { expectedRevision: 3, operationId: randomUUID() });
  assert.deepEqual(await snapshot(), { revision: 4, history: [] });
  const stored = await mongoose.connection.db.collection('swipes').findOne({ _id: deckId });
  assert.equal(stored.records.length, 2);
  assert.ok(stored.records.every(({ undoOperationId }) => undoOperationId));
});
