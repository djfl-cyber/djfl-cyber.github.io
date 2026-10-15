function setTheme(theme:string){
  document.documentElement.dataset.theme=theme;
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach(button=>{button.setAttribute('aria-label',theme==='dark'?'切换为浅色主题':'切换为深色主题');});
}
setTheme(document.documentElement.dataset.theme??'light');
document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach(button=>button.addEventListener('click',()=>{
  const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';
  setTheme(theme);try{localStorage.setItem('djfl-theme',theme);}catch{}
}));
const menuButton=document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
const menu=document.getElementById('mobile-menu');
function closeMenu(){if(!menu||!menuButton)return;menu.hidden=true;menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','打开导航菜单');}
menuButton?.addEventListener('click',()=>{if(!menu)return;menu.hidden=!menu.hidden;menuButton.setAttribute('aria-expanded',String(!menu.hidden));menuButton.setAttribute('aria-label',menu.hidden?'打开导航菜单':'关闭导航菜单');});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu&&!menu.hidden){closeMenu();menuButton?.focus();}});
matchMedia('(min-width: 761px)').addEventListener('change',event=>{if(event.matches)closeMenu();});

const dialog=document.querySelector<HTMLDialogElement>('[data-toc-dialog]');
document.querySelector('[data-open-toc]')?.addEventListener('click',()=>dialog?.showModal());
document.querySelector('[data-close-toc]')?.addEventListener('click',()=>dialog?.close());
dialog?.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
dialog?.querySelectorAll<HTMLAnchorElement>('a[data-heading]').forEach(link=>link.addEventListener('click',()=>dialog.close()));

document.querySelectorAll<HTMLElement>('[data-toc]').forEach(toc=>{
  const items=[...toc.querySelectorAll<HTMLLIElement>('li[data-depth]')];
  toc.querySelectorAll<HTMLButtonElement>('[data-toc-toggle]').forEach(button=>button.addEventListener('click',()=>{
    const expanded=button.getAttribute('aria-expanded')==='true';
    button.setAttribute('aria-expanded',String(!expanded));
    button.setAttribute('aria-label',(button.getAttribute('aria-label')??'').replace(expanded?'折叠':'展开',expanded?'展开':'折叠'));
    const collapsed:number[]=[];
    for(const item of items){const depth=Number(item.dataset.depth);while(collapsed.length&&depth<=collapsed[collapsed.length-1])collapsed.pop();item.hidden=collapsed.length>0;if(item.querySelector('[data-toc-toggle]')?.getAttribute('aria-expanded')==='false')collapsed.push(depth);}
  }));
});

const codeText={copy:document.body.dataset.codeCopy??'复制代码',copied:document.body.dataset.codeCopied??'已复制',failed:document.body.dataset.codeFailed??'复制失败，请手动选择',expand:document.body.dataset.codeExpand??'展开完整代码 ↓',collapse:document.body.dataset.codeCollapse??'收起代码 ↑'};
const article=document.querySelector<HTMLElement>('[data-article]');
if(article){
  article.querySelectorAll<HTMLPreElement>('pre').forEach(pre=>{
    const code=pre.querySelector('code');if(!code)return;
    const wrapper=document.createElement('div');wrapper.className='code-block';
    pre.before(wrapper);wrapper.append(pre);
    const toolbar=document.createElement('div');toolbar.className='code-toolbar';
    const label=document.createElement('span');label.textContent=pre.dataset.language??code.className.match(/language-(\S+)/)?.[1]??'CODE';
    const copy=document.createElement('button');copy.type='button';copy.textContent=codeText.copy;copy.setAttribute('aria-live','polite');
    copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(code.textContent??'');copy.textContent=codeText.copied;}catch{copy.textContent=codeText.failed;}setTimeout(()=>{copy.textContent=codeText.copy},1800);});
    toolbar.append(label,copy);wrapper.prepend(toolbar);
    if((code.textContent??'').split('\n').length>28){
      wrapper.dataset.collapsed='true';const expand=document.createElement('button');expand.type='button';expand.className='code-expand';expand.textContent=codeText.expand;expand.setAttribute('aria-expanded','false');
      expand.addEventListener('click',()=>{const collapsed=wrapper.dataset.collapsed==='true';wrapper.dataset.collapsed=String(!collapsed);expand.textContent=collapsed?codeText.collapse:codeText.expand;expand.setAttribute('aria-expanded',String(collapsed));});wrapper.append(expand);
    }
  });
  article.querySelectorAll('table').forEach(table=>{const wrapper=document.createElement('div');wrapper.className='table-scroll';wrapper.tabIndex=0;wrapper.setAttribute('role','region');wrapper.setAttribute('aria-label','可横向滚动的表格');table.before(wrapper);wrapper.append(table);});
  const headings=[...article.querySelectorAll<HTMLElement>('h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]')];
  const links=[...document.querySelectorAll<HTMLAnchorElement>('[data-heading]')];
  const progress=document.querySelector<HTMLElement>('[data-reading-progress]');
  let queued=false,lastId='';
  function update(){
    queued=false;if(!article)return;
    const top=article.getBoundingClientRect().top+window.scrollY;
    const distance=Math.max(1,article.offsetHeight-window.innerHeight+120);
    const ratio=Math.min(1,Math.max(0,(window.scrollY-top+120)/distance));
    if(progress)progress.style.transform=`scaleX(${ratio})`;
    document.querySelectorAll('[data-reading-percent]').forEach(n=>n.textContent=`${Math.round(ratio*100)}%`);
    let current:HTMLElement|undefined=headings[0];for(const heading of headings){if(heading.getBoundingClientRect().top<=130)current=heading;else break;}
    if(window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-5)current=headings.at(-1);
    if(!current||current.id===lastId)return;lastId=current.id;
    for(const link of links){if(link.dataset.heading===lastId){link.setAttribute('aria-current','location');const toc=link.closest<HTMLElement>('[data-toc]');if(toc&&!link.closest('[hidden]')){const bounds=toc.getBoundingClientRect(),rect=link.getBoundingClientRect();if(rect.top<bounds.top||rect.bottom>bounds.bottom)toc.scrollTop+=rect.top-bounds.top-toc.clientHeight/2;}}else link.removeAttribute('aria-current');}
  }
  function schedule(){if(!queued){queued=true;requestAnimationFrame(update);}}
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});
  new ResizeObserver(schedule).observe(article);window.addEventListener('hashchange',schedule);
  document.fonts.ready.then(schedule);schedule();
  // Reapply deep links after code blocks receive their initial collapsed layout.
  if(location.hash){try{const target=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(target)requestAnimationFrame(()=>target.scrollIntoView({behavior:'instant',block:'start'}));}catch{}}
}

const directory=document.querySelector<HTMLElement>('[data-directory]');
if(directory){
  const search=directory.querySelector<HTMLInputElement>('[data-directory-search]');
  const items=[...directory.querySelectorAll<HTMLElement>('[data-directory-item]')];let category='';
  const filter=()=>{const query=search?.value.trim().toLowerCase()??'';let visible=0;for(const item of items){const show=(!category||item.dataset.category===category)&&(!query||(item.dataset.search??'').includes(query));item.hidden=!show;if(show)visible++;}const empty=directory.querySelector<HTMLElement>('[data-no-results]');if(empty)empty.hidden=visible>0;};
  search?.addEventListener('input',filter);
  directory.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.filter??'';directory.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));filter();}));
}
