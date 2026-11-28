import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { JSDOM } from 'jsdom';
import { act, createElement } from 'react';
import { createServer } from 'vite';

let vite;
let dom;
let createRoot;
let deckModule;

before(async () => {
  dom = new JSDOM();
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.Element = dom.window.Element;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  ({ createRoot } = await import('react-dom/client'));
  vite = await createServer({ optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true, ws: false } });
  deckModule = await vite.ssrLoadModule('/src/SwipeDeck.jsx');
});

after(async () => {
  await vite?.close();
  dom?.window.close();
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.Element;
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

const profiles = ['Mai', 'Vy', 'An'].map((name) => ({ id: name, name, age: 24, bio: 'Hồ sơ mẫu.', imageUrl: '/profile.webp' }));

function mockDeckApi(t, { initial = { revision: 0, history: [] }, onRead, onMutation } = {}) {
  let snapshot = initial;
  const calls = [];
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });

  globalThis.fetch = async (url, { body, method = 'GET', signal }) => {
    const { pathname } = new URL(url);
    const request = { pathname, method, body: body && JSON.parse(body), signal };
    calls.push(request);
    if (method === 'GET') {
      const data = pathname === '/api/profiles' ? profiles : snapshot;
      return onRead ? onRead(request, data) : Response.json(data);
    }

    const commit = (changes = {}) => {
      const { expectedRevision, operationId, profileId, kind } = { ...request.body, ...changes };
      assert.equal(expectedRevision, snapshot.revision);
      assert.match(operationId, /^[0-9a-f-]{36}$/);
      if (pathname === '/api/swipe') {
        snapshot = { revision: snapshot.revision + 1, history: [...snapshot.history, { id: operationId, profileId, kind }] };
      } else {
        assert.equal(pathname, `/api/swipe/${snapshot.history.at(-1).id}/undo`);
        snapshot = { revision: snapshot.revision + 1, history: snapshot.history.slice(0, -1) };
      }
      return Response.json(snapshot, { status: pathname === '/api/swipe' ? 201 : 200 });
    };
    return onMutation ? onMutation(request, commit, snapshot) : commit();
  };

  return calls;
}

async function mount(t, Component, props) {
  document.body.innerHTML = '<input aria-label="Outside editor"><div id="root"></div>';
  const root = createRoot(document.getElementById('root'));
  t.after(async () => act(() => root.unmount()));
  await act(() => root.render(createElement(Component, { profiles, score: 0, ...props })));
  return document.querySelector('.deck-stage');
}

async function press(target, key, options = {}) {
  const event = new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...options });
  await act(() => { target.dispatchEvent(event); });
  return event.defaultPrevented;
}

async function pointer(target, type, options = {}) {
  const event = new window.PointerEvent(type, {
    bubbles: true, pointerId: 1, isPrimary: true, button: 0, clientX: 100, ...options,
  });
  await act(() => { target.dispatchEvent(event); });
}

test('keyboard shortcuts are scoped to the focusable deck and share intents with the buttons', async (t) => {
  const actions = [];
  const deck = await mount(t, deckModule.default, {
    onSwipe: (direction) => actions.push(direction), onUndo: () => actions.push('undo'),
  });
  deck.focus();
  assert.ok(document.activeElement === deck, 'The deck must accept focus');

  for (const key of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Backspace']) {
    assert.equal(await press(deck, key), true);
  }
  await press(deck, 'ArrowRight', { repeat: true });
  assert.equal(await press(deck, 'ArrowLeft', { ctrlKey: true }), false);
  assert.equal(await press(deck, 'ArrowUp', { isComposing: true }), false);
  assert.equal(await press(deck, 'ArrowDown'), false);

  const input = document.querySelector('input');
  input.focus();
  assert.equal(await press(input, 'Backspace'), false);
  const editor = document.createElement('div');
  editor.setAttribute('contenteditable', 'true');
  const editorText = editor.appendChild(document.createElement('span'));
  deck.append(editor);
  assert.equal(await press(editorText, 'ArrowLeft'), false);

  for (const selector of ['.swipe-left', '.swipe-right', '.swipe-up', '.swipe-undo']) {
    await act(() => { document.querySelector(selector).click(); });
  }
  assert.deepEqual(actions, ['left', 'right', 'up', 'undo', 'left', 'right', 'up', 'undo']);
});

