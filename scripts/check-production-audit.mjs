import { spawnSync } from 'node:child_process';

const result = spawnSync(
  'yarn',
  ['audit', '--groups', 'dependencies', '--json'],
  {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  },
);

if (result.error) {
  console.error(`Unable to run yarn audit: ${result.error.message}`);
  process.exitCode = 1;
} else {
  const blocking = [];
  let parsedRecords = 0;

  for (const rawLine of (result.stdout || '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    try {
      const record = JSON.parse(line);
      parsedRecords += 1;

      if (record.type !== 'auditAdvisory') continue;

      const advisory = record.data?.advisory;
      const severity = advisory?.severity;
      if (severity === 'high' || severity === 'critical') {
        blocking.push({
          severity,
          moduleName: advisory.module_name || 'unknown module',
          title: advisory.title || 'untitled advisory',
          url: advisory.url || '',
        });
      }
    } catch {
      // Yarn can emit non-JSON noise around audit output. Ignore only those lines;
      // a fully unparseable audit is handled below.
    }
  }

  if (parsedRecords === 0) {
    console.error('yarn audit returned no parseable JSON records.');
    if (result.stderr) console.error(result.stderr.trim());
    process.exitCode = 1;
  } else if (blocking.length > 0) {
    console.error(`Production dependency audit found ${blocking.length} high/critical advisories:`);
    for (const advisory of blocking) {
      console.error(
        `- [${advisory.severity}] ${advisory.moduleName}: ${advisory.title}${advisory.url ? ` (${advisory.url})` : ''}`,
      );
    }
    process.exitCode = 1;
  } else {
    console.log('Production dependency audit: no high/critical advisories.');
  }
}
