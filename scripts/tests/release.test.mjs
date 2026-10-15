import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {checkRelease} from '../check-release.mjs';
import {localTools} from '../local-tools.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url));
const artifacts=path.join(root,'scripts/artifacts/tests');
test('release guard accepts blog files and rejects copied workbench code, routes and tokens',()=>{
  fs.mkdirSync(artifacts,{recursive:true});
  const fixture=fs.mkdtempSync(path.join(artifacts,'release-'));fs.mkdirSync(path.join(fixture,'dist'),{recursive:true});
  const page=path.join(fixture,'dist/index.html');fs.writeFileSync(page,'<!doctype html><title>My blog</title>');
  assert.equal(checkRelease(fixture).files,1);
  fs.mkdirSync(path.join(fixture,'dist/2026/10/15/src'),{recursive:true});fs.writeFileSync(path.join(fixture,'dist/2026/10/15/src/index.html'),'<title>A post about src</title>');
  assert.equal(checkRelease(fixture).files,2);
  fs.writeFileSync(page,'<a href="/__editor/">Editor</a>');assert.throws(()=>checkRelease(fixture),/工作台入口/);
  fs.writeFileSync(page,'<title>My blog</title>');fs.mkdirSync(path.join(fixture,'.cache'));fs.writeFileSync(path.join(fixture,'.cache/text-editor-token'),'a'.repeat(64));
  fs.writeFileSync(page,'a'.repeat(64));assert.throws(()=>checkRelease(fixture),/令牌/);
  fs.writeFileSync(page,'<title>My blog</title>');fs.mkdirSync(path.join(fixture,'scripts/editor'),{recursive:true});
  fs.writeFileSync(path.join(fixture,'scripts/editor/style.css'),'.private-workbench { color: green; }');
  fs.writeFileSync(path.join(fixture,'dist/renamed.css'),'.private-workbench { color: green; }');assert.throws(()=>checkRelease(fixture),/工作台源文件/);
});
test('Git ignores the local workbench while retaining deployable blog configuration',()=>{
  const fixture=fs.mkdtempSync(path.join(artifacts,'release-git-'));fs.copyFileSync(path.join(root,'.gitignore'),path.join(fixture,'.gitignore'));
  execFileSync('git',['init','--quiet'],{cwd:fixture,stdio:'pipe'});
  const privatePaths=['scripts/editor/plugin.mjs','scripts/editor/client.js','scripts/edit.mjs','scripts/tests/editor.test.mjs','.cache/text-editor-token','scripts/artifacts/text-edits/backup.json'];
  const ignored=execFileSync('git',['check-ignore','--no-index',...privatePaths],{cwd:fixture,encoding:'utf8'}).trim().split(/\r?\n/);
  assert.deepEqual(ignored,privatePaths);
  assert.throws(()=>execFileSync('git',['check-ignore','--no-index','src/config/text.json'],{cwd:fixture,stdio:'pipe'}),error=>error.status===1);
  fs.mkdirSync(path.join(fixture,'scripts/editor'),{recursive:true});fs.writeFileSync(path.join(fixture,'scripts/editor/plugin.mjs'),'private');
  execFileSync('git',['add','-f','scripts/editor/plugin.mjs'],{cwd:fixture,stdio:'pipe'});
  fs.mkdirSync(path.join(fixture,'dist'));fs.writeFileSync(path.join(fixture,'dist/index.html'),'<title>blog</title>');
  assert.throws(()=>checkRelease(fixture),/Git 正在跟踪/);
});
test('blog config can load without local editor files and never loads them on a public listener',async()=>{
  const fixture=fs.mkdtempSync(path.join(artifacts,'release-config-'));const missing=localTools(fixture);
  assert.equal(missing.available,false);await missing.plugin.configureServer({});
  fs.mkdirSync(path.join(fixture,'scripts/editor'),{recursive:true});fs.writeFileSync(path.join(fixture,'scripts/editor/plugin.mjs'),'throw new Error("must not import this")');
  const available=localTools(fixture);assert.equal(available.available,true);
  await available.plugin.configureServer({config:{server:{host:'0.0.0.0'}}});
});
