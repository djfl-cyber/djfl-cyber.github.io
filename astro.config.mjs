import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import { remarkCodeLanguages, rehypeLegacyAnchors } from './scripts/markdown-plugins.mjs';
import site from './src/config/site.json' with { type:'json' };
import { fileURLToPath } from 'node:url';
import { localTools } from './scripts/local-tools.mjs';

const tools=localTools(fileURLToPath(new URL('./',import.meta.url)));

export default defineConfig({
  site:site.site,
  output:'static',
  trailingSlash:'always',
  server:{host:'127.0.0.1'},
  devToolbar:{enabled:false},
  vite:{cacheDir:'.cache/vite',define:{'import.meta.env.LOCAL_TEXT_EDITOR_AVAILABLE':JSON.stringify(tools.available)},plugins:[tools.plugin]},
  markdown:{
    processor:unified({remarkPlugins:[remarkCodeLanguages],rehypePlugins:[rehypeLegacyAnchors]}),
    shikiConfig:{themes:{light:'github-light',dark:'github-dark'},wrap:false},
  },
});
