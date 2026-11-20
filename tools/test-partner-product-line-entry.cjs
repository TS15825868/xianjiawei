const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const all=JSON.parse(read('partner-catalog.json')).products;
const approved=all.filter(p=>p.public===true);
const LINE='https://line.me/R/oaMessage/%40762jybnm/?';
test('all seven approved public partner products have the exact opt-in LINE source on two CTAs',()=>{
  assert.equal(approved.length,7);
  for(const p of approved){
    const message='我從仙加味官網'+p.displayName+'商品頁進來，想了解'+p.displayName+'的規格與購買方式。';
    const url=LINE+encodeURIComponent(message);
    const page=read(p.page);
    assert.equal(page.split('data-line-message="'+message+'" href="'+url+'"').length-1,2,p.id);
    assert(!page.includes('href="https://lin.ee/sHZW7NkR"'),p.id+' generic entry remains');
    assert(page.includes('<h1>'+p.displayName+'</h1>'),p.id+' name');
    assert(page.includes('site.js?'),p.id+' normal runtime');
    const target=new URL(url);
    assert.equal(target.protocol,'https:');
    assert.equal(target.hostname,'line.me');
    assert.equal(target.pathname,'/R/oaMessage/%40762jybnm/');
    assert.equal(decodeURIComponent(target.search.slice(1)),message);
    assert(read('sitemap.xml').includes(p.page+'</loc><lastmod>2026-11-20</lastmod>'),p.id+' lastmod');
  }
});
test('deferred products stay deferred, original own brand and trial links remain',()=>{
  const publicIds=new Set(approved.map(p=>p.id));
  assert.equal(publicIds.size,7);
  for(const p of all.filter(p=>p.public!==true))assert(!publicIds.has(p.id));
  assert(read('tools/test-website-entry-source.cjs').includes('four product pages preserve exact opt-in source'));
  assert(read('trial.html').includes('龜鹿飲30cc試喝組'));
});
