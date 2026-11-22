const {test}=require('node:test');
const assert=require('node:assert/strict');
const {classifyClick,classifyCampaign,resolveCampaignAttribution}=require('../site-analytics.js');
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
 assert(fs.readFileSync('site.js','utf8').includes('site-analytics.js?v=20261123-organic-funnel-attribution-v1'));
});

test('knowledge attribution is limited to supported organic social sources and public content codes',()=>{
 const read = query => classifyCampaign(new URLSearchParams(query));
 const primary = 'utm_source=threads&utm_medium=organic_social&utm_campaign=knowledge_202611';
 const campaign = {campaign_source:'threads',campaign_medium:'organic_social',campaign_name:'knowledge_202611'};
 assert.deepEqual(read(primary+'&utm_content=k-tea-steep-01'), {...campaign,campaign_content:'k-tea-steep-01'});
 for (const value of ['customer%40example.test','123456789','k-jane-doe-123','not-a-public-code']) {
  assert.deepEqual(read(primary+'&utm_content='+value), campaign);
 }
 assert.deepEqual(read(primary+'&utm_content=k-tea-steep-01&utm_content=k-tea-steep-02'),campaign);
 assert.deepEqual(read(primary.replace('202611','202613')), {campaign_source:'threads',campaign_medium:'organic_social'});
 assert.deepEqual(read(primary.replace('threads','line')), {campaign_source:'line',campaign_medium:'organic_social'});
 assert.deepEqual(read(primary.replace('organic_social','referral')), {campaign_source:'threads',campaign_medium:'referral'});
 assert.deepEqual(read('utm_source=facebook&utm_medium=organic_social&utm_campaign=trial'), {campaign_source:'facebook',campaign_medium:'organic_social',campaign_name:'trial'});
 assert.deepEqual(read('utm_source=chatgpt.com'), {campaign_source:'chatgpt.com',campaign_medium:'referral'});
});


test('organic campaign attribution is retained for a 30-minute same-tab browse without personal data',()=>{
 const values=new Map();
 const storage={setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k)||null,removeItem:k=>values.delete(k)};
 const now=1795420800000;
 const query='utm_source=threads&utm_medium=organic_social&utm_campaign=knowledge_202611&utm_content=k-tea-steep-01';
 const expected={campaign_source:'threads',campaign_medium:'organic_social',campaign_name:'knowledge_202611',campaign_content:'k-tea-steep-01'};
 assert.deepEqual(resolveCampaignAttribution(new URLSearchParams(query),storage,now),expected);
 assert.deepEqual(resolveCampaignAttribution(new URLSearchParams(''),storage,now+2*60000),expected);
 assert.deepEqual(resolveCampaignAttribution(new URLSearchParams(''),storage,now+31*60000),{});
 assert.equal(values.size,0);
});
test('invalid or personal campaign identifiers cannot inherit the previous social source',()=>{
 const db=new Map();
 const storage={setItem:(k,v)=>db.set(k,v),getItem:k=>db.get(k)||null,removeItem:k=>db.delete(k)};
 const now=1795420800000;
 resolveCampaignAttribution(new URLSearchParams('utm_source=facebook&utm_medium=organic_social&utm_campaign=knowledge_202611&utm_content=k-first-choice-01'),storage,now);
 assert.deepEqual(resolveCampaignAttribution(new URLSearchParams('utm_source=untrusted&utm_content=customer%40mail.test'),storage,now+1000),{});
 assert.deepEqual(resolveCampaignAttribution(new URLSearchParams(''),storage,now+1200),{});
 const result=resolveCampaignAttribution(new URLSearchParams('utm_source=instagram&utm_medium=organic_social&utm_campaign=knowledge_202611&utm_content=phone-0912345678'),storage,now+2000);
 assert.deepEqual(result,{campaign_source:'instagram',campaign_medium:'organic_social',campaign_name:'knowledge_202611'});
 assert(!JSON.stringify([...db.values()]).includes('0912345678'));
});
test('blocked session storage does not break GA4 or expose raw UTM data',()=>{
 const blocked={getItem:()=>{throw Error('denied')},setItem:()=>{throw Error('denied')},removeItem:()=>{throw Error('denied')}};
 const valid=new URLSearchParams('utm_source=facebook&utm_medium=organic_social&utm_campaign=knowledge_202611&utm_content=k-first-choice-01');
 assert.deepEqual(resolveCampaignAttribution(valid,blocked),classifyCampaign(valid));
 assert.deepEqual(resolveCampaignAttribution(new URLSearchParams(''),blocked),{});
 const script=fs.readFileSync('site-analytics.js','utf8');
 assert(script.includes('gtag("event", name, { ...attribution, ...parameters, send_to: measurementId })'));
 assert(script.includes('const campaignTtlMs = 30 * 60 * 1000'));
});
