import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {checkRelease} from '../check-release.mjs';
import {studioTools} from '../studio-tools.mjs';
const root=fileURLToPath(new URL('../../',import.meta.url));
const artifacts=path.join(root,'scripts/artifacts/tests');
function fixture(prefix){fs.mkdirSync(artifacts,{recursive:true});const target=fs.mkdtempSync(path.join(artifacts,prefix));fs.mkdirSync(path.join(target,'dist'));fs.writeFileSync(path.join(target,'dist/index.html'),'<title>Blog</title>');return target;}
test('release guard rejects private desktop code, retired routes and current preview tokens',()=>{
 const target=fixture('release-'),page=path.join(target,'dist/index.html');assert.equal(checkRelease(target).files,1);
 fs.mkdirSync(path.join(target,'dist/2026/10/15/src'),{recursive:true});fs.writeFileSync(path.join(target,'dist/2026/10/15/src/index.html'),'<title>A post about src</title>');assert.equal(checkRelease(target).files,2);
 fs.writeFileSync(page,'<a href="/__editor/">retired</a>');assert.throws(()=>checkRelease(target),/本地管理入口/);
 fs.mkdirSync(path.join(target,'.cache/studio'),{recursive:true});fs.writeFileSync(path.join(target,'.cache/studio/preview-session.json'),JSON.stringify({session:'a'.repeat(64)}));fs.writeFileSync(page,'a'.repeat(64));assert.throws(()=>checkRelease(target),/令牌/);
 fs.writeFileSync(page,'<title>Blog</title>');fs.mkdirSync(path.join(target,'scripts/studio/ui'),{recursive:true});fs.writeFileSync(path.join(target,'scripts/studio/ui/private.css'),'.private-manager{color:green}');fs.writeFileSync(path.join(target,'dist/renamed.css'),'.private-manager{color:green}');assert.throws(()=>checkRelease(target),/管理程序源文件/);
});
test('Git ignores desktop data and rejects forced additions without hiding blog configuration',()=>{
 const target=fixture('release-git-');fs.copyFileSync(path.join(root,'.gitignore'),path.join(target,'.gitignore'));execFileSync('git',['init','--quiet'],{cwd:target,stdio:'pipe'});
 const privatePaths=['scripts/studio/desktop/main.mjs','Blog Studio.cmd','.cache/studio/preview-session.json','scripts/artifacts/backup.json'];const ignored=execFileSync('git',['check-ignore','--no-index',...privatePaths],{cwd:target,encoding:'utf8'}).trim().split(/\r?\n/);assert.deepEqual(ignored,privatePaths);assert.throws(()=>execFileSync('git',['check-ignore','--no-index','src/config/text.json'],{cwd:target,stdio:'pipe'}),e=>e.status===1);
 fs.mkdirSync(path.join(target,'scripts/studio'),{recursive:true});fs.writeFileSync(path.join(target,'scripts/studio/private.mjs'),'private');execFileSync('git',['add','-f','scripts/studio/private.mjs'],{cwd:target,stdio:'pipe'});assert.throws(()=>checkRelease(target),/Git 正在跟踪/);
});
test('public blog configuration loads without Studio and production never imports a local integration',async()=>{
 const target=fixture('release-config-');let plugin;const setup=command=>studioTools(target).hooks['astro:config:setup']({command,updateConfig:config=>{plugin=config.vite.plugins[0];}});
 const previous=process.env.STUDIO_PREVIEW_SESSION;try{delete process.env.STUDIO_PREVIEW_SESSION;await setup('dev');assert.ok(plugin.load(plugin.resolveId('virtual:blog-layout-preview')).includes('return null'));
 fs.mkdirSync(path.join(target,'scripts/studio/preview'),{recursive:true});fs.writeFileSync(path.join(target,'scripts/studio/preview/integration.mjs'),'throw Error("must not load in production")');process.env.STUDIO_PREVIEW_SESSION='a'.repeat(64);await setup('build');assert.ok(plugin.load(plugin.resolveId('virtual:blog-layout-preview')).includes('return null'));}finally{if(previous===undefined)delete process.env.STUDIO_PREVIEW_SESSION;else process.env.STUDIO_PREVIEW_SESSION=previous;}
});
test('retired editor source, bootstrap and footer entry are absent from the blog project',()=>{
 for(const relative of ['scripts/editor','scripts/edit.mjs','scripts/local-tools.mjs','scripts/tests/editor.test.mjs'])assert.equal(fs.existsSync(path.join(root,relative)),false,relative);
 assert.doesNotMatch(fs.readFileSync(path.join(root,'src/components/Footer.astro'),'utf8'),/__editor|LOCAL_TEXT_EDITOR/);
 assert.doesNotMatch(fs.readFileSync(path.join(root,'astro.config.mjs'),'utf8'),/local-tools|localTools|LOCAL_TEXT_EDITOR/);
 assert.equal(JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).scripts.edit,'node scripts/studio-launch.mjs');
});