test('pointer gestures need a matching primary pointer and more than 50 horizontal pixels', async (t) => {
  const actions = [];
  await mount(t, deckModule.default, { onSwipe: (direction) => actions.push(direction) });
  const card = document.querySelector('.profile-card');

  await pointer(card, 'pointerup', { clientX: 200 });
  for (const endX of [100, 149, 150, 50]) {
    await pointer(card, 'pointerdown');
    await pointer(card, 'pointerup', { clientX: endX, clientY: 150 });
  }
  await pointer(card, 'pointerdown', { button: 2 });
  await pointer(card, 'pointerup', { clientX: 200 });
  await pointer(card, 'pointerdown', { isPrimary: false });
  await pointer(card, 'pointerup', { clientX: 200 });

  for (const cancellation of ['pointercancel', 'lostpointercapture']) {
    await pointer(card, 'pointerdown');
    await pointer(card, cancellation);
    await pointer(card, 'pointerup', { clientX: 200 });
  }
  assert.deepEqual(actions, []);

  await pointer(card, 'pointerdown');
  await pointer(card, 'pointerdown', { pointerId: 2, clientX: 200 });
  await pointer(card, 'pointerup', { pointerId: 2, clientX: 400 });
  assert.deepEqual(actions, []);
  await pointer(card, 'pointerup', { clientX: 151 });
  await pointer(card, 'pointerup', { clientX: 200 });
  await pointer(card, 'pointerdown');
  await pointer(card, 'pointerup', { clientX: 49 });
  assert.deepEqual(actions, ['right', 'left']);
});

test('keyboard, pointer and buttons advance the same queue and undo restores cards in order', async (t) => {
  mockDeckApi(t);
  const deck = await mount(t, deckModule.SwipeDeckSession);
  const current = () => document.querySelector('.profile-card h3')?.firstChild.textContent.trim();
  const undo = document.querySelector('.swipe-undo');
  const like = document.querySelector('.swipe-right');

  assert.equal(current(), 'Mai');
  assert.equal(undo.getAttribute('aria-disabled'), 'true');
  assert.equal(await press(deck, 'Backspace'), false);
  await press(deck, 'ArrowUp');
  assert.equal(current(), 'Vy');
  // A key can advance the queue while a pointer is still held on the current card.
  const previousCard = document.querySelector('.profile-card');
  await pointer(previousCard, 'pointerdown');
  await act(() => { like.click(); });
  assert.equal(current(), 'An');
  await pointer(document.querySelector('.profile-card'), 'pointerup', { clientX: 200 });
  assert.equal(current(), 'An');

  const lastCard = document.querySelector('.profile-card');
  await pointer(lastCard, 'pointerdown');
  await pointer(lastCard, 'pointerup', { clientX: 160 });
  assert.match(deck.textContent, /Bạn đã xem hết hồ sơ/);
  assert.equal(like.getAttribute('aria-disabled'), 'true');
  assert.equal(undo.getAttribute('aria-disabled'), 'false');
  assert.equal(await press(deck, 'ArrowRight'), false);

  await press(deck, 'Backspace');
  assert.equal(current(), 'An');
  await act(() => { undo.click(); });
  assert.equal(current(), 'Vy');
  await press(deck, 'Backspace');
  assert.equal(current(), 'Mai');
  assert.equal(document.querySelectorAll('.deck-stats dd')[1].textContent, '3');
  assert.equal(undo.getAttribute('aria-disabled'), 'true');
});

test('score and queue follow the active stack through LIFO undo and a replacement swipe', async (t) => {
  mockDeckApi(t);
  const deck = await mount(t, deckModule.SwipeDeckSession);
  const assertDeck = (card, score, count) => {
    const title = deck.querySelector('.profile-card h3');
    const totals = [...document.querySelectorAll('.deck-stats dd')].map((value) => Number(value.textContent));
    assert.equal(title?.firstChild.textContent.trim() ?? null, card, 'current card');
    assert.deepEqual(totals, [score, count], 'score and remaining count');
  };

  assertDeck('Mai', 0, 3);
  const steps = [
    ['ArrowRight', 'Vy', 10, 2], // LIKE
    ['ArrowLeft', 'An', 5, 1], // PASS
    ['ArrowUp', null, 0, 0], // SKIP
    ['Backspace', 'An', 5, 1],
    ['Backspace', 'Vy', 10, 2],
    ['Backspace', 'Mai', 0, 3],
    ['Backspace', 'Mai', 0, 3], // Empty history
    ['ArrowUp', 'Vy', -5, 2], // A new action for the restored card
    ['ArrowLeft', 'An', -10, 1],
    ['Backspace', 'Vy', -5, 2],
    ['Backspace', 'Mai', 0, 3],
  ];

  for (const [key, card, score, count] of steps) {
    await press(deck, key);
    assertDeck(card, score, count);
  }
});

test('multiple intents for the same rendered profile count as one history entry', async (t) => {
  const calls = mockDeckApi(t);
  const deck = await mount(t, deckModule.SwipeDeckSession);
  await act(() => {
    deck.querySelector('.swipe-right').click();
    deck.querySelector('.swipe-left').click();
  });

  const score = document.querySelector('.deck-stats dd');
  assert.equal(score.textContent, '10');
  assert.equal(calls.filter(({ method }) => method === 'POST').length, 1);
  assert.match(deck.querySelector('.profile-card h3').textContent, /^Vy\b/);

  await press(deck, 'Backspace');
  assert.equal(score.textContent, '0');
  assert.match(deck.querySelector('.profile-card h3').textContent, /^Mai\b/);
  assert.equal(deck.querySelector('.swipe-undo').getAttribute('aria-disabled'), 'true');
});

