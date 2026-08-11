import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const base=JSON.parse(read('content/public-post-library.json'));
const assets=JSON.parse(read('content/public-asset-library.json'));
const formal=JSON.parse(read('data/formal-media-authority-v20260810.json'));

const responseFor=(url)=>{
  if(url.includes('content/public-post-library.json'))return new Response(JSON.stringify(base),{status:200,headers:{'content-type':'application/json'}});
  if(url.includes('content/public-asset-library.json'))return new Response(JSON.stringify(assets),{status:200,headers:{'content-type':'application/json'}});
  if(url.includes('data/formal-media-authority-v20260810.json'))return new Response(JSON.stringify(formal),{status:200,headers:{'content-type':'application/json'}});
  return new Response('not found',{status:404});
};
const nativeFetch=async input=>responseFor(typeof input==='string'?input:(input?.url||''));

globalThis.window={fetch:nativeFetch};
globalThis.document={readyState:'loading',querySelectorAll:()=>[],addEventListener:()=>{}};

// Compatibility assembly filenames are implementation layers, not release-version requirements.
const layers=[
  'publishing-center-data-v6.js','publishing-center-data-v7.js','publishing-center-data-v8-fixes.js',
  'publishing-center-data-v10-published-locks.js','publishing-center-data-v11-campaign-holds.js',
  'publishing-center-data-v12-auto-candidates.js','publishing-center-data-v13-character-scenes.js',
  'publishing-center-data-v14-boss-daily.js','publishing-center-data-v15-companions.js',
  'publishing-center-data-v16-actual-product-photos.js','publishing-center-data-v17-retired-composite-guard.js',
  'publishing-center-data-current-authority-guard.js'
];
for(const file of layers)vm.runInThisContext(read(file),{filename:file});

const response=await window.fetch('content/public-post-library.json?authority=current');
assert.equal(response.ok,true,'目前貼文母庫無法讀取');
const data=await response.json();
const posts=Array.isArray(data.posts)?data.posts:[];
const declared=Number(data?.counts?.total||base?.counts?.total||posts.length);
assert.ok(posts.length>0,'目前貼文母庫不得為空');
if(Number.isFinite(declared)&&declared>0)assert.equal(posts.length,declared,`目前母庫宣告數量${declared}與runtime實際${posts.length}不一致`);
const ids=posts.map(post=>String(post?.id||'').trim());
assert.equal(new Set(ids).size,posts.length,'目前貼文ID必須唯一');
assert.ok(ids.every(Boolean),'目前貼文不得有空白ID');

