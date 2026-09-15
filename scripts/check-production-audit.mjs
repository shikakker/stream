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
  const blocking = new Map();
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
      if (severity !== 'high' && severity !== 'critical') continue;

      const key =
        advisory.github_advisory_id ||
        advisory.url ||
        `${advisory.module_name || 'unknown'}:${advisory.title || 'untitled'}`;
      const existing = blocking.get(key) || {
        severity,
        moduleName: advisory.module_name || 'unknown module',
        title: advisory.title || 'untitled advisory',
        url: advisory.url || '',
        paths: new Set(),
      };

      for (const finding of advisory.findings || []) {
        for (const path of finding.paths || []) {
          existing.paths.add(path);
        }
      }

      blocking.set(key, existing);
    } catch {
      // Yarn can emit non-JSON noise around audit output. Ignore only those lines;
      // a fully unparseable audit is handled below.
    }
  }

  if (parsedRecords === 0) {
    console.error('yarn audit returned no parseable JSON records.');
    if (result.stderr) console.error(result.stderr.trim());
    process.exitCode = 1;
  } else if (blocking.size > 0) {
    console.error(
      `Production dependency audit found ${blocking.size} unique high/critical advisories:`,
    );
    for (const advisory of blocking.values()) {
      console.error(
        `- [${advisory.severity}] ${advisory.moduleName}: ${advisory.title}${advisory.url ? ` (${advisory.url})` : ''}`,
      );
      const paths = [...advisory.paths].slice(0, 8);
      for (const path of paths) {
        console.error(`    path: ${path}`);
      }
      if (advisory.paths.size > paths.length) {
        console.error(`    ... ${advisory.paths.size - paths.length} more path(s)`);
      }
    }
    process.exitCode = 1;
  } else {
    console.log('Production dependency audit: no high/critical advisories.');
  }
}
