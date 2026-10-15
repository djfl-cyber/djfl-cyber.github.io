import { z } from 'astro/zod';
import rawSite from '../config/site.json';
import rawAppearance from '../config/appearance.json';
import rawHome from '../config/home.json';
import rawMenu from '../config/menu.json';
import rawPages from '../config/pages.json';
import rawFriends from '../data/friends.json';
import rawNavigation from '../data/navigation.json';
import rawText from '../config/text.json';

z.record(z.string(),z.record(z.string(),z.string())).parse(rawText);
export const text=rawText;

const color = z.string().regex(/^#[a-fA-F0-9]{6}$/);
const webUrl = z.url().refine(v => /^https?:\/\//.test(v), 'Only HTTP(S) URLs are supported');
const localOrWeb = z.string().refine(v => v === '' || (v.startsWith('/') && !v.startsWith('//') && !/[<>"'\\\s]/.test(v)) || /^https?:\/\/[^\s<>"'\\]+$/.test(v), 'Invalid image URL');
export const site = z.object({ title:z.string(), author:z.string(), description:z.string(), site:webUrl, language:z.string(), timezone:z.string(), startYear:z.number().int(), footer:z.string(), authorBio:z.string(), about:z.string(), github:webUrl }).parse(rawSite);
export const appearance = z.object({ defaultTheme:z.enum(['light','dark','system']), accent:color, accentDark:color, background:color, backgroundImage:localOrWeb, backgroundOverlay:z.number().min(0).max(1), decorations:z.boolean(), contentWidth:z.number().min(900).max(1600), articleWidth:z.number().min(560).max(1000), sidebarWidth:z.number().min(200).max(360), gap:z.number().min(16).max(80), radius:z.number().min(0).max(32), fontSize:z.number().min(14).max(22), fontFamily:z.string().refine(v=>!/[;{}<>]/.test(v)) }).parse(rawAppearance);
export const home = z.object({ hero:z.object({ enabled:z.boolean(), eyebrow:z.string(), title:z.string(), description:z.string(), buttonText:z.string(), note:z.string() }), modules:z.array(z.object({ type:z.enum(['posts','explore']), enabled:z.boolean(), title:z.string(), subtitle:z.string(), count:z.number().int().nonnegative() })).refine(m=>new Set(m.map(v=>v.type)).size===m.length, 'Duplicate home module'), sidebar:z.object({ enabled:z.boolean(), showAuthor:z.boolean(), showArchive:z.boolean(), showNote:z.boolean(), noteTitle:z.string(), note:z.string() }) }).parse(rawHome);
export const menu = z.array(z.object({ label:z.string(), href:z.string().refine(v=>v.startsWith('/')&&!v.startsWith('//')), enabled:z.boolean() })).parse(rawMenu).filter(v=>v.enabled);
const page = z.object({eyebrow:z.string(),title:z.string(),description:z.string()});
export const pages = z.object({ archives:page, friends:page.extend({empty:z.string(),emptyDetail:z.string()}), navigation:page.extend({empty:z.string(),emptyDetail:z.string(),noResults:z.string(),searchPlaceholder:z.string()}), about:page, notFound:page }).parse(rawPages);
const directory = z.object({ name:z.string().min(1), url:webUrl, description:z.string(), category:z.string().default('其他'), order:z.number().default(0), enabled:z.boolean().default(true), image:localOrWeb.optional() });
export const friends = z.array(directory).parse(rawFriends).filter(v=>v.enabled).sort((a,b)=>a.order-b.order);
export const navigation = z.array(directory).parse(rawNavigation).filter(v=>v.enabled).sort((a,b)=>a.order-b.order);
export const themeVariables = Object.entries({
  '--accent-light':appearance.accent, '--accent-dark':appearance.accentDark, '--page-light':appearance.background,
  '--content-width':`${appearance.contentWidth}px`, '--article-width':`${appearance.articleWidth}px`, '--sidebar-width':`${appearance.sidebarWidth}px`, '--layout-gap':`${appearance.gap}px`, '--radius':`${appearance.radius}px`, '--font-size':`${appearance.fontSize}px`, '--font-family':appearance.fontFamily,
  '--background-image':appearance.backgroundImage ? `url("${appearance.backgroundImage}")` : 'none', '--background-overlay':String(appearance.backgroundOverlay),
}).map(([key,value])=>`${key}:${value}`).join(';');
