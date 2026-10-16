import { getCollection, type CollectionEntry } from 'astro:content';
import { site } from './settings';
import { previewOptions } from 'virtual:blog-layout-preview';
export type Post = CollectionEntry<'posts'>;
export async function getPosts(request?:Request) {
  const includeDrafts=request?(previewOptions(request)?.includeDrafts??import.meta.env.DEV):import.meta.env.DEV;
  const posts = await getCollection('posts', p=>includeDrafts || !p.data.draft);
  const routes = new Set<string>();
  for (const post of posts) {
    const route=decodeURIComponent(post.data.permalink);
    if(routes.has(route)) throw new Error(`Duplicate article route: ${route}`);
    if(/^\/(archives|friends|navigation|about|tags|categories)(\/|$)/.test(route)) throw new Error(`Reserved article route: ${route}`);
    routes.add(route);
  }
  return posts.sort((a,b)=>b.data.date.getTime()-a.data.date.getTime());
}
export function dateLabel(date:Date) { return new Intl.DateTimeFormat('zh-CN',{timeZone:site.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(date).replaceAll('/','.'); }
export function dateParts(date:Date) {
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:site.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
  return {year:p.find(x=>x.type==='year')!.value,month:p.find(x=>x.type==='month')!.value,day:p.find(x=>x.type==='day')!.value};
}
export function readingTime(post:Post) { return Math.max(1,Math.ceil((post.body?.length??0)/650)); }
export function excerpt(post:Post) {
  if(post.data.description?.trim()) return post.data.description;
  return (post.body??'').replace(/```[\s\S]*?```/g,' ').replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/^#{1,6}\s+.*$/gm,'').replace(/[>*_`~|]/g,'').replace(/\s+/g,' ').trim().slice(0,100);
}
export function allTerms(posts:Post[], kind:'tags'|'categories') { return [...new Set(posts.flatMap(p=>p.data[kind]))]; }
