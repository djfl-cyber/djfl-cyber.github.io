import fs from 'node:fs';
import path from 'node:path';
import { ROOT,files,inside,htmlTree,walkHtml,attr,readJson,posix,markdown } from './lib.mjs';
const dist=path.join(ROOT,'dist');
if(!fs.existsSync(dist))throw new Error('Build the site before checking links.');
const errors=[];const documents=new Map();let linkCount=0;
for(const filename of files(dist).filter(f=>f.endsWith('.html'))){
  const tree=htmlTree(fs.readFileSync(filename,'utf8'));const ids=new Set();const links=[];
  walkHtml(tree,node=>{
    const id=attr(node,'id');if(id){if(ids.has(id))errors.push(`Duplicate ID ${id} in ${posix(path.relative(dist,filename))}`);ids.add(id);}
    for(const name of ['href','src']){const value=attr(node,name);if(value)links.push(value);}
    const srcset=attr(node,'srcset');if(srcset)links.push(...srcset.split(',').map(p=>p.trim().split(/\s+/)[0]));
  });
  documents.set(filename,{ids,links});
}
for(const [filename,doc]of documents){
  const relative='/'+posix(path.relative(dist,filename));const base=new URL(relative,'https://local.invalid');
  for(const link of doc.links){
    let url;try{url=new URL(link,base);}catch{errors.push(`Invalid URL ${link} in ${relative}`);continue;}
    if(url.origin!=='https://local.invalid')continue;
    linkCount++;
    let target;try{target=inside(dist,'.'+decodeURIComponent(url.pathname));}catch(error){errors.push(error.message);continue;}
    if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
    if(!fs.existsSync(target)){errors.push(`Missing target ${link} in ${relative}`);continue;}
    if(url.hash&&documents.has(target)&&!documents.get(target).ids.has(decodeURIComponent(url.hash.slice(1))))errors.push(`Missing anchor ${link} in ${relative}`);
  }
}
const report=readJson(path.join(ROOT,'scripts/data/migration-report.json'));
const anchors=readJson(path.join(ROOT,'scripts/data/legacy-anchors.json'));
for(const post of report.posts){
  const filename=inside(dist,'.'+post.permalink+'index.html');const doc=documents.get(filename);
  if(!doc){errors.push(`Lost old article URL: ${post.permalink}`);continue;}
  const key=path.basename(path.dirname(post.target));
  for(const heading of anchors[key]??[]){if(heading.id&&!doc.ids.has(heading.id))errors.push(`Lost old anchor ${heading.id} in ${post.permalink}`);}
}
for(const archive of report.archives){if(!fs.existsSync(inside(dist,'.'+archive+'index.html')))errors.push(`Lost archive: ${archive}`);}
for(const filename of files(path.join(ROOT,'src/content/posts')).filter(f=>path.basename(f)==='index.md')){
  const {data}=markdown(fs.readFileSync(filename,'utf8'));
  if(data.draft&&fs.existsSync(inside(dist,'.'+data.permalink+'index.html')))errors.push(`Published draft: ${data.permalink}`);
}
if(errors.length){console.error([...new Set(errors)].join('\n'));process.exitCode=1;}else console.log(`Static output OK: ${documents.size} HTML pages, ${linkCount} local links/resources, all old article/archive URLs and heading anchors preserved, no draft pages.`);
