import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { createServer } from 'vite';

let vite;

before(async () => {
  vite = await createServer({
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true, ws: false },
  });
});

after(() => vite?.close());

async function renderRoute(path) {
  const { default: Portal } = await vite.ssrLoadModule('/src/FairPlayAppealPortal.jsx');
  return renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: [path] }, createElement(Portal)));
}

test('the shared layout links to both dossiers and marks the overview current', async () => {
  const html = await renderRoute('/');
  assert.match(html, /<nav\b[^>]*aria-label="Dossier navigation"/);
  assert.match(html, /<h1>Case study dossiers<\/h1>/);
  assert.match(html, /href="\/dossier\/himass"/);
  assert.match(html, /href="\/dossier\/tanvuu"/);
  assert.match(html, /<a\b[^>]*aria-current="page"[^>]*>Overview<\/a>/);
  assert.equal([...html.matchAll(/aria-current="page"/g)].length, 1);
});

for (const [playerID, name] of [['himass', 'Himass'], ['tanvuu', 'TanVuu']]) {
  test(`a direct ${name} route renders the matching case and active navigation`, async () => {
    const html = await renderRoute(`/dossier/${playerID}`);
    assert.ok(html.includes(`<h1 id="dossier-title">${name} dossier</h1>`));
    const definitionList = html.match(/<dl\b[^>]*>(.*?)<\/dl>/)?.[1];
    assert.ok(definitionList?.includes(`<dt>Player ID</dt><dd>${playerID}</dd>`));
    assert.match(definitionList, /<dt>Case reference<\/dt><dd>[^<]+<\/dd>/);
    assert.match(html, /Illustrative case study/);
    assert.match(html, new RegExp(`<a\\b[^>]*aria-current="page"[^>]*>${name}</a>`));
    assert.equal([...html.matchAll(/aria-current="page"/g)].length, 1);
  });
}

test('unknown player IDs and unmatched paths show a 404 with a recovery link', async () => {
  for (const path of ['/dossier/unknown', '/dossier/__proto__', '/dossier/HIMASS', '/dossier/himass/other', '/dossier', '/other']) {
    const html = await renderRoute(path);
    assert.match(html, /<h1>404 · Dossier not found<\/h1>/);
    assert.match(html, /<a\b[^>]*href="\/"[^>]*>Back to dossier index<\/a>/);
    assert.ok(!html.includes('aria-current="page"'), `${path} should have no current nav link`);
    assert.doesNotMatch(html, /<dl\b/);
  }
});
