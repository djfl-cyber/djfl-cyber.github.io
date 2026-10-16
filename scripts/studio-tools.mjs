import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

// Only the optional loader is public; the desktop tool remains local.
export function studioTools(root) {
  return {name:'optional-studio-preview',hooks:{'astro:config:setup':async options=>{
    let moduleSource='export async function readLayout(){return null;}export function previewOptions(){return null;}';
    options.updateConfig({vite:{plugins:[{name:'optional-layout-preview',resolveId(id){if(id==='virtual:blog-layout-preview')return '\0blog-layout-preview';},load(id){if(id==='\0blog-layout-preview')return moduleSource;}}]}});
    if(options.command!=='dev'||!/^\w{64}$/.test(process.env.STUDIO_PREVIEW_SESSION??''))return;
    const entry=path.join(root,'scripts/studio/preview/integration.mjs');
    if(!fs.existsSync(entry))return;
    const {configure,previewModule}=await import(pathToFileURL(entry).href);
    moduleSource=previewModule(root);
    configure(options,root);
  }}};
}