const productAuthority=window.XJWActualProductPhotoAuthority;
assert.ok(productAuthority,'未載入目前產品圖片權威');
const productUrls=Object.values(productAuthority.map||{}).map(String);
assert.equal(productUrls.length,6,'正式產品圖片權威必須維持六項');
for(const url of productUrls){
  assert.match(url,/\/images\/products-v3\//,'產品權威必須使用products-v3');
  assert.doesNotMatch(url,/products-v2/,'產品權威不得回退products-v2');
}
assert.ok(window.XJWCurrentPostMediaAuthority,'未載入目前公開資產權威守門');

const retired=new Set((assets.assets||[])
  .filter(asset=>['deprecated-reference-only','preflight-rejected-reference-only','superseded-reference-only'].includes(String(asset.status||'')))
  .map(asset=>String(asset.path||'').split(/[?#]/)[0].replace(/^\//,''))
  .filter(Boolean));
const approvedFormal=new Set([
  ...(formal.products||[]).filter(p=>p.status==='approved_display').map(p=>String(p.dm||'')),
  ...(formal.trial?.status==='approved_display'?[String(formal.trial.image||'')]:[])
].map(value=>value.replace(/^https?:\/\/[^/]+\/xianjiawei\//i,'').replace(/^\//,'').split(/[?#]/)[0]).filter(Boolean));
const normalize=value=>String(value||'').replace(/^https?:\/\/[^/]+\/xianjiawei\//i,'').replace(/^\//,'').split(/[?#]/)[0];
const isProtected=post=>post.status==='published'||post.status==='archived'||post.prevent_republish===true||post.do_not_republish===true;
const isHold=post=>post.campaign_hold===true||post.status==='campaign_hold'||Boolean(post.hold_until);
const isRegen=post=>post.image_status==='needs_generation'||post.requires_image_generation===true||/regeneration-required|chatgpt.*required|chatgpt_handoff/i.test(String(post.candidate_generation_mode||post.regeneration_mode||''));
const isBinarySync=post=>post.image_status==='needs_binary_sync'||post.media_state==='needs_binary_sync';

let needsGeneration=0,needsBinarySync=0,publishedLocked=0,campaignHold=0,candidateReview=0,otherSafe=0;
for(const post of posts){
  const image=String(post?.image_url||'').trim();
  const normalized=normalize(image);
  const serialized=JSON.stringify(post);
  const protectedPost=isProtected(post);
  const hold=isHold(post);
  const regen=!protectedPost&&!hold&&isRegen(post);
  const binarySync=!protectedPost&&!hold&&!regen&&isBinarySync(post);

  assert.doesNotMatch(image,/\/images\/products-v2\//i,`${post.id} 仍引用products-v2退役產品圖`);
  if(!protectedPost){
    assert.doesNotMatch(serialized,/30\s*cc.{0,40}(玻璃瓶|瓶裝|[／/]\s*瓶)/i,`${post.id} 仍出現30cc瓶型舊稱`);
    assert.doesNotMatch(serialized,/龜鹿湯塊.{0,80}(300\s*g|600\s*g)/i,`${post.id} 龜鹿湯塊仍出現舊容量`);
    if(normalized&&retired.has(normalized))assert.fail(`${post.id} 仍沿用目前資產庫已退役圖片：${normalized}`);
    if(/\/images\/brand\/line-oa\//i.test(image))assert.fail(`${post.id} 正式候選不得直接混用LINE OA專用角色圖`);
    if(/\/images\/dm-(?:final|approved-v\d+)\//i.test(image)&&!approvedFormal.has(normalized))assert.fail(`${post.id} 使用DM目錄圖片但不在目前formal authority核准清單：${normalized}`);
  }

  if(protectedPost){
    publishedLocked++;
    assert.notEqual(post.publish_allowed,true,`${post.id} 已發布／防重發鎖定不得重新允許發布`);
    continue;
  }
  if(hold){
    campaignHold++;
    assert.notEqual(post.publish_allowed,true,`${post.id} 活動冷卻不得允許發布`);
    assert.notEqual(post.schedule_enabled,true,`${post.id} 活動冷卻不得啟用排程`);
    continue;
  }
  if(regen){
    needsGeneration++;
    assert.equal(image,'',`${post.id} 需重生成時舊image_url必須清空`);
    assert.notEqual(post.publish_allowed,true,`${post.id} 需重生成不得允許發布`);
    assert.notEqual(post.schedule_enabled,true,`${post.id} 需重生成不得允許排程`);
    assert.ok(String(post.image_prompt||'').trim(),`${post.id} 需重生成必須保留可執行image_prompt`);
    assert.ok(String(post.image_review_reason||'').trim(),`${post.id} 需重生成必須有退件／審核理由`);
    continue;
  }
  if(binarySync){
    needsBinarySync++;
    assert.notEqual(post.publish_allowed,true,`${post.id} 原圖待同步時不得發布`);
    assert.notEqual(post.schedule_enabled,true,`${post.id} 原圖待同步時不得排程`);
    continue;
  }
  if(['candidate-review-required','official-reference-pending-layout-review','pending_review'].includes(String(post.image_status||post.status||''))){
    candidateReview++;
    assert.notEqual(post.publish_allowed,true,`${post.id} 待審核候選不得直接發布`);
    assert.notEqual(post.schedule_enabled,true,`${post.id} 待審核候選不得直接排程`);
    continue;
  }
  // Current catalogs may contain additional explicitly safe draft states; they are allowed only if not publishable/scheduled.
  otherSafe++;
  assert.notEqual(post.publish_allowed,true,`${post.id} 未分類草稿狀態不得直接發布`);
}

assert.equal(posts.length,publishedLocked+campaignHold+needsGeneration+needsBinarySync+candidateReview+otherSafe,'目前安全狀態分類總數必須等於runtime實際篇數');
assert.ok(approvedFormal.size>=7,'目前formal authority應包含六產品＋試喝核准媒體');

console.log('PASS current post runtime capability audit',JSON.stringify({
  total:posts.length,publishedLocked,campaignHold,needsGeneration,needsBinarySync,candidateReview,otherSafe,
  productAuthority:'products-v3',currentAssetGuard:true,currentFormalMediaCount:approvedFormal.size
},null,2));
