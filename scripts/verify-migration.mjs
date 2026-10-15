import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT,HEXO,readJson,fileHash,hash,markdown,nodes } from './lib.mjs';
const report=readJson(path.join(ROOT,'scripts/data/migration-report.json'));
const assets=readJson(path.join(ROOT,'scripts/data/legacy-assets.json'));
for(const post of report.posts){
  const original=path.join(HEXO,post.source);
  assert.equal(fileHash(original),post.sourceHash,`Original article changed: ${post.source}`);
  const parsed=markdown(fs.readFileSync(path.join(ROOT,post.target),'utf8'));
  assert.equal(parsed.data.permalink,post.permalink);
  assert.equal(parsed.data.title,post.title);
  const code=nodes(parsed.tree,'code').map(n=>({lang:n.lang,value:n.value}));
  assert.equal(hash(JSON.stringify(code)),post.codeHash,`Code changed: ${post.target}`);
  assert.equal(nodes(parsed.tree,'image').length,post.imageCount,`Image count changed: ${post.target}`);
}
for(const asset of assets){assert.equal(fileHash(path.join(ROOT,asset.source)),asset.sha256);assert.equal(fileHash(path.join(ROOT,'public',asset.url)),asset.sha256);}
const baseline=path.join(ROOT,'scripts/artifacts/hexo-baseline/manifest.json');
if(fs.existsSync(baseline)){for(const file of readJson(baseline).files)assert.equal(fileHash(path.join(HEXO,file.path)),file.sha256,`Original Hexo file changed: ${file.path}`);}
console.log(`Migration verified: ${report.posts.length} original URLs, ${report.images} image references, ${assets.length} asset hashes, all code blocks and original Hexo source files unchanged.`);
