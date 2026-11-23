const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {classifyCampaign}=require('../site-analytics.js');
const pack=require('../content/organic-social-to-line-links-v20261123.json');

test('six distinct organic landing topics map to the current canonical website and real pages',()=>{
 assert.equal(pack.brand,'仙加味');
 assert.equal(pack.entries.length,6);
 assert.equal(pack.publication.do_not_create_or_publish_posts,true);
 assert.equal(pack.publication.require_human_or_valid_delegated_authorization,true);
 const codes=new Set();
 for(const entry of pack.entries){
   assert.match(entry.id,/^k-[a-z]+(?:-[a-z]+){0,4}-\d{2}$/);
   assert(!codes.has(entry.id));codes.add(entry.id);
   assert.match(entry.landing_path,/^[a-z0-9-]+\.html$/);
   assert(fs.existsSync(entry.landing_path),'Missing approved landing page: '+entry.landing_path);
   assert.equal(entry.landing_is_existing_official_page,true);
   assert.equal(entry.post_or_image_approved,false);
   assert(!/治療|預防疾病|改善疾病|關節|補氣|生津|膠原蛋白|鈣質|保證功效/.test(entry.theme+' '+entry.angle+' '+entry.visitor_intent));
 }
});

test('all eighteen share links are public-source UTMs recognized by the existing GA4 classifier',()=>{
 const urls=new Set();
 for(const entry of pack.entries){
  assert.deepEqual(Object.keys(entry.links).sort(),['facebook','instagram','threads']);
  for(const platform of ['facebook','instagram','threads']){
    const link=entry.links[platform];
    assert(!urls.has(link),'duplicated social campaign URL');
    urls.add(link);
    const url=new URL(link);
    assert.equal(url.origin,'https://ts15825868.github.io');
    assert.equal(url.pathname,'/xianjiawei/'+entry.landing_path);
    assert.deepEqual([...url.searchParams.keys()].sort(),['utm_campaign','utm_content','utm_medium','utm_source']);
    assert.deepEqual(classifyCampaign(url.searchParams),{
      campaign_source:platform,
      campaign_medium:'organic_social',
      campaign_name:'knowledge_202611',
      campaign_content:entry.id
    });
    assert.equal(url.hash,'');
    assert(!/[@]762jybnm|\b09\d{8}\b/.test(url.href));
  }
 }
 assert.equal(urls.size,18);
});

test('Instagram caption links are not misrepresented as directly clickable; clicks do not count as inquiries',()=>{
 assert.match(pack.placement.instagram,/不可直接點擊/);
 assert.match(pack.metrics,/不代表正式詢問／成交/);
 assert.equal(pack.privacy.allow_only_public_nonpersonal_utm,true);
 assert.equal(pack.no_new_paid_services,true);
});

test('brand story and recipes keep exact original LINE self-report without JavaScript',()=>{
 const pages=[['brand.html',1],['recipes.html',2]];
 for(const [file,count] of pages){
   const html=fs.readFileSync(file,'utf8');
   const anchors=[...html.matchAll(/<a\b[^>]*>/g)]
     .map(match=>match[0])
     .filter(tag=>tag.includes('data-line-message='));
   assert.equal(anchors.length,count,'Unexpected documented topic CTA count: '+file);
   for(const tag of anchors){
     const message=tag.match(/data-line-message="([^"]+)"/)?.[1];
     const href=tag.match(/href="([^"]+)"/)?.[1];
     assert.ok(message && href,'Missing no-script CTA fields on '+file);
     assert.equal(href,'https://line.me/R/oaMessage/%40762jybnm/?'+encodeURIComponent(message),
       'LINE static fallback must preserve topic-specific inquiry text');
     const parsed=new URL(href);
     assert.equal(parsed.hostname,'line.me');
     assert.ok(message.includes('仙加味') || message.includes('官網'),file);
   }
 }
});
