import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

let vite;
let SwipeDeck;

before(async () => {
  vite = await createServer({
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, ws: false },
  });
});

after(() => vite?.close());

async function renderDeck(props) {
  SwipeDeck ??= (await vite.ssrLoadModule('/src/SwipeDeck.jsx')).default;
  return renderToStaticMarkup(createElement(SwipeDeck, props));
}

const profiles = [
  { id: 'mai', name: 'Mai', age: 24, bio: 'Thích cà phê.', imageUrl: '/mai.webp' },
  { id: 'vy', name: 'Vy', age: 23, bio: 'Thích đi bộ.', imageUrl: '/vy.webp' },
];

test('renders the active profile, upcoming queue, and deck totals', async () => {
  const html = await renderDeck({ profiles, score: 10 });

  assert.match(html, /<article\b[^>]*>[\s\S]*?<img\b[^>]*src="\/mai\.webp"[^>]*alt="Ảnh chân dung Mai"/);
  assert.match(html, /<h3>Mai <span[^>]*>24 tuổi<\/span><\/h3>/);
  assert.match(html, /Thích cà phê\./);
  assert.doesNotMatch(html, /Thích đi bộ\./);
  assert.match(html, /<ol\b[^>]*>[\s\S]*?<li\b[^>]*>[\s\S]*?Vy[\s\S]*?<\/ol>/);
  assert.match(html, /<dt>Điểm số<\/dt><dd>10<\/dd>/);
  assert.match(html, /<dt>Thẻ còn lại<\/dt><dd>2<\/dd>/);
});

test('exposes four named controls and marks unavailable actions', async () => {
  const html = await renderDeck({ profiles, score: 0 });
  const buttons = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)];

  const labels = buttons.map(([, , contents]) => contents.replace(/<span aria-hidden="true">[^<]*<\/span>/g, '').trim());
  assert.deepEqual(labels, [
    'Dislike', 'Swipe Up', 'Like', 'Undo',
  ]);
  assert.ok(buttons.every(([, attributes]) => attributes.includes('aria-disabled="true"')));

  const readyHtml = await renderDeck({ profiles, score: 0, onSwipe() {}, onUndo() {} });
  assert.doesNotMatch(readyHtml, /aria-disabled="true"/);
});

test('renders explicit loading, error, and exhausted states', async () => {
  const loading = await renderDeck({ profiles: [], score: 0, status: 'loading' });
  const failed = await renderDeck({ profiles: [], score: 0, status: 'error' });
  const exhausted = await renderDeck({ profiles: [], score: 0 });

  assert.match(loading, /Đang tải hồ sơ/);
  assert.match(failed, /role="alert"[^>]*>Không tải được hồ sơ/);
  assert.match(exhausted, /Bạn đã xem hết hồ sơ/);
  assert.match(exhausted, /<dt>Thẻ còn lại<\/dt><dd>0<\/dd>/);
  assert.doesNotMatch(exhausted, /<article\b/);
});
