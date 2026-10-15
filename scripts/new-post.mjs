import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { stringify } from 'yaml';
import { ROOT, inside, chinaDate } from './lib.mjs';

export function createPost({title,slug,base=path.join(ROOT,'src/content/posts'),now=new Date()}) {
  if(typeof title!=='string'||!title.trim())throw new Error('请输入文章标题。');
  const id=(slug??title.trim().normalize('NFKC').replace(/\s+/g,'-')).trim();
  if(!/^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u.test(id)||/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i.test(id))throw new Error('文章标识只能包含文字、数字、连字符和下划线，且不能使用系统保留名称。');
  const directory=inside(base,id);
  inside(ROOT,directory);
  if(fs.existsSync(directory))throw new Error(`文章目录已存在，不会覆盖：${id}`);
  const date=chinaDate(now);
  const permalink=`/${date.slice(0,10).replaceAll('-','/')}/${id}/`;
  const data={title:title.trim(),date,description:'',tags:[],categories:[],draft:true,permalink,toc:true};
  fs.mkdirSync(path.join(directory,'img'),{recursive:true});
  fs.writeFileSync(path.join(directory,'img','.gitkeep'),'');
  fs.writeFileSync(path.join(directory,'index.md'),`---\n${stringify(data)}---\n\n## 开始记录\n\n`);
  return {directory,permalink};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{const args=process.argv.slice(2);const slugIndex=args.indexOf('--slug');const title=args[0];if(slugIndex>=0&&!args[slugIndex+1])throw new Error('--slug 需要一个标识。');const result=createPost({title,slug:slugIndex>=0?args[slugIndex+1]:undefined});console.log(`已创建草稿：${path.join(result.directory,'index.md')}\n图片目录：${path.join(result.directory,'img')}\n网址：${result.permalink}\n完成写作后将 draft 改为 false，再构建发布。`);}catch(error){console.error(error.message);process.exitCode=1;}
}
