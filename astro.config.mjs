import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { remarkCodeLanguages, rehypeLegacyAnchors } from './scripts/markdown-plugins.mjs';
import site from './src/config/site.json' with { type:'json' };
import { fileURLToPath } from 'node:url';
import { studioTools } from './scripts/studio-tools.mjs';


export default defineConfig({
  site:site.site,
  output:'static',
  integrations:[studioTools(fileURLToPath(new URL('./',import.meta.url)))],
  trailingSlash:'always',
  server:{host:'127.0.0.1'},
  devToolbar:{enabled:false},
  vite:{cacheDir:'.cache/vite'},
  markdown:{
    processor:unified({remarkPlugins:[remarkCodeLanguages],rehypePlugins:[rehypeLegacyAnchors]}),
    shikiConfig:{themes:{light:'github-light',dark:'github-dark'},wrap:false},
  },
});
