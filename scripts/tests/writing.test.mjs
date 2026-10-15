import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT,markdown,normalizePermalink,inside,nodes } from '../lib.mjs';
import {createPost} from '../new-post.mjs';

test('new article bundles images, uses Shanghai date, and never overwrites content',()=>{
  const artifacts=path.join(ROOT,'scripts/artifacts/tests');fs.mkdirSync(artifacts,{recursive:true});
  const base=fs.mkdtempSync(path.join(artifacts,'writing-'));
  const post=createPost({title:'新文章',slug:'new-note',base,now:new Date('2026-10-14T18:00:00Z')});
  assert.equal(post.permalink,'/2026/10/15/new-note/');
  assert.ok(fs.existsSync(path.join(post.directory,'img','.gitkeep')));
  const filename=path.join(post.directory,'index.md');const content=fs.readFileSync(filename,'utf8');
  const {data}=markdown(content);assert.equal(data.draft,true);assert.equal(data.date,'2026-10-15T02:00:00+08:00');
  assert.throws(()=>createPost({title:'changed',slug:'new-note',base}),/不会覆盖/);
  assert.equal(fs.readFileSync(filename,'utf8'),content);
  assert.throws(()=>createPost({title:'test',slug:'../escape',base}),/标识/);
  assert.throws(()=>createPost({title:'test',slug:'CON',base}),/标识/);
});
test('route and resource validation reject traversal and keep Unicode paths',()=>{
  assert.equal(normalizePermalink('/2026/10/14/%E7%AC%94%E8%AE%B0/'),'/2026/10/14/笔记/');
  assert.throws(()=>normalizePermalink('/%2e%2e/file/'),/Invalid/);
  assert.throws(()=>inside(ROOT,'../outside'),/escapes/);
});
test('Markdown parsing excludes image examples and heading comments in code blocks',()=>{
  const parsed=markdown('---\ntitle: test\n---\n# Heading\n```python\n# Not a heading\n![](/img/not-real.png)\n```\n![](./img/real.png)\n');
  assert.equal(nodes(parsed.tree,'heading').length,1);assert.equal(nodes(parsed.tree,'image').length,1);
});
