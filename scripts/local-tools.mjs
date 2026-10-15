import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

export const loopbackHosts=new Set(['127.0.0.1','localhost','::1']);
export function localTools(root){
  const filename=path.join(root,'scripts','editor','plugin.mjs');
  const available=fs.existsSync(filename);
  return {available,plugin:{
    name:'optional-local-tools',apply:'serve',
    async configureServer(server){
      if(!available||!loopbackHosts.has(server.config.server.host))return;
      const {default:editor}=await import(pathToFileURL(filename).href);
      editor().configureServer(server);
    },
  }};
}
