import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';

let vite;
let validateAppeal;
let normalizeAppeal;

before(async () => {
  vite = await createServer({ optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true, ws: false } });
  ({ validateAppeal, normalizeAppeal } = await vite.ssrLoadModule('/src/form/validateAppeal.ts'));
});

after(() => vite?.close());

const valid = Object.freeze({ ground: 'PROCEDURAL_ERROR', statement: 'The draft includes enough detail.', evidenceUrl: '' });

test('rejects missing required fields and an unknown ground', () => {
  const errors = validateAppeal({ ground: '', statement: '  ', evidenceUrl: '' });
  assert.equal(Object.keys(errors).length, 2);
  assert.match(errors.ground, /Choose an appeal ground/);
  assert.match(errors.statement, /Enter a statement/);
  assert.match(validateAppeal({ ...valid, ground: 'UNKNOWN' }).ground, /Choose an appeal ground/);
});

test('enforces the trimmed statement bounds and accepts both exact boundaries', () => {
  for (const length of [20, 2000]) {
    assert.deepEqual(validateAppeal({ ...valid, statement: ` ${'x'.repeat(length)} ` }), {});
  }
  for (const length of [19, 2001]) {
    assert.match(validateAppeal({ ...valid, statement: 'x'.repeat(length) }).statement, /20–2,000 characters/);
  }
});

test('requires evidence for new evidence and validates optional links for any ground', () => {
  assert.deepEqual(validateAppeal(valid), {});
  assert.match(validateAppeal({ ...valid, ground: 'NEW_EVIDENCE', evidenceUrl: '  ' }).evidenceUrl, /required for New evidence/);
  for (const url of ['//example.com/evidence', 'https:example.com', 'javascript:alert(1)', 'https://']) {
    assert.match(validateAppeal({ ...valid, evidenceUrl: url }).evidenceUrl, /HTTP or HTTPS/);
  }
  assert.deepEqual(validateAppeal({ ...valid, ground: 'NEW_EVIDENCE', evidenceUrl: ' https://example.com/evidence ' }), {});
  assert.deepEqual(validateAppeal({ ...valid, evidenceUrl: 'http://example.com/evidence' }), {});
});

test('normalizes values for the live inspector without changing the draft', () => {
  const draft = Object.freeze({ ...valid, statement: ` ${valid.statement} `, evidenceUrl: ' https://example.com/evidence ' });
  assert.deepEqual(normalizeAppeal(draft), { ...valid, evidenceUrl: 'https://example.com/evidence' });
  assert.deepEqual(normalizeAppeal({ ...valid, evidenceUrl: '  ' }), { ground: valid.ground, statement: valid.statement });
  assert.equal(draft.statement, ` ${valid.statement} `);
});
