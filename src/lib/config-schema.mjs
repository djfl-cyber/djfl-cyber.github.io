import {z} from 'astro/zod';
const color = z.string().regex(/^#[a-fA-F0-9]{6}$/);
const webUrl = z.url().refine(v => /^https?:\/\//.test(v), 'Only HTTP(S) URLs are supported');
const localOrWeb = z.string().refine(v => v === '' || (v.startsWith('/') && !v.startsWith('//') && !/[<>"'\\\s]/.test(v)) || /^https?:\/\/[^\s<>"'\\]+$/.test(v), 'Invalid image URL');
const page = z.object({eyebrow:z.string(),title:z.string(),description:z.string()});
const directory = z.object({ name:z.string().min(1), url:webUrl, description:z.string(), category:z.string().default('其他'), order:z.number().default(0), enabled:z.boolean().default(true), image:localOrWeb.optional() });
const siteSchema=z.object({ title:z.string(), author:z.string(), avatar:localOrWeb.default(''), description:z.string(), site:webUrl, language:z.string(), timezone:z.string(), startYear:z.number().int(), footer:z.string(), authorBio:z.string(), about:z.string(), github:webUrl });
const appearanceSchema=z.object({ defaultTheme:z.enum(['light','dark','system']), accent:color, accentDark:color, background:color, backgroundImage:localOrWeb, backgroundOverlay:z.number().min(0).max(1), decorations:z.boolean(), contentWidth:z.number().min(900).max(1600), articleWidth:z.number().min(560).max(1000), sidebarWidth:z.number().min(200).max(360), gap:z.number().min(16).max(80), radius:z.number().min(0).max(32), fontSize:z.number().min(14).max(22), fontFamily:z.string().refine(v=>!/[;{}<>]/.test(v)) });
const homeSchema=z.object({ hero:z.object({ enabled:z.boolean(), eyebrow:z.string(), title:z.string(), description:z.string(), buttonText:z.string(), note:z.string() }), modules:z.array(z.object({ type:z.enum(['posts','explore']), enabled:z.boolean(), title:z.string(), subtitle:z.string(), count:z.number().int().nonnegative() })).refine(m=>new Set(m.map(v=>v.type)).size===m.length, 'Duplicate home module'), sidebar:z.object({ enabled:z.boolean(), showAuthor:z.boolean(), showArchive:z.boolean(), showNote:z.boolean(), noteTitle:z.string(), note:z.string() }) });
const menuSchema=z.array(z.object({ label:z.string(), href:z.string().refine(v=>v.startsWith('/')&&!v.startsWith('//')), enabled:z.boolean() }));
const pagesSchema=z.object({ archives:page, friends:page.extend({empty:z.string(),emptyDetail:z.string()}), navigation:page.extend({empty:z.string(),emptyDetail:z.string(),noResults:z.string(),searchPlaceholder:z.string()}), about:page, notFound:page });
const friendsSchema=z.array(directory);
const navigationSchema=z.array(directory);
export const configSchemas={site:siteSchema,appearance:appearanceSchema,home:homeSchema,menu:menuSchema,pages:pagesSchema,friends:friendsSchema,navigation:navigationSchema,text:z.record(z.string(),z.record(z.string(),z.string()))};
export function validateConfig(id,value){const schema=Object.hasOwn(configSchemas,id)&&configSchemas[id];if(!schema)throw Error('未知配置分组');return schema.parse(value);}
