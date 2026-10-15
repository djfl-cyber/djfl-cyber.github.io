import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { visit } from 'unist-util-visit';
import GithubSlugger from 'github-slugger';

const root=fileURLToPath(new URL('../',import.meta.url));
export function remarkCodeLanguages() {
  return tree=>{ visit(tree,'code',node=>{ if(node.lang==='exiftool') node.lang='text'; }); };
}
export function rehypeLegacyAnchors() {
  const file=path.join(root,'scripts/data/legacy-anchors.json');
  const legacy=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
  return (tree,vfile)=>{
    const folder=path.basename(path.dirname(vfile.path??''));
    const old=legacy[folder]??[];
    const used=new Set(old.map(h=>h.id).filter(Boolean));
    const claimed=new Set();
    const slugger=new GithubSlugger();
    const nodeText=node=>node.type==='text'?node.value:(node.children??[]).map(nodeText).join('');
    const normalize=text=>text.replace(/\s+/g,' ').trim();
    visit(tree,'element',node=>{
      if(!/^h[1-6]$/.test(node.tagName))return;
      const text=nodeText(node);
      const heading=old.find(h=>!claimed.has(h)&&h.depth===Number(node.tagName[1])&&normalize(h.text)===normalize(text));
      let id;
      if(heading?.id){id=heading.id;claimed.add(heading);}
      else {const base=slugger.slug(text)||'section';id=base;let suffix=1;while(used.has(id))id=`${base}-${suffix++}`;}
      used.add(id);
      node.properties??={};
      node.properties.id=id;
    });
  };
}
