import {site} from '../lib/settings';
export function GET(){return new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml',site.site).href}\n`,{headers:{'Content-Type':'text/plain; charset=utf-8'}});}
