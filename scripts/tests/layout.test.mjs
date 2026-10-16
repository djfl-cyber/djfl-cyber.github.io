import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validatePage,pageCSS,nodeProps,writeBinding,effectiveNode,componentKind} from '../../src/lib/layout-model.mjs';
import {directorySource,directoryEntries} from '../../src/lib/directory-model.mjs';
const home=JSON.parse(fs.readFileSync(new URL('../../src/config/layouts/home.json',import.meta.url)));
test('page model rejects duplicate IDs, executable CSS and future schemas',()=>{assert.equal(validatePage(home).id,'home');for(const mutate of [d=>d.schemaVersion=99,d=>d.root.children.push(d.root.children[0]),d=>d.root.style={background:'url(file:///C:/private)'},d=>d.root.style={color:'red}</style><script>alert(1)</script>'},d=>d.root.props={tag:'script'},d=>d.root.bindings={text:'site.__proto__.x'}]){const d=structuredClone(home);mutate(d);assert.throws(()=>validatePage(d));}});
test('responsive styles preserve base values and serialize safe CSS',()=>{const d=structuredClone(home);d.root.style={padding:20,color:'#123456'};d.root.responsive={mobile:{style:{padding:10}}};assert.equal(effectiveNode(d.root,'mobile').style.color,'#123456');const css=pageCSS(d);assert.ok(css.includes('padding:20px'));assert.ok(css.includes('@media(max-width:639px)'));assert.ok(css.includes('padding:10px'));});
test('binding edits have one content source and reject prototype writes',()=>{const settings={home:{hero:{title:'before'}}};const node={props:{tag:'h1'},bindings:{text:'home.hero.title'}};writeBinding(settings,'home.hero.title','after');assert.equal(nodeProps(node,settings).text,'after');assert.equal(node.props.text,undefined);assert.throws(()=>writeBinding(settings,'home.__proto__.x',1));});
test('switching a free canvas to flow on mobile resets position and height rules',()=>{const d={schemaVersion:1,id:'test',title:'test',route:'/',root:{id:'parent',type:'container',layout:{mode:'free',height:500},responsive:{mobile:{layout:{mode:'flow'}}},children:[{id:'child',type:'text',props:{text:'x'}}]}};const css=pageCSS(d);assert.ok(css.includes('height:500px'));const mobile=css.slice(css.indexOf('@media(max-width:639px)'));assert.ok(mobile.includes('height:auto'));assert.ok(mobile.includes('[data-layout-node="parent"]>[data-layout-node="child"]{position:relative}'));});
test('background masks are serialized from validated colors and opacity',()=>{const d=structuredClone(home);d.root.props.backgroundMask={color:'#123456',opacity:.4};d.root.style={backgroundImage:'url("/assets/background.jpg")'};assert.ok(pageCSS(d).includes('linear-gradient(rgba(18,52,86,0.4),rgba(18,52,86,0.4)),url("/assets/background.jpg")'));d.root.props.backgroundMask.color='red}</style>';assert.throws(()=>pageCSS(d));});

test('text boxes grow for multiline content while explicitly fixed frames retain their height',()=>{
 const d={schemaVersion:1,id:'test',title:'test',route:'/',root:{id:'title',type:'text',props:{text:'第一行\n第二行'},style:{width:339,height:126},responsive:{mobile:{style:{height:80}}}}};
 const css=pageCSS(d);assert.match(css,/height:auto/);assert.match(css,/min-height:126px/);assert.match(css,/white-space:pre-wrap/);assert.match(css,/overflow-wrap:anywhere/);assert.match(css,/max-width:100%/);assert.match(css,/min-height:80px/);
 d.root.props.textSizing='fixed';assert.match(pageCSS(d),/height:126px/);assert.doesNotMatch(pageCSS(d),/height:auto/);
});

test('directory layers validate data sources and preserve original entry indexes through sorting and hiding',()=>{
 const d=structuredClone(home);d.root.children.push({id:'directory',type:'directory',props:{source:'friends'}});assert.equal(validatePage(d),d);
 d.root.children.at(-1).props.source='site';assert.throws(()=>validatePage(d));
 assert.equal(directorySource({id:'friends-content',type:'content'}),'friends');
 const settings={friends:[{name:'晚',order:4},{name:'隐藏',enabled:false,order:0},{name:'早',order:1}]};
 assert.deepEqual(directoryEntries(settings,'friends').map(i=>[i.name,i.index]),[['早',2],['晚',0]]);
 assert.deepEqual(directoryEntries(settings,'friends',{includeHidden:true}).map(i=>i.index),[1,2,0]);
});

test('profile layers and legacy about content slots share the same component kind',()=>{
 assert.equal(componentKind({id:'about-content',type:'content'}),'profile');assert.equal(componentKind({id:'some-content',type:'content'}),'content');assert.equal(componentKind({id:'copied-profile',type:'profile'}),'profile');
 const d=structuredClone(home);d.root.children.push({id:'profile',type:'profile'});assert.equal(validatePage(d),d);
});
