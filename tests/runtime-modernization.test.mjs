import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const rootMiddleware = await readFile(new URL('../middleware.ts', import.meta.url), 'utf8').catch(() => '');
const nestedMiddleware = await readFile(new URL('../pages/v/[id]/_middleware.ts', import.meta.url), 'utf8').catch(() => '');
const muxClient = await readFile(new URL('../lib/mux-client.ts', import.meta.url), 'utf8').catch(() => '');

test('runtime uses maintained patched framework and provider SDK lines', () => {
  assert.equal(pkg.engines?.node, '22.x');
  assert.equal(pkg.dependencies.next, '15.5.25');
  assert.equal(pkg.dependencies.react, '18.2.0');
  assert.equal(pkg.dependencies['react-dom'], '18.2.0');
  assert.equal(pkg.dependencies['@mux/mux-node'], '15.1.0');
  assert.equal(pkg.dependencies['@google-cloud/vision'], '6.1.0');
  assert.equal(pkg.dependencies['js-cookie'], '3.0.8');
  assert.equal(pkg.dependencies.got, undefined);
});

test('Mux access is centralized on the current video API client', () => {
  assert.match(muxClient, /new Mux\(/);
  assert.match(muxClient, /tokenId/);
  assert.match(muxClient, /tokenSecret/);
});

test('legacy nested Next middleware is migrated to the supported root middleware boundary', () => {
  assert.equal(nestedMiddleware, '');
  assert.match(rootMiddleware, /export function middleware/);
  assert.match(rootMiddleware, /matcher/);
  assert.match(rootMiddleware, /response\.cookies\.delete/);
});
