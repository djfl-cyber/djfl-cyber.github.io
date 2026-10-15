import {sitemapXml} from '../lib/sitemap';
export async function GET(){return new Response(await sitemapXml(),{headers:{'Content-Type':'application/xml; charset=utf-8'}});}
