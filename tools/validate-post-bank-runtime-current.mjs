import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root=new URL('../',import.meta.url);
const read=path=>fs.readFileSync(new URL(path,root),'utf8');
const base=JSON.parse(read('content/public-post-library.json'));
const assets=JSON.parse(read('content/public-asset-library.json'));
const formal=JSON.parse(read('data/formal-media-authority-v20260810.json'));
const CURRENT_30='每日 1–2 罐';
const DEFERRED=/柒玄茶|龜鹿調飲粉|qixuan-guilu-drink-powder/i;
const responseFor=url=>{
  if(url.includes('content/public-post-library.json'))return new Response(JSON.stringify(base),{status:200,headers:{'content-type':'application/json'}});
  if(url.includes('content/public-asset-library.json'))return new Response(JSON.stringify(assets),{status:200,headers:{'content-type':'application/json'}});
  if(url.includes('data/formal-media-authority-v20260810.json'))return new Response(JSON.stringify(formal),{status:200,headers:{'content-type':'application/json'}});
  return new Response('not found',{status:404});
};
const nativeFetch=async input=>responseFor(typeof input==='string'?input:(input?.url||''));
globalThis.window={fetch:nativeFetch};
globalThis.document={readyState:'loading',querySelectorAll:()=>[],addEventListener:()=>{}};
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
assert.ok(window.XJWActualProductPhotoAuthority,'未載入產品身份參考層');
assert.ok(window.XJWPostBankV18,'未載入圖文語意媒體配對層');
assert.ok(window.XJWCurrentPostMediaAuthority,'未載入目前公開資產權威守門');

const auth=data.productAuthority||{};
assert.equal(auth.textAuthority,'public-product-master.json','目前貼文文字權威不是public-product-master.json');
assert.equal(auth.knowledgeProducts,6,'目前公開貼文產品必須為六項');
assert.equal(auth.approvedMediaProducts,6,'目前核准產品媒體必須為六項');
assert.equal(auth.drink30Usage,CURRENT_30,'30cc目前用法不是每日 1–2 罐');
assert.equal(auth.drink180Usage,'每日一包','180cc目前用法不是每日一包');
assert.match(String(auth.deferredProductPolicy||''),/柒玄茶|暫不放官網|暫緩/,'缺少柒玄茶暫緩公開政策');

const guard=window.XJWCurrentPostMediaAuthority;
assert.equal(guard.current30Usage,CURRENT_30,'runtime guard沒有鎖定30cc目前用法');
assert.equal(guard.validateFormalCopy({copy:'龜鹿湯塊75g （2兩）／盒｜8塊裝｜每塊約9.375g'}),'','正式湯塊每塊重量不得被舊守門誤擋');
assert.equal(guard.validateFormalCopy({copy:'龜鹿膠600g （1斤）／盒｜32塊裝｜每塊約18.75g'}),'','正式龜鹿膠每塊重量不得被舊守門誤擋');
assert.equal(guard.validateFormalCopy({id:'POST-DRINK-30',copy:`龜鹿飲30cc玻璃罐，${CURRENT_30}`}),'','30cc目前正式用法不得被舊守門誤擋');
assert.equal(guard.validateFormalCopy({id:'POST-PRODUCT-OVERVIEW',copy:'仙加味目前官網公開六項產品：龜鹿膏、龜鹿飲30cc玻璃罐、龜鹿飲180cc鋁袋、龜鹿湯塊、龜鹿膠、鹿茸粉'}),'','六項目前公開產品總覽不得被舊七項守門誤擋');
assert.match(guard.validateFormalCopy({copy:'龜鹿湯塊600g／盒'}),/退役容量/,'龜鹿湯塊錯誤600g仍必須被擋');
assert.match(guard.validateFormalCopy({copy:'龜鹿膏每日早上及下午各一小匙'}),/退役固定時段|退役使用方式/,'龜鹿膏舊固定時段仍必須被擋');
assert.match(guard.validateFormalCopy({copy:'龜鹿膏 早上＋下午'}),/退役固定時段/,'龜鹿膏舊快捷時段仍必須被擋');
assert.match(guard.validateFormalCopy({id:'POST-DRINK-30',copy:'龜鹿飲30cc每日一罐'}),/退役使用方式/,'30cc每日一罐仍必須被擋');
assert.match(guard.validateFormalCopy({id:'POST-PRODUCT-OVERVIEW',copy:'目前七項產品含柒玄茶・龜鹿調飲粉'}),/柒玄茶|暫不放官網|第七項/,'暫緩產品不得被舊七項資料重新加入公開貼文');

