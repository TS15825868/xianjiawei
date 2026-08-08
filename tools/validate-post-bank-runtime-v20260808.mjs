import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');
const base = JSON.parse(read('content/public-post-library.json'));

const nativeFetch = async (input) => {
  const url = typeof input === 'string' ? input : (input?.url || '');
  if (!url.includes('content/public-post-library.json')) {
    return new Response('not found', { status: 404, headers: { 'content-type': 'text/plain' } });
  }
  return new Response(JSON.stringify(base), {
    status: 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
};

globalThis.window = { fetch: nativeFetch };

for (const file of [
  'publishing-center-data-v6.js',
  'publishing-center-data-v7.js',
  'publishing-center-data-v8-fixes.js',
  'publishing-center-data-v10-published-locks.js',
  'publishing-center-data-v11-campaign-holds.js',
]) {
  vm.runInThisContext(read(file), { filename: file });
}

const response = await window.fetch('content/public-post-library.json');
assert.equal(response.status, 200);
const data = await response.json();
const posts = data.posts || [];
assert.equal(posts.length, 500, `發布中心runtime應為500篇，實際${posts.length}`);
assert.equal(new Set(posts.map((post) => post.id)).size, 500, '500篇ID必須全部唯一');

const serialized = JSON.stringify(posts);
assert.ok(!/龜鹿湯塊\s*300\s*g/i.test(serialized), 'runtime仍出現舊龜鹿湯塊容量');
assert.ok(!/龜鹿湯塊\s*600\s*g/i.test(serialized), 'runtime仍出現舊龜鹿湯塊容量');
assert.ok(!/guilu-tangkuai-(?:300|600)/i.test(serialized), 'runtime仍含舊湯塊產品ID');
assert.ok(!serialized.includes('小老闆出現時小鹿與小烏龜必須一起出現'), 'runtime仍含舊角色強制規則');

const byId = new Map(posts.map((post) => [post.id, post]));
for (const id of ['XJW-TRIAL-001','XJW-TRIAL-002','XJW-TRIAL-012','POST-PRODUCT-OVERVIEW','POST-GAO-100','POST-DRINK-30','POST-DRINK-180','POST-JIAO-600','POST-COMBO']) {
  assert.ok(byId.has(id), `runtime缺少必要貼文 ${id}`);
}

const trialFinal = byId.get('XJW-TRIAL-001');
assert.equal(trialFinal.status, 'published');
assert.equal(trialFinal.prevent_republish, true);
assert.equal(trialFinal.do_not_regenerate, true);
assert.equal(trialFinal.image_asset_id, 'guilu-drink-trial-final-20260808');

const holdIds = Array.from({length:11},(_,i)=>`XJW-TRIAL-${String(i+2).padStart(3,'0')}`);
assert.equal(holdIds.filter((id)=>byId.get(id)?.campaign_hold===true).length, 11, '試喝冷卻應為11篇');
for (const id of holdIds) {
  const post = byId.get(id);
  assert.equal(post.status, 'pending_review');
  assert.equal(post.image_status, 'campaign_hold');
  assert.equal(post.publish_allowed, false);
}

const priorityIds = ['POST-PRODUCT-OVERVIEW','POST-GAO-100','POST-DRINK-30','POST-DRINK-180','POST-JIAO-600','POST-COMBO'];
for (const id of priorityIds) {
  const post = byId.get(id);
  assert.equal(post.image_status, 'candidate-review-required');
  assert.equal(post.candidate_generation_mode, 'exact-official-original-composite');
  assert.equal(post.publish_allowed, false);
  assert.ok(String(post.image_url||'').includes('generated-v20260808-priority1'));
}

for (const id of ['POST-SOUP-75','POST-LUERONG']) {
  const post=byId.get(id);
  assert.equal(post.image_status,'official-reference-pending-layout-review');
  assert.ok(String(post.image_url||'').includes('/images/products-v3/'));
}

const rejectedIds=['XJW-WORK-REST-001','POST-STORAGE','POST-SEASONS-RHYTHM','POST-INGREDIENT-PRINCIPLE','POST-DAILY-SOUP','POST-WEATHER-HOT','POST-WEATHER-TEMP','POST-WEATHER-RAIN','POST-GUIDE','POST-STORE','POST-RECIPES','POST-CHOOSE','POST-CHOOSE-BY-HABIT'];
for (const id of rejectedIds) {
  const post=byId.get(id);
  assert.ok(post, `缺少預檢貼文 ${id}`);
  assert.equal(post.image_status,'needs_generation',`${id} 未退回生成`);
  assert.equal(post.image_preflight,'rejected',`${id} 未標記預檢退回`);
  assert.equal(post.preflight_rejected,true,`${id} 未鎖退回狀態`);
  assert.equal(post.publish_allowed,false,`${id} 不得發布`);
}

const locked = posts.filter((post)=>post.status==='published'||post.prevent_republish===true);
const holds = posts.filter((post)=>post.campaign_hold===true);
const needsGeneration = posts.filter((post)=>post.image_status==='needs_generation'||(!post.image_url&&post.status!=='published'&&!post.campaign_hold));
const candidates = posts.filter((post)=>post.image_status==='candidate-review-required'||post.image_status==='official-reference-pending-layout-review');

assert.equal(locked.length, 3, `已發布鎖定應為3，實際${locked.length}`);
assert.equal(holds.length, 11, `活動冷卻應為11，實際${holds.length}`);
assert.equal(needsGeneration.length, 478, `待生成應為478，實際${needsGeneration.length}`);
assert.equal(candidates.length, 8, `候選待審應為8，實際${candidates.length}`);
assert.equal(locked.length+holds.length+needsGeneration.length+candidates.length,500,'500篇狀態分類必須完整且互斥');

const categories = posts.reduce((out, post) => {
  const key = post.category || '未分類';
  out[key] = (out[key] || 0) + 1;
  return out;
}, {});
assert.equal(categories['產品'] >= 48, true);
assert.equal(categories['FAQ'] >= 48, true);
assert.equal(categories['小老闆與夥伴'], 32);
assert.equal(categories['陪伴角色'], 16);

console.log('PASS runtime500', JSON.stringify({
  total: posts.length,
  locked: locked.length,
  campaignHold: holds.length,
  needsGeneration: needsGeneration.length,
  candidateReview: candidates.length,
  preflightRejected: rejectedIds.length,
}, null, 2));
