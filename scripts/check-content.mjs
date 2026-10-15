import fs from 'node:fs';
import path from 'node:path';
import { ROOT,files,markdown,nodes,inside,decodePath,normalizePermalink,posix } from './lib.mjs';
const posts=files(path.join(ROOT,'src/content/posts')).filter(f=>path.basename(f)==='index.md');
const all=new Set(files(path.join(ROOT,'src')).map(f=>posix(path.relative(ROOT,f))));
const errors=[];const routes=new Set();let images=0,drafts=0;
for(const filename of posts){
  try{
    const {data,tree}=markdown(fs.readFileSync(filename,'utf8'));
    const route=normalizePermalink(data.permalink);
    if(routes.has(route))throw new Error(`Duplicate route: ${route}`);
    routes.add(route);
    if(/^\/(archives|friends|navigation|about|tags|categories)(\/|$)/.test(route))throw new Error(`Reserved route: ${route}`);
    if(!data.title||Number.isNaN(new Date(data.date).getTime()))throw new Error('Invalid title/date');
    if(typeof data.draft!=='boolean')throw new Error('draft must explicitly be true or false');
    if(data.draft)drafts++;
    for(const node of [...nodes(tree,'image'),...nodes(tree,'definition')]){
      if(!node.url||/^(https?:|data:|#)/i.test(node.url))continue;
      const decoded=decodePath(node.url);
      const file=decoded.startsWith('/')?inside(path.join(ROOT,'public'),'.'+decoded):inside(ROOT,path.resolve(path.dirname(filename),decoded));
      if(!fs.existsSync(file))throw new Error(`Missing asset: ${node.url}`);
      if(file.startsWith(path.join(ROOT,'src'))&&!all.has(posix(path.relative(ROOT,file))))throw new Error(`Asset path casing differs: ${node.url}`);
      if(node.type==='image')images++;
    }
  }catch(error){errors.push(`${posix(path.relative(ROOT,filename))}: ${error.message}`);}
}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Content OK: ${posts.length} posts (${drafts} drafts), ${images} local images, unique valid routes.`);
