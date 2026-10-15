import fs from 'node:fs';
import path from 'node:path';
import { ROOT, inside, readJson, fileHash } from './lib.mjs';
const manifest = path.join(ROOT, 'scripts/data/legacy-assets.json');
if (!fs.existsSync(manifest)) throw new Error('Run the migration before preparing legacy assets.');
const assets = readJson(manifest);
for (const asset of assets) {
  const source = inside(ROOT, asset.source);
  if (fileHash(source) !== asset.sha256) throw new Error(`Legacy source changed: ${asset.source}`);
  const destination = inside(path.join(ROOT,'public'), '.' + asset.url);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}
console.log(`Prepared ${assets.length} original /img/ URLs.`);
