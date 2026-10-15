import fs from 'node:fs';
import path from 'node:path';
import { stringify } from 'yaml';
import { ROOT, HEXO, inside, files, posix, fileHash, hash, markdown, nodes, json, readJson, write, htmlTree, walkHtml, attr, textContent, decodePath, chinaDate } from './lib.mjs';

const apply = process.argv.includes('--apply');
const out = path.join(ROOT, 'src/content/posts');
const source = path.join(HEXO, 'source');
const published = path.join(HEXO, '.deploy_git');
const db = readJson(path.join(HEXO, 'db.json')).models.Post;
const sitemap = fs.readFileSync(path.join(published, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => new URL(m[1]));
const mappings = new Map();
const pending = new Map();
const posts = [];
const anchors = {};
const warnings = [];
const counts = { images: 0 };

function stage(file, content) {
  inside(ROOT, file);
  const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content);
  if (pending.has(file) && !pending.get(file).equals(bytes)) throw new Error(`Conflicting destination: ${file}`);
  if (fs.existsSync(file) && !fs.readFileSync(file).equals(bytes)) throw new Error(`Refusing to overwrite changed file: ${file}`);
  pending.set(file, bytes);
}
function registerAsset(oldUrl, preferredDir) {
  const decoded = decodePath(oldUrl);
  if (!decoded.startsWith('/img/')) throw new Error(`Unsupported legacy asset: ${oldUrl}`);
  const src = inside(source, '.' + decoded);
  if (!fs.existsSync(src)) throw new Error(`Missing image: ${decoded}`);
  if (!mappings.has(decoded)) {
    let destination = preferredDir ? path.join(preferredDir, path.basename(src)) : path.join(ROOT, 'src/assets/legacy', decoded.slice('/img/'.length));
    if (pending.has(destination) && !pending.get(destination).equals(fs.readFileSync(src))) destination = path.join(path.dirname(destination), `${hash(decoded).slice(0,8)}-${path.basename(src)}`);
    stage(destination, fs.readFileSync(src));
    mappings.set(decoded, { url: decoded, source: posix(path.relative(ROOT, destination)), sha256: fileHash(src) });
  }
  return path.join(ROOT, mappings.get(decoded).source);
}

for (const filename of files(path.join(source, '_posts')).filter(f => f.endsWith('.md'))) {
  const raw = fs.readFileSync(filename, 'utf8');
  const parsed = markdown(raw);
  const record = db.find(p => p.source === '_posts/' + path.basename(filename));
  if (!record) throw new Error(`Missing Hexo record: ${filename}`);
  const url = urls.find(u => decodeURIComponent(u.pathname).endsWith('/' + record.slug + '/'));
  if (!url) throw new Error(`Missing deployed URL: ${filename}`);
  const permalink = decodeURIComponent(url.pathname);
  const id = path.basename(filename, '.md').replace(/[<>:"/\\|?*]/g, '-');
  const folder = inside(out, id);
  const replacements = [];
  const imageNodes = nodes(parsed.tree, 'image');
  for (const node of imageNodes) {
    if (/^(https?:|data:)/i.test(node.url)) continue;
    const target = registerAsset(node.url, path.join(folder, 'img'));
    const relative = './' + posix(path.relative(folder, target));
    const alt = (node.alt ?? '').replace(/[\[\]\\]/g, '\\$&');
    const title = node.title ? ` ${JSON.stringify(node.title)}` : '';
    replacements.push({ start: node.position.start.offset, end: node.position.end.offset, value: `![${alt}](${encodeURI(relative)}${title})` });
    counts.images++;
  }
  for (const definition of nodes(parsed.tree, 'definition')) {
    if (!definition.url.startsWith('/img/')) continue;
    const target = registerAsset(definition.url, path.join(folder, 'img'));
    replacements.push({ start: definition.position.start.offset, end: definition.position.end.offset, value: `[${definition.label ?? definition.identifier}]: ${encodeURI('./' + posix(path.relative(folder, target)))}` });
  }
  let body = parsed.body;
  for (const r of replacements.sort((a,b) => b.start - a.start)) body = body.slice(0,r.start) + r.value + body.slice(r.end);
  const data = { ...parsed.data, date: chinaDate(new Date(record.date)), tags: parsed.data.tags ? [].concat(parsed.data.tags) : [], categories: parsed.data.categories ? [].concat(parsed.data.categories) : [], draft: false, permalink, toc: true };
  if (typeof data.title === 'string' && /^'.*'$/.test(data.title)) warnings.push({ file: path.basename(filename), message: 'Title contains literal single quotes; preserved unchanged.' });
  stage(path.join(folder, 'index.md'), `---\n${stringify(data)}---\n${body}`);
  const html = fs.readFileSync(inside(published, '.' + permalink + 'index.html'), 'utf8');
  let article;
  walkHtml(htmlTree(html), n => { if (attr(n, 'id') === 'article-container') article = n; });
  if (!article) throw new Error(`Missing deployed article: ${permalink}`);
  const oldHeadings = [];
  walkHtml(article, n => { if (/^h[1-6]$/.test(n.tagName ?? '')) oldHeadings.push({ depth: Number(n.tagName[1]), text: textContent(n), id: attr(n,'id') }); });
  anchors[id] = oldHeadings;
  const codes = nodes(parsed.tree, 'code').map(n => ({ lang: n.lang, value: n.value }));
  posts.push({ source: posix(path.relative(HEXO, filename)), target: posix(path.relative(ROOT,path.join(folder,'index.md'))), permalink, title: data.title, sourceHash: hash(raw), codeHash: hash(JSON.stringify(codes)), imageCount: imageNodes.length, headings: oldHeadings.length });
}
for (const file of files(path.join(source,'img'))) registerAsset('/img/' + posix(path.relative(path.join(source,'img'),file)));
const archivedPaths = files(path.join(published, 'archives')).filter(f=>path.basename(f)==='index.html').map(f=>'/' + posix(path.relative(published,path.dirname(f))) + '/');
const report = { posts, images: counts.images, assets: mappings.size, archives: archivedPaths, warnings };
if (apply) {
  for (const [filename, content] of pending) write(filename, content);
  json(path.join(ROOT,'scripts/data/legacy-assets.json'), [...mappings.values()]);
  json(path.join(ROOT,'scripts/data/legacy-anchors.json'), anchors);
  json(path.join(ROOT,'scripts/data/migration-report.json'), report);
  console.log(`Migrated ${posts.length} posts, ${counts.images} image references and ${mappings.size} assets. Existing files were not overwritten.`);
} else console.log(JSON.stringify({ mode:'dry-run', ...report },null,2));
