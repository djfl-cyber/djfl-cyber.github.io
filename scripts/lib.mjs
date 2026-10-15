import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import { parse as parseHtml } from 'parse5';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const HEXO = path.dirname(ROOT);
export const posix = value => value.split(path.sep).join('/');
export const hash = value => crypto.createHash('sha256').update(value).digest('hex');
export const fileHash = filename => hash(fs.readFileSync(filename));
export function inside(base, value) {
  const resolved = path.resolve(base, value);
  const relative = path.relative(path.resolve(base), resolved);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error(`Path escapes its root: ${value}`);
  return resolved;
}
export function files(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.isSymbolicLink()) throw new Error(`Unexpected symbolic link: ${entry.name}`);
    return entry.isDirectory() ? files(path.join(dir, entry.name)) : [path.join(dir, entry.name)];
  }).sort();
}
export function write(filename, value) {
  inside(ROOT, filename);
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, value);
}
export function json(filename, value) { write(filename, JSON.stringify(value, null, 2) + '\n'); }
export function readJson(filename) { return JSON.parse(fs.readFileSync(filename, 'utf8')); }
export function markdown(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error('Missing YAML frontmatter');
  const body = source.slice(match[0].length);
  const tree = unified().use(remarkParse).use(remarkGfm).parse(body);
  return { data: parseYaml(match[1]), body, tree };
}
export function nodes(tree, type) {
  const result = [];
  visit(tree, type, node => { result.push(node); });
  return result;
}
export function htmlTree(source) { return parseHtml(source); }
export function walkHtml(node, callback) {
  callback(node);
  for (const child of node.childNodes ?? []) walkHtml(child, callback);
}
export function attr(node, name) { return node.attrs?.find(a => a.name === name)?.value; }
export function textContent(node) { return node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(textContent).join(''); }
export function chinaDate(date = new Date()) {
  return new Date(date.getTime() + 8 * 3600_000).toISOString().replace(/\.\d{3}Z$/, '+08:00');
}
export function decodePath(value) {
  const pathname = value.split(/[?#]/)[0];
  try { return decodeURIComponent(pathname); } catch { throw new Error(`Invalid encoded path: ${value}`); }
}
export function normalizePermalink(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[?#\\\0]/.test(value)) throw new Error(`Invalid permalink: ${value}`);
  const decoded = decodePath(value);
  if (decoded.split('/').some(p => p === '..' || p === '.')) throw new Error(`Invalid permalink: ${value}`);
  return '/' + decoded.split('/').filter(Boolean).join('/') + '/';
}
