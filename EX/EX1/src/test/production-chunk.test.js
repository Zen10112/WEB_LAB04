// @vitest-environment node
import { build } from 'vite';
import { expect, test } from 'vitest';

test('production dynamically imports PersonDetail from its own chunk', async () => {
  const { output } = await build({
    logLevel: 'silent',
    build: { manifest: true, write: false },
  });
  const manifestAsset = output.find((file) => file.fileName === '.vite/manifest.json');
  const manifest = JSON.parse(manifestAsset.source);
  const entry = manifest['index.html'];
  const detailPath = 'src/components/PersonDetail.jsx';
  const detail = manifest[detailPath];
  const entryChunk = output.find((file) => file.fileName === entry.file);
  const detailChunk = output.find((file) => file.fileName === detail.file);

  expect(detail.isDynamicEntry).toBe(true);
  expect(entry.dynamicImports).toContain(detailPath);
  expect(entryChunk.dynamicImports).toContain(detail.file);
  expect(entryChunk.imports).not.toContain(detail.file);
  expect(Object.keys(entryChunk.modules).some((id) => id.endsWith(detailPath))).toBe(false);
  expect(Object.keys(detailChunk.modules).some((id) => id.endsWith(detailPath))).toBe(true);
}, 15_000);
