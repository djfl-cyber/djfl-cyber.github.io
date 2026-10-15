import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, HEXO, files, fileHash, json, posix } from './lib.mjs';

const destination = path.join(ROOT, 'scripts/artifacts/hexo-baseline');
if (fs.existsSync(path.join(destination, 'manifest.json'))) {
  console.log('Existing immutable Hexo backup retained.');
  process.exit(0);
}
if (fs.existsSync(destination)) throw new Error('Incomplete backup exists; inspect before retrying.');
const entries = ['source', 'scaffolds', '.github', '_config.yml', '_config.butterfly.yml', '_config.landscape.yml', 'package.json', 'package-lock.json', '.gitignore', 'db.json'];
const manifest = [];
for (const entry of entries) {
  const src = path.join(HEXO, entry);
  if (!fs.existsSync(src)) continue;
  const list = fs.statSync(src).isDirectory() ? files(src) : [src];
  for (const file of list) {
    const relative = path.relative(HEXO, file);
    const to = path.join(destination, 'source', relative);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(file, to, fs.constants.COPYFILE_EXCL);
    manifest.push({ path: posix(relative), sha256: fileHash(file) });
  }
}
const deploy = path.join(HEXO, '.deploy_git');
let commit = null;
if (fs.existsSync(deploy)) {
  commit = execFileSync('git', ['-C', deploy, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  for (const file of filesWithoutGit(deploy)) {
    const to = path.join(destination, 'deployed', path.relative(deploy, file));
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(file, to, fs.constants.COPYFILE_EXCL);
  }
}
function filesWithoutGit(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.name === '.git' ? [] : e.isDirectory() ? filesWithoutGit(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
json(path.join(destination, 'manifest.json'), { createdAt: new Date().toISOString(), commit, files: manifest });
console.log(`Backed up ${manifest.length} source files and the deployed snapshot inside scripts/artifacts/hexo-baseline.`);
