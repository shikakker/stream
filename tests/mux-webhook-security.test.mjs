import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const webhook = await readFile(new URL('../pages/api/webhooks/mux.ts', import.meta.url), 'utf8');

test('Mux webhook fails closed when signature verification is not configured', () => {
  assert.match(webhook, /MUX_WEBHOOK_SIGNATURE_SECRET/);
  assert.doesNotMatch(webhook, /Skipping webhook sig verification/);
  assert.match(webhook, /WEBHOOK_NOT_CONFIGURED/);
  assert.match(webhook, /status\(503\)/);
});

test('Mux webhook rejects invalid signatures without exposing verifier internals', () => {
  assert.match(webhook, /WEBHOOK_UNAUTHORIZED/);
  assert.match(webhook, /status\(401\)/);
  assert.doesNotMatch(webhook, /json\(\{ message: \(e as Error\)\.message \}\)/);
});

test('Mux webhook parses JSON only after the verified signature call and handles malformed payloads', () => {
  const verifyCallIndex = webhook.indexOf(
    'verifyWebhookSignature(rawBody, signature, webhookSignatureSecret)',
  );
  const parseIndex = webhook.indexOf('JSON.parse(rawBodyText)');
  assert.ok(verifyCallIndex >= 0 && parseIndex > verifyCallIndex);
  assert.match(webhook, /INVALID_WEBHOOK_PAYLOAD/);
  assert.match(webhook, /status\(400\)/);
});
