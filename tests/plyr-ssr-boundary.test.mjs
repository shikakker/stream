import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../components/plyr-player.tsx', import.meta.url), 'utf8');

test('Plyr is loaded only in the browser lifecycle', () => {
  assert.doesNotMatch(source, /^import Plyr from ['"]plyr['"];?$/m);
  assert.match(source, /await import\(['"]plyr['"]\)/);
  assert.match(source, /typeof window === ['"]undefined['"]/);
});
