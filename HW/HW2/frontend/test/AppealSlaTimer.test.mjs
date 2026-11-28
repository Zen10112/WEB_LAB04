import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { JSDOM } from 'jsdom';
import { act, createElement } from 'react';
import { createServer } from 'vite';

const start = Date.parse('2030-01-01T00:00:00.000Z');
let useAppealSlaTimer;
let createRoot;
let vite;
let dom;

before(async () => {
  dom = new JSDOM();
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  ({ createRoot } = await import('react-dom/client'));
  vite = await createServer({ optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true, ws: false } });
  ({ default: useAppealSlaTimer } = await vite.ssrLoadModule('/src/useAppealSlaTimer.js'));
});

after(async () => {
  await vite?.close();
  dom?.window.close();
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

async function mountTimer(t, deadlineAt, clockSample) {
  let now = start;
  let nextId = 0;
  let visibility = 'visible';
  let timer;
  const intervals = new Map();
  const listeners = new Set();
  t.mock.method(Date, 'now', () => now);
  t.mock.method(window, 'setInterval', (callback) => {
    intervals.set(++nextId, callback);
    return nextId;
  });
  t.mock.method(window, 'clearInterval', (id) => intervals.delete(id));
  const addListener = document.addEventListener.bind(document);
  const removeListener = document.removeEventListener.bind(document);
  t.mock.method(document, 'addEventListener', (type, listener, options) => {
    if (type === 'visibilitychange') listeners.add(listener);
    addListener(type, listener, options);
  });
  t.mock.method(document, 'removeEventListener', (type, listener, options) => {
    if (type === 'visibilitychange') listeners.delete(listener);
    removeListener(type, listener, options);
  });
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });

  function Probe(props) {
    timer = useAppealSlaTimer(props.deadlineAt, props.clockSample);
    return null;
  }
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

  const render = (deadlineAt, clockSample) => act(() => root.render(createElement(Probe, { deadlineAt, clockSample })));
  await render(deadlineAt, clockSample);
  return {
    get timer() { return timer; },
    intervals, listeners, render, unmount,
    setNow(value) { now = value; },
    tick: () => act(() => { for (const callback of [...intervals.values()]) callback(); }),
    setVisibility(value) {
      visibility = value;
      return act(() => { document.dispatchEvent(new window.Event('visibilitychange')); });
    },
  };
}

test('a valid absolute deadline uses the actual clock after a delayed callback', async (t) => {
  const probe = await mountTimer(t, new Date(start + 10_000).toISOString());
  assert.equal(probe.timer.remainingMs, 10_000);
  assert.equal(probe.timer.expired, false);
  probe.setNow(start + 7_500);
  await probe.tick();
  assert.equal(probe.timer.remainingMs, 2_500);
  probe.setNow(start + 10_000);
  assert.equal(probe.timer.isExpiredNow(), true);
  await probe.tick();
  assert.equal(probe.timer.remainingMs, 0);
  assert.equal(probe.timer.expired, true);
  assert.equal(probe.intervals.size, 0);
});

test('expired and invalid deadlines stay at zero', async (t) => {
  const probe = await mountTimer(t, start - 1);
  assert.equal(probe.timer.remainingMs, 0);
  assert.equal(probe.timer.expired, true);
  assert.equal(probe.intervals.size, 0);
  await probe.render('invalid');
  assert.equal(probe.timer.remainingMs, 0);
  assert.equal(probe.timer.expired, true);
});

test('deadline changes replace the interval and visibility listener and unmount removes both', async (t) => {
  const probe = await mountTimer(t, start + 5_000);
  const [originalInterval] = probe.intervals.keys();
  const [originalListener] = probe.listeners;
  probe.setNow(start + 2_000);
  await probe.render(start + 15_000);
  assert.equal(probe.timer.remainingMs, 13_000);
  assert.equal(probe.intervals.size, 1);
  assert.equal(probe.listeners.size, 1);
  assert.equal(probe.intervals.has(originalInterval), false);
  assert.equal(probe.listeners.has(originalListener), false);
  await probe.unmount();
  assert.equal(probe.intervals.size, 0);
  assert.equal(probe.listeners.size, 0);
});

test('recalculates on a visible document event without waiting for an interval callback', async (t) => {
  const probe = await mountTimer(t, start + 10_000);
  await probe.setVisibility('hidden');
  probe.setNow(start + 9_250);
  assert.equal(probe.timer.remainingMs, 10_000);
  await probe.setVisibility('visible');
  assert.equal(probe.timer.remainingMs, 750);
});

test('uses an API clock sample and recalculates when the sample changes', async (t) => {
  const apiSample = { serverNow: new Date(start + 3_000).toISOString(), clientReceivedAtMs: start };
  const probe = await mountTimer(t, start + 10_000, apiSample);
  assert.equal(probe.timer.remainingMs, 7_000);
  probe.setNow(start + 2_000);
  await probe.render(start + 10_000, { serverNow: new Date(start + 8_000).toISOString(), clientReceivedAtMs: start + 2_000 });
  assert.equal(probe.timer.remainingMs, 2_000);
  assert.equal(probe.intervals.size, 1);
});
