import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const base=JSON.parse(read('content/public-post-library.json'));
const assets=JSON.parse(read('content/public-asset-library.json'));
const formal=JSON.parse(read('data/formal-media-authority-v20260810.json'));
const responseFor=url=>{
  if(url.includes('content/public-post-library.json'))return new Response(JSON.stringify(base),{status:200,headers:{'content-type':'application/json'}});
  if(url.includes('content/public-asset-library.json'))return new Response(JSON.stringify(assets),{status:200,headers:{'content-type':'application/json'}});
  if(url.includes('data/formal-media-authority-v20260810.json'))return new Response(JSON.stringify(formal),{status:200,headers:{'content-type':'application/json'}});
  return new Response('not found',{status:404});
};
const nativeFetch=async input=>responseFor(typeof input==='string'?input:(input?.url||''));
globalThis.window={fetch:nativeFetch};
globalThis.document={readyState:'loading',querySelectorAll:()=>[],addEventListener:()=>{}};

// Current export deliberately avoids legacy bulk-generation layers. Old files may remain for history,
// but current runtime is core bank + product identity + semantic media + latest authority guard only.
for(const file of ['publishing-center-data-v16-actual-product-photos.js','publishing-center-data-v18-content-media-match.js','publishing-center-data-current-authority-guard.js'])vm.runInThisContext(read(file),{filename:file});

const response=await window.fetch('content/public-post-library.json?authority=current');
assert.equal(response.ok,true,'目前貼文母庫無法讀取');
const data=await response.json();
const posts=Array.isArray(data.posts)?data.posts:[];
const declared=Number(data?.counts?.total||posts.length);
assert.ok(posts.length>0,'目前貼文母庫不得為空');
assert.equal(posts.length,declared,'目前母庫宣告數量必須等於runtime實際數量');
const ids=posts.map(p=>String(p?.id||'').trim());
assert.ok(ids.every(Boolean),'目前貼文不得有空白ID');
assert.equal(new Set(ids).size,posts.length,'目前貼文ID必須唯一');
assert.ok(window.XJWActualProductPhotoAuthority,'未載入products-v3產品身份參考層');
assert.ok(window.XJWPostBankV18,'未載入v18圖文語意媒體配對層');
assert.ok(window.XJWCurrentPostMediaAuthority,'未載入目前公開資產權威守門');

const guard=window.XJWCurrentPostMediaAuthority;
assert.equal(guard.validateFormalCopy({copy:'龜鹿湯塊75g （2兩）／盒｜8塊裝｜每塊約9.375g'}),'','正式湯塊每塊重量不得被舊守門誤擋');
assert.equal(guard.validateFormalCopy({copy:'龜鹿膠600g （1斤）／盒｜32塊裝｜每塊約18.75 g'}),'','正式龜鹿膠每塊重量不得被舊守門誤擋');
assert.match(guard.validateFormalCopy({copy:'龜鹿湯塊600g／盒'}),/退役容量/,'龜鹿湯塊錯誤600g仍必須被擋');
assert.match(guard.validateFormalCopy({copy:'龜鹿膏每日早上及下午各一小匙'}),/退役使用方式/,'龜鹿膏舊固定時段仍必須被擋');

const retired=new Set((assets.assets||[]).filter(a=>['deprecated-reference-only','preflight-rejected-reference-only','superseded-reference-only'].includes(String(a.status||''))).map(a=>String(a.path||'').replace(/^\//,'').split(/[?#]/)[0]));
const normalize=v=>String(v||'').replace(/^https?:\/\/[^/]+\/xianjiawei\//i,'').replace(/^\//,'').split(/[?#]/)[0];
const active=posts.filter(p=>p&&p.status!=='published'&&p.status!=='archived'&&!p.campaign_hold);
for(const post of active){
  const image=String(post.image_url||'').trim(),norm=normalize(image),serialized=JSON.stringify(post);
  assert.ok(image,`${post.id} 目前正式候選仍缺圖`);
  assert.notEqual(post.image_status,'needs_generation',`${post.id} 目前正式候選仍標記需重生成`);
  assert.notEqual(post.publish_allowed,true,`${post.id} 待審核內容不得直接發布`);
  assert.notEqual(post.schedule_enabled,true,`${post.id} 待審核內容不得直接排程`);
  assert.doesNotMatch(image,/\/images\/products-v2\//i,`${post.id} 不得使用products-v2`);
  if(retired.has(norm))assert.fail(`${post.id} 仍沿用退役圖片：${norm}`);
  assert.doesNotMatch(serialized,/30\s*cc.{0,40}(玻璃瓶|瓶裝|[／/]\s*瓶)/i,`${post.id} 仍有30cc瓶型舊稱`);
}

for(const id of ['POST-PRODUCT-OVERVIEW','POST-CHOOSE','POST-COMBO','POST-GUIDE','POST-CHOOSE-BY-HABIT']){
  const post=posts.find(p=>p.id===id);assert.ok(post,`缺少${id}`);assert.ok(String(post.image_url||'').trim(),`${id} 必須完成配圖`);assert.notEqual(post.image_status,'needs_generation',`${id} 不得再是needs_generation`);
}
for(const id of ['POST-WEATHER-HOT','POST-WEATHER-TEMP','POST-WEATHER-RAIN']){
  const post=posts.find(p=>p.id===id);assert.ok(post,`缺少${id}`);assert.equal(post.live_check_required,true,`${id} 必須保留當日天氣確認`);assert.equal(post.weather_review_required,true,`${id} 必須保留發布前天氣審核`);assert.doesNotMatch(String(post.copy||''),/此類貼文需確認|不自動排程|待審核|人工審核/,`${id} 顧客文案不得混入內部作業文字`);
}

const reusable=image=>/customer-display-v20260812|products-v3|trial-poster-small-boss-official-v20260814/.test(image);
const seen=new Map();
for(const post of active){const image=normalize(post.image_url);if(!image||reusable(image))continue;if(seen.has(image))assert.fail(`生活／情境主圖重複：${post.id} 與 ${seen.get(image)} -> ${image}`);seen.set(image,post.id)}
assert.equal(Number(data?.counts?.missing_asset_bindings||0),0,'目前runtime不應再有缺圖綁定');
assert.equal(Number(data?.counts?.known_image_copy_mismatches||0),0,'目前runtime不應再有已知圖文不符');
assert.equal(Number(data?.counts?.duplicate_primary_images||0),0,'目前runtime不應再有生活／情境主圖重複');
console.log('PASS current post runtime: core-only export + v18 semantic media + latest formal specs + weather freshness metadata + no active missing/mismatched/duplicate lifestyle images');