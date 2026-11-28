import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { JSDOM } from 'jsdom';
import { act, createElement } from 'react';
import { MemoryRouter } from 'react-router';
import { createServer } from 'vite';

let vite;
let dom;
let createRoot;
let Portal;
const players = { himass: 'Himass', tanvuu: 'TanVuu' };

before(async () => {
  dom = new JSDOM();
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  ({ createRoot } = await import('react-dom/client'));
  vite = await createServer({ optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true, ws: false } });
  ({ default: Portal } = await vite.ssrLoadModule('/src/FairPlayAppealPortal.jsx'));
});

after(async () => {
  await vite?.close();
  dom?.window.close();
  for (const name of ['window', 'document', 'HTMLElement', 'IS_REACT_ACT_ENVIRONMENT']) delete globalThis[name];
});

const mockCase = (playerID, now = Date.now(), deadline = now + 60_000) => ({
  dossier: {
    playerID, displayName: players[playerID], reference: 'TEST-' + playerID, topic: 'Workflow',
    summary: 'Illustrative classroom API case.', deadlineAt: new Date(deadline).toISOString(),
  },
  serverNow: new Date(now).toISOString(),
});

async function mount(t, path, override) {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const pathname = new URL(url).pathname;
    const call = { pathname, ...options };
    calls.push(call);
    const response = override?.(call);
    if (response) return response;
    if (pathname === '/api/dossiers') {
      return Response.json({ dossiers: Object.entries(players).map(([playerID, displayName]) => ({ playerID, displayName })) });
    }
    const playerID = pathname.split('/').at(-1);
    if (Object.hasOwn(players, playerID)) return Response.json(mockCase(playerID));
    return Response.json({ error: { message: 'Dossier not found.' } }, { status: 404 });
  });
  const container = document.body.appendChild(document.createElement('div'));
  const root = createRoot(container);
  let mounted = true;
  async function unmount() {
    if (!mounted) return;
    mounted = false;
    await act(() => root.unmount());
    container.remove();
  }
  t.after(unmount);
  await act(() => root.render(createElement(MemoryRouter, { initialEntries: [path] }, createElement(Portal))));
  return { container, calls, unmount };
}

const click = (container, selector) => act(() => { container.querySelector(selector).click(); });
const title = (container) => container.querySelector('main h1')?.textContent;
const submit = (container) => {
  container.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
};

async function fill(container) {
  await act(() => {
    const select = container.querySelector('select');
    select.value = 'PROCEDURAL_ERROR';
    select.dispatchEvent(new window.Event('change', { bubbles: true }));
    const textarea = container.querySelector('textarea');
    Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set.call(textarea, 'A sufficiently detailed classroom appeal.');
    textarea.dispatchEvent(new window.Event('input', { bubbles: true }));
  });
}

test('the shared layout uses the API dossier index and marks the overview current', async (t) => {
  const { container, calls } = await mount(t, '/');
  assert.equal(title(container), 'Case study dossiers');
  assert.equal(container.querySelector('nav [aria-current=page]').textContent, 'Overview');
  assert.deepEqual([...container.querySelectorAll('.dossier-index a')].map((link) => link.getAttribute('href')), ['/dossier/himass', '/dossier/tanvuu']);
  assert.ok(calls.some(({ pathname }) => pathname === '/api/dossiers'));
});

for (const [playerID, name] of Object.entries(players)) {
  test(`a direct ${name} route reads the matching API dossier and marks navigation current`, async (t) => {
    const { container, calls } = await mount(t, `/dossier/${playerID}`);
    assert.equal(title(container), `${name} dossier`);
    assert.equal(container.querySelector('.dossier-details dd').textContent, playerID);
    assert.ok(container.textContent.includes('TEST-' + playerID));
    assert.ok(container.textContent.includes('Illustrative case study'));
    assert.deepEqual([...container.querySelectorAll('nav [aria-current=page]')].map((link) => link.textContent), [name]);
    assert.ok(calls.some(({ pathname }) => pathname === `/api/dossiers/${playerID}`));
  });
}

for (const path of ['/dossier/unknown/appeal', '/dossier/__proto__', '/dossier/HIMASS', '/dossier/himass/other']) {
  test(`${path} shows a 404 without marking a dossier current`, async (t) => {
    const { container } = await mount(t, path);
    assert.equal(title(container), '404 · Dossier not found');
    assert.equal(container.querySelector('main a').getAttribute('href'), '/');
    assert.equal(container.querySelector('nav [aria-current=page]'), null);
  });
}