const retired=new Set((assets.assets||[]).filter(a=>['deprecated-reference-only','preflight-rejected-reference-only','superseded-reference-only'].includes(String(a.status||''))).map(a=>String(a.path||'').replace(/^\//,'').split(/[?#]/)[0]));
const normalize=v=>String(v||'').replace(/^https?:\/\/[^/]+\/xianjiawei\//i,'').replace(/^\//,'').split(/[?#]/)[0];
const active=posts.filter(p=>p&&p.status!=='published'&&p.status!=='archived'&&!p.campaign_hold);
for(const post of active){
  const image=String(post.image_url||'').trim(),norm=normalize(image),serialized=JSON.stringify(post);
  assert.equal(post.owner_review_required,true,`${post.id} 待審內容必須人工審核`);
  assert.notEqual(post.publish_allowed,true,`${post.id} 待審內容不得直接發布`);
  assert.notEqual(post.schedule_enabled,true,`${post.id} 待審內容不得直接排程`);
  assert.doesNotMatch(serialized,/30\s*cc.{0,60}(玻璃瓶|瓶裝|[／/]\s*瓶)/i,`${post.id} 仍有30cc瓶型舊稱`);
  assert.doesNotMatch(serialized,DEFERRED,`${post.id} 公開貼文重新出現暫緩產品`);
  if(image){
    assert.doesNotMatch(image,/\/images\/products-v2\//i,`${post.id} 不得使用products-v2`);
    assert.doesNotMatch(image,/\/images\/products-v3\//i,`${post.id} products-v3只可作身份參考，不得作目前貼文產品主圖`);
    if(retired.has(norm))assert.fail(`${post.id} 仍沿用退役圖片：${norm}`);
  }else{
    assert.equal(post.image_status,'needs_generation',`${post.id} 沒有圖片時必須明確標示needs_generation`);
    assert.equal(post.regeneration_mode,'chatgpt_handoff',`${post.id} 缺圖必須走ChatGPT重生成交接`);
  }
  if(post.image_status==='needs_generation'){
    assert.equal(post.status,'pending_review',`${post.id} 待生成內容必須留在待審核`);
    assert.notEqual(post.publish_allowed,true,`${post.id} 待生成內容不得發布`);
  }
}

const by=new Map(posts.map(p=>[p.id,p]));
assert.match(String(by.get('POST-PRODUCT-OVERVIEW')?.copy||''),/官網公開六項產品|六項產品/,'產品總覽必須是目前六項公開產品');
assert.doesNotMatch(String(by.get('POST-PRODUCT-OVERVIEW')?.copy||''),DEFERRED,'產品總覽不得出現暫緩柒玄茶');
assert.match(String(by.get('POST-DRINK-30')?.copy||''),/每日 1–2 罐/,'30cc待審文案缺目前用法');
assert.match(String(by.get('POST-DRINK-180')?.copy||''),/每日一包/,'180cc待審文案缺目前用法');
assert.match(String(by.get('POST-SOUP-75')?.copy||''),/75g （2兩）／盒｜8塊裝.*9\.375g/,'湯塊待審文案規格不完整');
assert.match(String(by.get('POST-JIAO-600')?.copy||''),/600g （1斤）／盒｜32塊裝.*18\.75g/,'龜鹿膠待審文案規格不完整');

for(const id of ['POST-PRODUCT-OVERVIEW','POST-CHOOSE','POST-COMBO','POST-GUIDE','POST-CHOOSE-BY-HABIT']){
  const post=by.get(id);assert.ok(post,`缺少${id}`);
  if(!String(post.image_url||'').trim()){
    assert.equal(post.image_status,'needs_generation',`${id} 尚未配圖時必須保持needs_generation`);
    assert.equal(post.status,'pending_review',`${id} 尚未配圖時必須保持pending_review`);
  }
}
for(const id of ['POST-WEATHER-HOT','POST-WEATHER-TEMP','POST-WEATHER-RAIN']){
  const post=by.get(id);assert.ok(post,`缺少${id}`);assert.equal(post.live_check_required,true,`${id} 必須保留當日天氣確認metadata`);
}
for(const post of posts.filter(p=>p?.status==='published')){
  assert.equal(post.prevent_republish,true,`${post.id} 已發布內容必須鎖定防重發`);
  assert.equal(post.do_not_republish,true,`${post.id} 已發布內容必須標記不可重發`);
}
const reusable=image=>/customer-display-v20260812|trial-poster-small-boss-official-v20260814|final-published/.test(image);
const seen=new Map();
for(const post of active){const image=normalize(post.image_url);if(!image||reusable(image))continue;if(seen.has(image))assert.fail(`生活／情境主圖重複：${post.id} 與 ${seen.get(image)} -> ${image}`);seen.set(image,post.id)}
assert.equal(Number(data?.counts?.duplicate_primary_images||0),0,'目前runtime不應有生活／情境主圖重複');
console.log(`PASS current post runtime: ${posts.length} posts, six public products, six approved media products, current 30cc use, no retired fixed-time Guilu Gao chip or stale seven-product gate.`);
