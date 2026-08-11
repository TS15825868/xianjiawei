import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const base=JSON.parse(read('content/public-post-library.json'));
const assets=JSON.parse(read('content/public-asset-library.json'));

const responseFor=(url)=>{
  if(url.includes('content/public-post-library.json'))return new Response(JSON.stringify(base),{status:200,headers:{'content-type':'application/json'}});
  if(url.includes('content/public-asset-library.json'))return new Response(JSON.stringify(assets),{status:200,headers:{'content-type':'application/json'}});
  return new Response('not found',{status:404});
};
const nativeFetch=async input=>responseFor(typeof input==='string'?input:(input?.url||''));

globalThis.window={fetch:nativeFetch};
globalThis.document={readyState:'loading',querySelectorAll:()=>[],addEventListener:()=>{}};

const layers=[
  'publishing-center-data-v6.js',
  'publishing-center-data-v7.js',
  'publishing-center-data-v8-fixes.js',
  'publishing-center-data-v10-published-locks.js',
  'publishing-center-data-v11-campaign-holds.js',
  'publishing-center-data-v12-auto-candidates.js',
  'publishing-center-data-v13-character-scenes.js',
  'publishing-center-data-v14-boss-daily.js',
  'publishing-center-data-v15-companions.js',
  'publishing-center-data-v16-actual-product-photos.js',
  'publishing-center-data-v17-retired-composite-guard.js',
  'publishing-center-data-current-authority-guard.js'
];
for(const file of layers)vm.runInThisContext(read(file),{filename:file});

const response=await window.fetch('content/public-post-library.json?authority=current');
assert.equal(response.ok,true,'runtime500 母庫無法讀取');
const data=await response.json();
const posts=Array.isArray(data.posts)?data.posts:[];
assert.equal(posts.length,500,`runtime500 必須剛好500篇，目前${posts.length}`);
const ids=posts.map(post=>String(post?.id||'').trim());
assert.equal(new Set(ids).size,500,'runtime500 貼文ID必須唯一');
assert.ok(ids.every(Boolean),'runtime500 不得有空白ID');

const productAuthority=window.XJWActualProductPhotoAuthority;
assert.ok(productAuthority,'未載入目前產品圖片權威');
const productUrls=Object.values(productAuthority.map||{}).map(String);
assert.equal(productUrls.length,6,'正式產品圖片權威必須剛好六項');
for(const url of productUrls){
  assert.match(url,/\/images\/products-v3\//,'產品權威必須使用products-v3');
  assert.doesNotMatch(url,/products-v2/,'產品權威不得回退products-v2');
}
assert.ok(window.XJWCurrentPostMediaAuthority,'未載入目前公開資產權威守門');

const retired=new Set(
  (assets.assets||[])
    .filter(asset=>['deprecated-reference-only','preflight-rejected-reference-only','superseded-reference-only'].includes(String(asset.status||'')))
    .map(asset=>String(asset.path||'').split(/[?#]/)[0].replace(/^\//,''))
    .filter(Boolean)
);
const normalize=value=>String(value||'').replace(/^https?:\/\/[^/]+\/xianjiawei\//i,'').replace(/^\//,'').split(/[?#]/)[0];
let needsGeneration=0,publishedLocked=0,campaignHold=0,candidateReview=0;
for(const post of posts){
  const image=String(post?.image_url||'').trim();
  const normalized=normalize(image);
  const serialized=JSON.stringify(post);
  assert.doesNotMatch(image,/\/images\/products-v2\/|\/images\/dm-final\//i,`${post.id} 仍引用舊產品圖／舊DM`);
  assert.doesNotMatch(image,/\/images\/dm-approved-v20260810\/guilu-drink-30cc\.webp/i,`${post.id} 仍引用內嵌30cc／瓶字樣的隔離DM`);
  assert.doesNotMatch(serialized,/30\s*cc.{0,40}(玻璃瓶|瓶裝|[／/]\s*瓶)/i,`${post.id} 仍出現30cc瓶型舊稱`);
  assert.doesNotMatch(serialized,/龜鹿湯塊.{0,80}(300\s*g|600\s*g)/i,`${post.id} 龜鹿湯塊仍出現舊容量`);
  if(normalized&&retired.has(normalized)&&post.status!=='published'&&post.status!=='archived')assert.fail(`${post.id} 仍沿用目前資產庫已退役圖片：${normalized}`);
  if(/\/images\/brand\/line-oa\//i.test(image))assert.fail(`${post.id} 正式候選不得直接混用LINE OA專用角色圖`);

  const regen=post.image_status==='needs_generation'||post.requires_image_generation===true||/regeneration-required|chatgpt.*required|chatgpt_handoff/i.test(String(post.candidate_generation_mode||post.regeneration_mode||''));
  if(regen){
    needsGeneration++;
    assert.equal(image,'',`${post.id} 需重生成時舊image_url必須清空`);
    assert.notEqual(post.publish_allowed,true,`${post.id} 需重生成不得允許發布`);
    assert.notEqual(post.schedule_enabled,true,`${post.id} 需重生成不得允許排程`);
    assert.ok(String(post.image_prompt||'').trim(),`${post.id} 需重生成必須保留可執行image_prompt`);
    assert.ok(String(post.image_review_reason||'').trim(),`${post.id} 需重生成必須有退件／審核理由`);
  }
  if(post.status==='published'||post.prevent_republish===true||post.do_not_republish===true){
    publishedLocked++;
    assert.notEqual(post.publish_allowed,true,`${post.id} 已發布鎖定不得重新允許發布`);
  }else if(post.campaign_hold===true||post.status==='campaign_hold'||post.hold_until){
    campaignHold++;
    assert.notEqual(post.publish_allowed,true,`${post.id} 活動冷卻不得允許發布`);
  }else if(['candidate-review-required','official-reference-pending-layout-review'].includes(String(post.image_status||''))){
    candidateReview++;
    assert.ok(image,`${post.id} 待審核候選必須有圖片`);
    assert.notEqual(post.publish_allowed,true,`${post.id} 待審核候選不得直接發布`);
  }
}

assert.equal(posts.filter(post=>post.id==='XJW-TRIAL-001').length,1,'正式試喝已發布紀錄必須保留且唯一');
assert.ok(needsGeneration>0,'目前不合格圖應保留待重生成／待新ZIP替換的安全狀態，不能假裝全部完成');
assert.equal(posts.length,publishedLocked+campaignHold+needsGeneration+candidateReview,'500篇必須全部落在已發布鎖定、活動冷卻、需重生成或待審核安全狀態');

console.log('PASS runtime500 capability audit',JSON.stringify({
  total:posts.length,
  publishedLocked,
  campaignHold,
  needsGeneration,
  candidateReview,
  productAuthority:'products-v3',
  currentAssetGuard:true
},null,2));
