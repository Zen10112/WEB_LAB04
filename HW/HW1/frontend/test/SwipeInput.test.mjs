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
