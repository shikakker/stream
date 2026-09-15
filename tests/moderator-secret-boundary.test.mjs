import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const notifier = await readFile(new URL('../lib/slack-notifier.ts', import.meta.url), 'utf8');
const moderatorPage = await readFile(new URL('../pages/moderator/delete-asset.tsx', import.meta.url), 'utf8');
const assetApi = await readFile(new URL('../pages/api/assets/[id].ts', import.meta.url), 'utf8');

test('Slack moderation links never place the moderator secret in the URL', () => {
  assert.doesNotMatch(notifier, /slack_moderator_password=\$\{moderatorPassword\}/);
  assert.doesNotMatch(notifier, /moderatorPassword/);
  assert.match(notifier, /moderator\/delete-asset\?asset_id=\$\{assetId\}/);
});

test('moderator page collects the secret as a password field instead of router query state', () => {
  assert.doesNotMatch(moderatorPage, /slack_moderator_password:\s*slackModeratorPassword/);
  assert.doesNotMatch(moderatorPage, /router\.query.*slack_moderator_password/);
  assert.match(moderatorPage, /type="password"/);
  assert.match(moderatorPage, /setModeratorPassword/);
});

test('asset deletion compares the configured moderator secret in constant time', () => {
  assert.match(assetApi, /timingSafeEqual/);
  assert.match(assetApi, /SLACK_MODERATOR_PASSWORD/);
  assert.match(assetApi, /status\(401\)/);
});
