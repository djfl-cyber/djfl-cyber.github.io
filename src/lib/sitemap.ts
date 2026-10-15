import {getPosts,dateParts,allTerms} from './content';
import {site} from './settings';
export async function sitemapXml(){
  const posts=await getPosts();
  const routes=new Set(['/','/archives/','/friends/','/navigation/','/about/']);
  for(const post of posts){routes.add(post.data.permalink);const d=dateParts(post.data.date);routes.add(`/archives/${d.year}/`);routes.add(`/archives/${d.year}/${d.month}/`);}
  for(const kind of ['tags','categories'] as const){const terms=allTerms(posts,kind);if(terms.length)routes.add(`/${kind}/`);for(const term of terms)routes.add(`/${kind}/${encodeURIComponent(term)}/`);}
  const escape=(value:string)=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...routes].map(route=>`  <url><loc>${escape(new URL(route,site.site).href)}</loc></url>`).join('\n')}\n</urlset>\n`;
}
