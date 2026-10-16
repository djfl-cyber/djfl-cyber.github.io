import fs from 'node:fs';
import {pathToFileURL,fileURLToPath} from 'node:url';
const entry=fileURLToPath(new URL('./studio/desktop/portable-launch.mjs',import.meta.url));
if(fs.existsSync(entry))await import(pathToFileURL(entry).href);else{console.error('此电脑尚未安装 Blog Studio。请将本地便携管理包解压到博客根目录，然后双击 Blog Studio.cmd。博客的构建与发布不依赖管理程序。');process.exitCode=1;}
