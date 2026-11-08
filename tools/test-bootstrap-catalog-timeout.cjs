'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const src=fs.readFileSync(require('node:path').join(__dirname,'../site-core-v410.js'),'utf8');
const helper=src.slice(src.indexOf('async function loadPartnerCatalog('),src.indexOf('async function loadData('));
async function check(fetch,expected){
 const load=vm.runInNewContext(helper+';loadPartnerCatalog',{fetch,AbortController,setTimeout,clearTimeout,UX_VERSION:'test'});
 if(expected==='timeout')await assert.rejects(load(15),/timeout/);
 else assert.deepEqual(JSON.parse(JSON.stringify(await load(100))),expected);
}
(async()=>{
 await check(async()=>({ok:true,json:async()=>({products:[]})}),{products:[]});
 await check(()=>new Promise(()=>{}),'timeout');
 await check(async()=>({ok:true,json:()=>new Promise(()=>{})}),'timeout');
 const init=src.slice(src.indexOf('async function initSite()'),src.indexOf('function ensureUxStyle()'));
 let release;const waiting=new Promise(r=>{release=r});const events=[];const window={};
 const ctx={window,document:{body:{classList:{add:()=>events.push('ready-class')}}},console,loadData:()=>waiting};
 for(const name of ['buildShell','hydrateStaticFields','renderCurrentPage','renderMobileCompareCards','bindGlobalEvents','initReveal','renderFloatingLineCta'])ctx[name]=()=>events.push(name);
 const run=vm.runInNewContext(init+';initSite',ctx);const first=run();await run();
 assert.equal(window.__XJW_SITE_INITIALIZED__,undefined);assert.equal(window.__XJW_SITE_INITIALIZING__,true);
 assert.deepEqual(events,[]);release();await first;
 assert.equal(window.__XJW_SITE_INITIALIZED__,true);assert.equal(window.__XJW_SITE_INITIALIZING__,false);
 assert.ok(events.indexOf('buildShell')<events.indexOf('ready-class'));
 assert.equal(events.filter(x=>x==='buildShell').length,1);
 console.log('PASS catalog success / stalled fetch / stalled body; shell readiness and duplicate initialization');
})().catch(e=>{console.error(e);process.exitCode=1});
