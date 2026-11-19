const {test}=require('node:test');
const assert=require('node:assert/strict');
const {classifyClick}=require('../site-analytics.js');
const fs=require('node:fs');
const line=message=>new URL('https://line.me/R/oaMessage/%40762jybnm/?'+encodeURIComponent(message));
test('current trial, historical trial, and opt-in referral are trial clicks, not orders',()=>{
 for(const m of ['我想申請龜鹿飲30cc試喝組。','我從仙加味官網試喝頁進來，想申請龜鹿飲30cc試喝組。','我想申請試喝，請協助我從試喝方案開始。'])assert.deepEqual(classifyClick(line(m),false,false),{name:'trial_click',parameters:{entry_variant:'standard'}});
 assert.deepEqual(classifyClick(line('我是經親友介紹認識仙加味，想申請龜鹿飲30cc試喝組。'),false,false),{name:'trial_click',parameters:{entry_variant:'referral'}});
});
test('exact destination and B2B boundary; unrelated text remains a general click',()=>{
 assert.deepEqual(classifyClick(line('我想了解龜鹿飲30cc玻璃罐的價格與目前方案。'),false,false),{name:'line_click'});
 assert.deepEqual(classifyClick(line('我從仙加味官網合作頁進來，想進行商家合作。'),true,false),{name:'b2b_click'});
 assert.deepEqual(classifyClick(new URL('https://lin.ee/sHZW7NkR'),false,false),{name:'line_click'});
 assert.equal(classifyClick(new URL('https://line.me/R/oaMessage/%40other/?hello'),true,false),null);
 assert.equal(classifyClick(new URL('https://other.invalid/R/oaMessage/%40762jybnm/?hello'),true,false),null);
 assert.deepEqual(classifyClick(new URL('https://line.me/R/oaMessage/%40762jybnm/?%ZZ'),false,false),{name:'line_click'});
 assert.deepEqual(classifyClick(line('我是經親友介紹認識仙加味，想申請龜鹿飲30cc試喝組。其他'),false,false),{name:'line_click'});
});
test('site link and guide click are separate; no URL or customer text emitted',()=>{
 assert.deepEqual(classifyClick(new URL('https://ts15825868.github.io/xianjiawei/trial.html?utm_source=facebook'),false,false),{name:'trial_page_click'});
 assert.deepEqual(classifyClick(null,false,true),{name:'guide_filter_click'});
 assert.equal(classifyClick(null,false,false),null);
 const result=classifyClick(line('offline arbitrary data'),false,false);
 assert.deepEqual(result,{name:'line_click'});
});
test('browser listener uses fixed classification, approved display names and cache update',()=>{
 const s=fs.readFileSync('site-analytics.js','utf8');
 assert(s.includes('track(result.name, result.parameters)'));
 assert(s.includes('product.displayName || product.name'));
 assert(s.includes('entry.page || entry.detailPage'));
 assert(fs.readFileSync('site.js','utf8').includes('site-analytics.js?v=20261120-trial-events-v2'));
});