test('a fresh mount restores the server history, card and score', async (t) => {
  const calls = mockDeckApi(t, { initial: { revision: 5, history: [{ id: 'stored', profileId: 'Mai', kind: 'LIKE' }] } });
  const deck = await mount(t, deckModule.SwipeDeckSession);
  assert.deepEqual(calls.map(({ pathname }) => pathname).sort(), ['/api/profiles', '/api/swipes']);
  assert.match(deck.querySelector('.profile-card h3').textContent, /^Vy\b/);
  assert.equal(document.querySelector('.deck-stats dd').textContent, '10');
  await press(deck, 'Backspace');
  assert.equal(calls.at(-1).pathname, '/api/swipe/stored/undo');
  assert.equal(calls.at(-1).body.expectedRevision, 5);
});

test('a failed initial read can be retried after the API returns', async (t) => {
  let failed = false;
  mockDeckApi(t, {
    onRead({ pathname }, data) {
      if (!failed && pathname === '/api/profiles') {
        failed = true;
        throw new TypeError('Failed to fetch');
      }
      return Response.json(data);
    },
  });
  const deck = await mount(t, deckModule.SwipeDeckSession);
  assert.match(deck.querySelector('[role="alert"]').textContent, /Không tải được hồ sơ/);
  assert.equal(deck.querySelector('.profile-card'), null);
  const retry = deck.querySelector('.deck-retry');
  retry.focus();
  await act(() => { retry.click(); });
  assert.equal(deck.querySelector('[role="alert"]'), null);
  assert.match(deck.querySelector('.profile-card h3').textContent, /^Mai\b/);
  assert.ok(document.activeElement === deck, 'Retry returns keyboard focus to the deck');
});

test('a lost write response keeps the confirmed deck and retries with the same operation ID', async (t) => {
  let firstPayload;
  let resolveWrite;
  const calls = mockDeckApi(t, {
    async onMutation(request, commit, snapshot) {
      if (!firstPayload) {
        firstPayload = request.body;
        await new Promise((resolve) => { resolveWrite = resolve; });
        commit();
        throw new TypeError('Connection lost after commit');
      }
      assert.deepEqual(request.body, firstPayload);
      return Response.json(snapshot);
    },
  });
  const deck = await mount(t, deckModule.SwipeDeckSession);
  await press(deck, 'ArrowRight');
  await press(deck, 'ArrowLeft');
  assert.equal(calls.filter(({ method }) => method === 'POST').length, 1);
  assert.match(deck.querySelector('.profile-card h3').textContent, /^Mai\b/);
  await act(() => { resolveWrite(); });
  assert.ok(deck.querySelector('[role="alert"]'));
  assert.match(deck.querySelector('.profile-card h3').textContent, /^Mai\b/);
  assert.equal(document.querySelector('.deck-stats dd').textContent, '0');
  await press(deck, 'ArrowUp');
  assert.equal(calls.filter(({ method }) => method === 'POST').length, 1);

  await act(() => { deck.querySelector('.deck-retry').click(); });
  assert.equal(calls.filter(({ method }) => method === 'POST').length, 2);
  assert.match(deck.querySelector('.profile-card h3').textContent, /^Vy\b/);
  assert.equal(document.querySelector('.deck-stats dd').textContent, '10');
});

test('a revision conflict refreshes the server snapshot without repeating the rejected intent', async (t) => {
  const calls = mockDeckApi(t, {
    onMutation(_request, commit) {
      commit({ kind: 'LIKE' }); // A competing client sent a different action at the old revision.
      return Response.json({ error: { code: 'STALE_REVISION' } }, { status: 409 });
    },
  });
  const deck = await mount(t, deckModule.SwipeDeckSession);
  await press(deck, 'ArrowUp');
  assert.equal(calls.filter(({ method }) => method === 'POST').length, 1);
  assert.equal(calls.filter(({ pathname }) => pathname === '/api/swipes').length, 2);
  assert.match(deck.querySelector('.profile-card h3').textContent, /^Vy\b/);
  assert.equal(document.querySelector('.deck-stats dd').textContent, '10');
  assert.equal(deck.querySelector('.swipe-right').getAttribute('aria-disabled'), 'false');
});

test('unmount aborts both initial reads and ignores a late response', async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => { globalThis.fetch = originalFetch; });
  const inFlight = [];
  globalThis.fetch = (_url, { signal }) => new Promise((resolve) => inFlight.push({ signal, resolve }));
  const mounted = document.body.appendChild(document.createElement('div'));
  const root = createRoot(mounted);
  try {
    await act(() => root.render(createElement(deckModule.SwipeDeckSession)));
    assert.equal(inFlight.length, 2);
  } finally {
    await act(() => root.unmount());
  }
  assert.ok(inFlight.every(({ signal }) => signal.aborted));
  await act(() => { inFlight.forEach(({ resolve }) => resolve(Response.json({}))); });
  assert.equal(mounted.textContent, '');
});
