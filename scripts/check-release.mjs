import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function list(directory){
  if(!fs.existsSync(directory))return [];
  return fs.readdirSync(directory,{withFileTypes:true}).flatMap(entry=>{
    const filename=path.join(directory,entry.name);
    if(entry.isSymbolicLink())throw new Error(`发布目录中不允许符号链接：${filename}`);
    return entry.isDirectory()?list(filename):[filename];
  });
}
export function checkRelease(root){
  const dist=path.join(root,'dist'),errors=[];
  if(!fs.existsSync(path.join(dist,'index.html')))throw new Error('请先构建博客，再检查发布目录。');
  const privateFiles=[...list(path.join(root,'scripts/editor')),path.join(root,'scripts/edit.mjs'),path.join(root,'scripts/tests/editor.test.mjs')].filter(filename=>fs.existsSync(filename));
  const privateHashes=new Set(privateFiles.map(filename=>hash(fs.readFileSync(filename))));
  const tokenFile=path.join(root,'.cache/text-editor-token');
  const token=fs.existsSync(tokenFile)?fs.readFileSync(tokenFile,'utf8').trim():'';
  const markers=['/__editor/','__EDITOR_TOKEN__','editor-token','X-Editor-Token','local-text-editor'];
  const output=list(dist);
  for(const filename of output){
    const relative=path.relative(dist,filename).split(path.sep).join('/');
    if(/^(?:__editor|scripts|src|node_modules|\.git|\.astro|\.cache|\.vscode)(\/|$)/i.test(relative)||/(^|\/)(?:__editor|\.git|\.astro|\.cache|\.vscode|hexo-baseline|text-edits)(\/|$)/i.test(relative)||/(^|\/)(?:text-editor-token|\.env(?:\..*)?)$/i.test(relative))errors.push(`${relative}：包含本地工具、源码或私有配置路径`);
    const bytes=fs.readFileSync(filename);
    if(privateHashes.has(hash(bytes)))errors.push(`${relative}：包含工作台源文件`);
    if(token&&bytes.includes(Buffer.from(token,'utf8')))errors.push(`${relative}：包含本地工作台令牌`);
    if(/\.(?:html|js|mjs|css|json|txt|xml|svg|map)$/i.test(relative)){
      const content=bytes.toString('utf8');
      if(markers.some(marker=>content.includes(marker)))errors.push(`${relative}：包含工作台入口或接口标记`);
    }
  }
  // Ignoring a file cannot hide it after it has already been added to Git.
  let tracked='';
  try{tracked=execFileSync('git',['ls-files','-z','--','scripts/editor','scripts/edit.mjs','scripts/tests/editor.test.mjs'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']});}catch(error){if(error.code!=='ENOENT'&&error.status!==128)throw error;}
  if(tracked)errors.push('Git 正在跟踪本地工作台文件；请从暂存区/索引移除后再发布，保留本地文件。');
  if(errors.length)throw new Error(`发布检查未通过：\n${[...new Set(errors)].join('\n')}`);
  return {files:output.length};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const {files}=checkRelease(fileURLToPath(new URL('../',import.meta.url)));console.log(`Release OK: ${files} blog files; no local workbench pages, APIs, source files or tokens.`);}
  catch(error){console.error(error.message);process.exitCode=1;}
}