test('a rapid route change aborts the first dossier read and ignores its late result', async (t) => {
  let finishHimass;
  const { container, calls } = await mount(t, '/dossier/himass', ({ pathname }) => {
    if (pathname === '/api/dossiers/himass') return new Promise((resolve) => { finishHimass = resolve; });
  });
  assert.match(container.querySelector('main').textContent, /Loading dossier/);
  const old = calls.find(({ pathname }) => pathname === '/api/dossiers/himass');
  await click(container, 'nav a[href="/dossier/tanvuu"]');
  assert.equal(old.signal.aborted, true);
  assert.equal(title(container), 'TanVuu dossier');
  await act(() => { finishHimass(Response.json(mockCase('himass'))); });
  assert.equal(title(container), 'TanVuu dossier');
});

test('a failed dossier read offers a retry without losing route identity', async (t) => {
  let firstRead = true;
  const { container, calls } = await mount(t, '/dossier/himass', ({ pathname }) => {
    if (pathname === '/api/dossiers/himass' && firstRead) {
      firstRead = false;
      return Promise.reject(new TypeError('Connection ended'));
    }
  });
  assert.equal(title(container), 'Dossier unavailable');
  assert.equal(container.querySelector('[role=alert]').textContent, 'The dossier could not be loaded.');
  container.querySelector('main button').focus();
  await click(container, 'main button');
  assert.equal(title(container), 'Himass dossier');
  assert.ok(document.activeElement === container.querySelector('main'), 'Retry should keep focus in the dossier content');
  assert.equal(calls.filter(({ pathname }) => pathname === '/api/dossiers/himass').length, 2);
});

test('unmount aborts a dossier read that is still pending', async (t) => {
  let finish;
  const { container, calls, unmount } = await mount(t, '/dossier/himass', ({ pathname }) => {
    if (pathname === '/api/dossiers/himass') return new Promise((resolve) => { finish = resolve; });
  });
  const read = calls.find(({ pathname }) => pathname === '/api/dossiers/himass');
  assert.equal(read.signal.aborted, false);
  await unmount();
  assert.equal(read.signal.aborted, true);
  await act(() => { finish(Response.json(mockCase('himass'))); });
  assert.equal(container.textContent, '');
});

test('a direct appeal renders accessible fields and validates before sending only one request', async (t) => {
  let finishSubmission;
  const { container, calls } = await mount(t, '/dossier/tanvuu/appeal', ({ method }) => {
    if (method === 'POST') return new Promise((resolve) => { finishSubmission = resolve; });
  });
  assert.equal(title(container), 'TanVuu appeal');
  assert.equal(container.querySelector('[aria-labelledby="appeal-title"] h1').id, 'appeal-title');
  for (const control of container.querySelectorAll('input, textarea, select')) assert.equal(control.labels.length, 1);
  assert.equal(container.querySelector('pre'), null);
  await act(() => submit(container));
  assert.equal(calls.filter(({ method }) => method === 'POST').length, 0);
  assert.equal(document.activeElement.name, 'ground');
  await fill(container);
  assert.ok(container.querySelector('pre').textContent.includes('A sufficiently detailed classroom appeal.'));
  await act(() => { submit(container); submit(container); });
  assert.equal(calls.filter(({ method }) => method === 'POST').length, 1);
  await act(() => { finishSubmission(Response.json({ id: 'test-receipt', playerID: 'tanvuu', submittedAt: new Date().toISOString() }, { status: 201 })); });
  assert.match(container.querySelector('.appeal-status').textContent, /test-receipt/);
});

test('an uncertain save preserves the draft and retries the same operation ID', async (t) => {
  let attempts = 0;
  const { container, calls } = await mount(t, '/dossier/himass/appeal', ({ method }) => {
    if (method !== 'POST') return;
    if (++attempts === 1) return Promise.reject(new TypeError('Connection ended'));
    return Response.json({ id: 'recovered', playerID: 'himass', submittedAt: new Date().toISOString() });
  });
  await fill(container);
  await act(() => submit(container));
  assert.match(container.querySelector('[role=alert]').textContent, /Retry/);
  assert.ok(container.querySelector('textarea').value.includes('classroom appeal'));
  await act(() => submit(container));
  const writes = calls.filter(({ method }) => method === 'POST');
  assert.equal(writes.length, 2);
  assert.equal(writes[0].body, writes[1].body);
  assert.match(container.querySelector('.appeal-status').textContent, /recovered/);
});

test('the timer uses server time and blocks a new appeal at the backend deadline', async (t) => {
  const serverTime = Date.parse('2030-01-01T00:00:00.000Z');
  const { container, calls } = await mount(t, '/dossier/himass/appeal', ({ pathname }) => {
    if (pathname === '/api/dossiers/himass') return Response.json(mockCase('himass', serverTime, serverTime));
  });
  await fill(container);
  assert.match(container.querySelector('.appeal-sla').textContent, /Appeal window closed/);
  assert.equal(container.querySelector('button[type=submit]').disabled, true);
  await act(() => submit(container));
  assert.equal(calls.filter(({ method }) => method === 'POST').length, 0);
});
