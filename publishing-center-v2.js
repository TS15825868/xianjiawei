const DATA_URL='content/public-post-library.json?v=20260807-6';
const RECORD_KEY='xjw-publishing-v3-records';
const IMAGE_KEY='xjw-publishing-v3-local-images';
const SCHEDULE_SLOTS=[{day:2,hour:19,minute:30,label:'星期二 19:30'},{day:6,hour:9,minute:30,label:'星期六 09:30'}];
const DIMENSIONS=[
 ['brand','品牌'],['product','產品'],['specification','規格'],['offer','價格／活動'],
 ['season','季節'],['weather','天氣'],['occasion','場合'],['location','地點'],
 ['context','情境'],['environment','環境'],['temperature','冷熱'],['expression','表情'],
 ['action','動作'],['characters','小老闆與夥伴'],['proportion','比例尺寸'],['duplicate','重複圖']
];
const PLATFORM_URLS={'Facebook':'https://www.facebook.com/','Instagram':'https://www.instagram.com/','LINE VOOM':'https://manager.line.biz/','Google 商家最新動態':'https://business.google.com/'};
const state={data:null,records:read(RECORD_KEY),images:read(IMAGE_KEY),filter:'pending',query:''};
const $=id=>document.getElementById(id);
const esc=(v='')=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(k){try{return JSON.parse(localStorage.getItem(k)||'{}')||{}}catch{return{}}}
function persist(){localStorage.setItem(RECORD_KEY,JSON.stringify(state.records));localStorage.setItem(IMAGE_KEY,JSON.stringify(state.images));render()}
function rec(id){return state.records[id]||{checks:{}}}
function locked(p){return p.status==='published'||p.prevent_republish===true}
function localImage(p){return state.images[p.id]?.dataUrl||p.image_url||''}
function status(p){if(locked(p))return'published';const r=rec(p.id);if(r.publishedAt)return'published';if(r.scheduledAt)return'scheduled';if(r.approvedAt)return'approved';return'pending'}
function allChecked(id){const c=rec(id).checks||{};return DIMENSIONS.every(([k])=>c[k]===true)}
function toast(t){const n=$('toast');if(!n)return;n.textContent=t;n.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>n.classList.remove('show'),2800)}
async function copy(t,msg='已複製'){try{await navigator.clipboard.writeText(t)}catch{const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove()}toast(msg)}
function nextSlot(after=new Date()){
 const candidates=[];
 for(let add=0;add<15;add++){
  for(const slot of SCHEDULE_SLOTS){const d=new Date(after);d.setSeconds(0,0);d.setDate(after.getDate()+add);d.setHours(slot.hour,slot.minute,0,0);if(d.getDay()===slot.day&&d>after)candidates.push({date:d,label:slot.label});}
 }
 candidates.sort((a,b)=>a.date-b.date);return candidates[0];
}
function queueBase(){return Object.values(state.records).map(x=>x.scheduledAt).filter(Boolean).map(x=>new Date(x)).sort((a,b)=>a-b).pop()||new Date()}
function scheduleApproved(p){const r=rec(p.id);const slot=nextSlot(queueBase());r.scheduledAt=slot.date.toISOString();r.scheduleLabel=slot.label;r.scheduleStatus='queued';state.records[p.id]=r;return slot}
function promptFor(p){return `請只生成一張獨立1:1繁體中文社群貼文圖，不要網站畫面、不要儀表板。\
\
品牌只顯示：仙加味。不可出現「台興山產有限公司」、統編、公司電話或公司地址。\
貼文標題：${p.title}\
貼文文案：${p.copy}\
\
固定角色：官網版Q版小老闆，米白中式上衣、深綠圍裙、紅色直式「仙加味」印章；圍裙下方小鹿與小烏龜圖樣不可省略。只要小老闆出現，小鹿與小烏龜兩位主要夥伴必須一起出現並自然互動；居家、休息、陪伴情境才可加入灰色小河馬娃娃與米色小鹿安撫巾。不得換成其他角色。\
視覺：暖米色、深藍、深綠、印章紅、少量金色；依貼文情境可使用先前龜鹿膠淡紫米白精品版型；繁體中文；不談療效。\
產品：只能使用仙加味正式產品原圖等比例合成；AI只生成背景、角色、道具與情境。不可重畫、不可裁切、不可改包裝、文字、顏色、容量、規格或拉伸產品。\
固定產品比例：\
1. 龜鹿飲30cc玻璃罐：30cc／罐（小玻璃罐），裸罐、無貼紙、金色蓋；同型外觀約42mm直徑×51mm高，高矮胖瘦照正式原圖，不得做高或做胖。\
2. 龜鹿飲180cc鋁袋：180cc／包（鋁袋），狹長直立，寬高比約0.64；同框時自然縮小，不得橫向拉寬或加高放大。\
3. 龜鹿膏：100g／罐，六角玻璃罐約51×78mm；只使用目前新版標籤，舊紅白直式貼紙禁止。\
4. 龜鹿膠：600g（1斤）／盒｜32塊裝｜每塊約18.75g；淡紫色正式盒裝依原圖比例，紫盒不可橫向拉長。\
圖片需求：${p.image_prompt||'依文案建立完全匹配的生活情境。'}\
必須逐項匹配：品牌、產品、規格、價格／活動、季節、天氣、場合、地點、情境、環境、冷熱、表情、動作、小老闆與夥伴、比例尺寸、重複圖。\
不可出現與文案無關的產品、季節、天氣、地點、冰塊、冰飲、表情或動作。新圖只進待審核，不直接發布。`}
function openChatGPT(p){const q=promptFor(p);copy(q,'生成指令已複製，正在開啟ChatGPT');window.open('https://chatgpt.com/?q='+encodeURIComponent(q),'_blank','noopener');openDialog(p,true)}
function setCheck(id,key,on){const r=rec(id);r.checks={...(r.checks||{}),[key]:on};if(!allChecked(id)){r.approvedAt=null;r.scheduledAt=null;r.scheduleStatus=null}state.records[id]=r;persist();openDialog(find(id))}
function approve(p){if(locked(p))return;const r=rec(p.id);if(r.approvedAt){r.approvedAt=null;r.scheduledAt=null;r.scheduleStatus=null;state.records[p.id]=r;persist();toast('已取消核准與排程');return}if(!allChecked(p.id)){alert('十六項圖文、產品比例與品牌檢查尚未全部確認，不能核准。');openDialog(p);return}r.approvedAt=new Date().toISOString();state.records[p.id]=r;const slot=scheduleApproved(p);persist();toast(`已核准並排入 ${slot.label}`)}
function publishNow(p){if(locked(p))return;const r=rec(p.id);if(!r.approvedAt||!allChecked(p.id)){alert('請先完成十六項檢查並核准。');openDialog(p);return}const ans=prompt('輸入立即發布的平台，可用逗號分隔：',(p.platforms||[]).join('、'));if(ans===null)return;r.publishedAt=new Date().toISOString();r.platforms=ans.split(/[、,，]+/).map(x=>x.trim()).filter(Boolean);r.scheduleStatus='published-manual';r.scheduledAt=null;state.records[p.id]=r;persist();toast('已記錄立即發布，不受固定排程限制')}
function markPublished(p){if(locked(p))return;const r=rec(p.id);if(!r.approvedAt||!allChecked(p.id)){alert('請先完成十六項檢查並核准。');openDialog(p);return}if(r.publishedAt){if(confirm('清除這支裝置的已發布標記？')){r.publishedAt=null;r.platforms=[];r.scheduleStatus=r.scheduledAt?'queued':null;state.records[p.id]=r;persist()}return}const ans=prompt('輸入已完成發布的平台，可用逗號分隔：',(p.platforms||[]).join('、'));if(ans===null)return;r.publishedAt=new Date().toISOString();r.platforms=ans.split(/[、,，]+/).map(x=>x.trim()).filter(Boolean);r.scheduleStatus='published';state.records[p.id]=r;persist();toast('已保存發布紀錄')}
function replaceLocal(p,file){if(!file)return;if(!/^image\//.test(file.type)){alert('請選擇圖片檔');return}const reader=new FileReader();reader.onload=()=>{state.images[p.id]={dataUrl:reader.result,name:file.name,updatedAt:new Date().toISOString()};const r=rec(p.id);r.checks={};r.approvedAt=null;r.scheduledAt=null;r.scheduleStatus=null;state.records[p.id]=r;persist();openDialog(p);toast('新圖已換上，需重新完成十六項檢查')};reader.readAsDataURL(file)}
function exportData(){const data={exportedAt:new Date().toISOString(),timezone:'Asia/Taipei',schedule:SCHEDULE_SLOTS,sourceVersion:state.data?.version,records:state.records,localImageMetadata:Object.fromEntries(Object.entries(state.images).map(([id,v])=>[id,{name:v.name,updatedAt:v.updatedAt}]))};const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='仙加味發布與排程紀錄-'+new Date().toISOString().slice(0,10)+'.json';a.click();URL.revokeObjectURL(u)}
function find(id){return state.data?.posts?.find(p=>p.id===id)}
function matches(p){const q=state.query.toLowerCase();if(q&&!JSON.stringify(p).toLowerCase().includes(q))return false;const s=status(p);if(state.filter==='all')return true;if(state.filter==='needs-image')return !state.images[p.id]&&/needs|missing|unmatched/i.test(p.image_status||'');if(state.filter==='approved')return s==='approved'||s==='scheduled';return s===state.filter}
function fmt(iso){if(!iso)return'';return new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',month:'numeric',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(iso))}
function card(p){const r=rec(p.id),s=status(p),cnt=DIMENSIONS.filter(([k])=>r.checks?.[k]).length,img=localImage(p);const stateText=locked(p)?'已發布鎖定':s==='scheduled'?'已核准排程':s==='approved'?'已核准':s==='published'?'本機已發布':'待審核';return `<article class="post-card" data-id="${esc(p.id)}"><div class="image-wrap">${img?`<img src="${esc(img)}" alt="${esc(p.title)}" loading="lazy">`:'<div class="state-card">尚無圖片</div>'}<span class="image-state">${state.images[p.id]?'本機ChatGPT新圖':esc(p.image_status||'候選圖')}</span></div><div class="card-body"><div class="card-title-row"><h2>${esc(p.title)}</h2><span class="status ${s}">${stateText}</span></div><p class="excerpt">${esc(p.copy)}</p><div class="platforms">${(p.platforms||[]).map(x=>`<span class="platform-chip">${esc(x)}</span>`).join('')}</div>${r.scheduledAt?`<div class="review-note">預定發布：${esc(fmt(r.scheduledAt))}</div>`:''}<div class="review-note ${cnt===DIMENSIONS.length?'':'warning'}">完整檢查 ${cnt}／${DIMENSIONS.length}</div><div class="card-actions"><button class="button secondary small" data-view="${esc(p.id)}">查看與檢查</button><button class="button secondary small" data-copy="${esc(p.id)}">複製文案</button>${img?`<a class="button secondary small" href="${esc(img)}" target="_blank" rel="noopener">開啟圖片</a>`:''}${!locked(p)?`<button class="button orange small" data-chatgpt="${esc(p.id)}">圖不符合｜ChatGPT生成</button><button class="button green small" data-approve="${esc(p.id)}">${r.approvedAt?'取消核准與排程':'審核通過並排程'}</button>${r.approvedAt?`<button class="button primary small" data-now="${esc(p.id)}">立即發布</button>`:''}<button class="button secondary small" data-published="${esc(p.id)}">${r.publishedAt?'取消本機標記':'手動補登已發布'}</button>`:''}</div></div></article>`}
function render(){if(!state.data)return;const ps=state.data.posts||[];$('metricTotal').textContent=ps.length;$('metricPending').textContent=ps.filter(p=>!locked(p)&&!rec(p.id).approvedAt&&!rec(p.id).publishedAt).length;$('metricLocked').textContent=ps.filter(locked).length;$('metricLocal').textContent=ps.filter(p=>rec(p.id).publishedAt).length;const list=ps.filter(matches);$('postList').innerHTML=list.length?list.map(card).join(''):'<section class="state-card">目前沒有符合條件的貼文。</section>'}
function expectation(p,k){
 const t=(p.title+' '+p.copy+' '+(p.image_prompt||''));
 const map={
  brand:'只顯示「仙加味」；不可出現公司名稱、統編、公司電話或公司地址。',
  product:'產品品項與文案一致；產品只能使用正式原圖等比例合成，不可重畫或換包裝。',
  specification:'容量、重量、塊數、罐／包／盒稱呼完全依正式規格；30cc必須稱「罐」而不是「瓶」。',
  offer:/60|600|200|2,000|2000|試喝|免費|買10送1/.test(t)?'價格、試喝、運費與買10送1資訊必須逐字對應目前活動。':'沒有價格活動的貼文，不得自行加入價格、贈品或折扣。',
  season:/春|夏|秋|冬|梅雨|寒冷/.test(t)?'季節必須明確符合文案。':'不得出現衝突季節。',
  weather:/雨|晴|太陽|高溫|悶熱|颱風|寒冷|強風|溫差/.test(t)?'晴雨、風勢、衣著與溫度感必須符合；即時天氣貼文發布前再查當日資訊。':'天氣保持中性且不衝突。',
  occasion:'早餐、上班、工作空檔、午休、下班、聚餐、採買、拜訪、送禮、料理或休息場合需與文案一致。',
  location:/萬華|西昌|龍山寺/.test(t)?'萬華場景自然且不可誤用其他地標。':/燉|料理|雞湯|排骨/.test(t)?'居家廚房或餐桌。':'地點需服務貼文主題。',
  context:/燉|料理|雞湯|排骨/.test(t)?'廚房、餐桌、湯鍋與料理情境。':/試喝/.test(t)?'試喝海報、三罐30cc與官方LINE申請情境。':'畫面主題與用途一致。',
  environment:/下雨|雨天/.test(t)?'雨天窗景或撐傘後回到室內。':/悶熱|高溫/.test(t)?'台灣悶熱戶外或通風室內。':'環境不可與文案衝突。',
  temperature:/溫|熱|燉|湯/.test(t)?'呈現溫熱、熱水或蒸氣，不可配冰飲。':/悶熱|清爽/.test(t)?'清爽補水，但不可擅自加入冰塊或冰飲。':'冷熱感中性且不衝突。',
  expression:/提醒|溫差|悶熱|下雨|颱風/.test(t)?'關心、提醒、自然表情。':'自然親切，不誇張推銷或暗示療效。',
  action:/燉|料理|雞湯|排骨/.test(t)?'備料、看鍋、攪拌、燉煮或盛湯。':/下雨/.test(t)?'撐傘、收傘、喝溫水或整理物品。':/試喝/.test(t)?'展示三罐試喝品、指向官方LINE或說明申請。':'動作服務文案主題。',
  characters:'官網版Q版小老闆造型正確；小老闆出現時小鹿與小烏龜必須一起出現；居家陪伴情境才可加灰色小河馬娃娃與米色小鹿安撫巾。',
  proportion:/30cc|小玻璃罐/.test(t)?'30cc小玻璃罐同型約42mm直徑×51mm高，裸罐無貼紙、金色蓋，不可拉高拉胖。':/180cc|鋁袋/.test(t)?'180cc鋁袋狹長直立，寬高比約0.64；不可過寬、過高或放得比實品誇張。':/龜鹿膏/.test(t)?'龜鹿膏六角罐約51×78mm，只用新版標籤，舊貼紙禁止。':/龜鹿膠/.test(t)?'龜鹿膠淡紫盒依正式原圖等比例，不可橫向拉長。':'產品若出現，一律比對正式原圖比例。',
  duplicate:'確認這張主圖與最近90天已使用主圖不同；同一構圖、角色姿勢與背景不可只換文字重複使用。'
 };
 return map[k]
}
function openDialog(p,showUpload=false){if(!p)return;const r=rec(p.id),img=localImage(p);$('dialogContent').innerHTML=`<div class="dialog-grid"><div>${img?`<img class="dialog-image" src="${esc(img)}" alt="${esc(p.title)}">`:'<div class="state-card">尚無圖片</div>'}<p class="meta-line">貼文ID：${esc(p.id)}</p><p class="meta-line">圖片狀態：${state.images[p.id]?'本機ChatGPT新圖':esc(p.image_status||'未標示')}</p>${r.scheduledAt?`<p class="meta-line">預定發布：${esc(fmt(r.scheduledAt))}</p>`:''}</div><div><h2>${esc(p.title)}</h2><pre class="copy-box">${esc(p.copy)}</pre>${!locked(p)?`<section class="visual-match-box"><h3>發布前十六項完整檢查</h3><p class="visual-match-intro">每一項都要實際查看圖片及文案後再勾選；產品比例需與原圖一致。</p><div class="visual-match-list">${DIMENSIONS.map(([k,l])=>`<label class="visual-match-item"><input type="checkbox" data-check="${k}" data-id="${esc(p.id)}" ${r.checks?.[k]?'checked':''}><strong>${l}</strong><span>${expectation(p,k)}</span></label>`).join('')}</div></section><div class="dialog-actions"><button class="button secondary" data-copy="${esc(p.id)}">複製文案</button><button class="button orange" data-chatgpt="${esc(p.id)}">圖不符合｜ChatGPT生成</button><label class="button green" for="replace-${esc(p.id)}">選擇新圖並換上</label><input id="replace-${esc(p.id)}" type="file" accept="image/*" data-replace="${esc(p.id)}" hidden><button class="button primary" data-approve="${esc(p.id)}">${r.approvedAt?'取消核准與排程':'審核通過並排程'}</button>${r.approvedAt?`<button class="button primary" data-now="${esc(p.id)}">立即發布</button>`:''}</div>${showUpload?'<p class="review-note warning">ChatGPT已開啟。生成完成後回到此頁，選擇新圖即可換上；新圖仍要完成十六項檢查。</p>':''}`:'<p class="review-note">這篇已發布鎖定，不得重新發布。</p>'}</div></div>`;$('postDialog').showModal()}
async function load(){try{const r=await fetch(DATA_URL+'&t='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);state.data=await r.json();if(state.data?.authority!=='TS15825868/xianjiawei')throw new Error('公開貼文母本來源不正確');$('loadingState').hidden=true;$('errorState').hidden=true;render()}catch(e){$('loadingState').hidden=true;$('errorState').hidden=false;$('errorMessage').textContent=e.message}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-view],[data-copy],[data-chatgpt],[data-approve],[data-published],[data-now],[data-platform]');if(!b)return;const id=b.dataset.view||b.dataset.copy||b.dataset.chatgpt||b.dataset.approve||b.dataset.published||b.dataset.now||b.dataset.platform;const p=find(id);if(!p)return;if(b.dataset.view)openDialog(p);else if(b.dataset.copy)copy(p.copy);else if(b.dataset.chatgpt)openChatGPT(p);else if(b.dataset.approve)approve(p);else if(b.dataset.published)markPublished(p);else if(b.dataset.now)publishNow(p);else if(b.dataset.platform)window.open(PLATFORM_URLS[b.dataset.platform]||'#','_blank','noopener')});
document.addEventListener('change',e=>{if(e.target.matches('[data-check]'))setCheck(e.target.dataset.id,e.target.dataset.check,e.target.checked);if(e.target.matches('[data-replace]'))replaceLocal(find(e.target.dataset.replace),e.target.files?.[0])});
$('searchInput')?.addEventListener('input',e=>{state.query=e.target.value;render()});
$('statusFilter')?.addEventListener('change',e=>{state.filter=e.target.value;render()});
$('exportButton')?.addEventListener('click',exportData);
$('reloadButton')?.addEventListener('click',()=>location.reload());
$('retryButton')?.addEventListener('click',load);
load();