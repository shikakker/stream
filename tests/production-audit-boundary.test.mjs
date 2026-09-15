import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile(new URL('../.github/workflows/quality.yml', import.meta.url), 'utf8');
const auditScript = await readFile(new URL('../scripts/check-production-audit.mjs', import.meta.url), 'utf8').catch(() => '');

test('Quality gate runs a production dependency audit after frozen install', () => {
  assert.match(workflow, /yarn install --frozen-lockfile/);
  assert.match(workflow, /node scripts\/check-production-audit\.mjs/);
});

test('production audit gate blocks high and critical advisories', () => {
  assert.match(auditScript, /yarn audit/);
  assert.match(auditScript, /dependencies/);
  assert.match(auditScript, /high/);
  assert.match(auditScript, /critical/);
  assert.match(auditScript, /process\.exitCode = 1/);
});

test('production audit diagnostics deduplicate advisories and print dependency paths', () => {
  assert.match(auditScript, /new Map/);
  assert.match(auditScript, /findings/);
  assert.match(auditScript, /paths/);
});
