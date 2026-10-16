import {configSchemas} from './config-schema.mjs';
import rawSite from '../config/site.json';
import rawAppearance from '../config/appearance.json';
import rawHome from '../config/home.json';
import rawMenu from '../config/menu.json';
import rawPages from '../config/pages.json';
import rawFriends from '../data/friends.json';
import rawNavigation from '../data/navigation.json';
import rawText from '../config/text.json';

configSchemas.text.parse(rawText);
export const text=rawText;




export const site = configSchemas.site.parse(rawSite);
export const appearance = configSchemas.appearance.parse(rawAppearance);
export const home = configSchemas.home.parse(rawHome);
export const menu = configSchemas.menu.parse(rawMenu).filter(v=>v.enabled);

export const pages = configSchemas.pages.parse(rawPages);

export const friends = configSchemas.friends.parse(rawFriends).filter(v=>v.enabled).sort((a,b)=>a.order-b.order);
export const navigation = configSchemas.navigation.parse(rawNavigation).filter(v=>v.enabled).sort((a,b)=>a.order-b.order);
export const themeVariables = Object.entries({
  '--accent-light':appearance.accent, '--accent-dark':appearance.accentDark, '--page-light':appearance.background,
  '--content-width':`${appearance.contentWidth}px`, '--article-width':`${appearance.articleWidth}px`, '--sidebar-width':`${appearance.sidebarWidth}px`, '--layout-gap':`${appearance.gap}px`, '--radius':`${appearance.radius}px`, '--font-size':`${appearance.fontSize}px`, '--font-family':appearance.fontFamily,
  '--background-image':appearance.backgroundImage ? `url("${appearance.backgroundImage}")` : 'none', '--background-overlay':String(appearance.backgroundOverlay),
}).map(([key,value])=>`${key}:${value}`).join(';');
