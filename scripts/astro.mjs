import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const temp = path.join(root, '.cache', 'temp');
mkdirSync(temp, { recursive: true });
const astroPackage = JSON.parse(readFileSync(path.join(root, 'node_modules/astro/package.json'), 'utf8'));
const astroBin = typeof astroPackage.bin === 'string' ? astroPackage.bin : astroPackage.bin.astro;
const child = spawn(process.execPath, [path.join(root, 'node_modules/astro', astroBin), ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1', TEMP: temp, TMP: temp, XDG_CACHE_HOME: path.join(root, '.cache') },
});
child.on('exit', code => { process.exitCode = code ?? 1; });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
