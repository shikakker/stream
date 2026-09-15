import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const hive = await readFile(new URL('../lib/moderation-hive.ts', import.meta.url), 'utf8');
const slack = await readFile(new URL('../lib/slack-notifier.ts', import.meta.url), 'utf8');
const report = await readFile(new URL('../pages/api/report.ts', import.meta.url), 'utf8');

test('server HTTP integrations use the Node 22 fetch primitive instead of legacy got', () => {
  assert.equal(pkg.dependencies.got, undefined);
  for (const source of [hive, slack, report]) {
    assert.doesNotMatch(source, /got-client/);
    assert.doesNotMatch(source, /from ['"]got['"]/);
    assert.match(source, /fetch\(/);
  }
});

test('external HTTP writes reject non-success responses instead of silently accepting them', () => {
  assert.match(hive, /response\.ok/);
  assert.match(slack, /response\.ok/);
  assert.match(report, /response\.ok/);
});
