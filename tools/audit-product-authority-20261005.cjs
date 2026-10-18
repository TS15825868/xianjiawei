"use strict";

const fs=require("fs");

const ROOT=process.cwd();
const DAILY_30="每日 1–2 罐";
const usage30Matches=value=>/^每日\s*1[～–-]2\s*罐(?:，可依個人需求調整)?$/.test(String(value||""));
const TANGKUAI_SPEC="75g／盒｜8塊裝";
const LINE_URL="https://lin.ee/sHZW7NkR";
const failures=[];
const notes=[];

function read(path){return fs.readFileSync(path,"utf8");}
function json(path){return JSON.parse(read(path));}
function fail(scope,message,detail){failures.push({scope,message,detail});}
function note(scope,message){notes.push({scope,message});}
function product(list,id){return (list||[]).find(x=>x&&x.id===id);}
function assert(cond,scope,message,detail){if(!cond)fail(scope,message,detail);}

const master=json("public-product-master.json");
const ids=["guilu-gao","guilu-drink-30","guilu-drink-180","luerong-fen"];
assert(master.authority==="user-confirmed-current","master","authority 必須為 user-confirmed-current",master.authority);
assert(master.brand?.name==="仙加味","master","公開品牌必須只使用仙加味",master.brand?.name);
assert(master.productCount===master.products.length && new Set(master.products.map(p=>p.id)).size===master.products.length,"master","公開產品數必須與最新母資料清單一致",master.productCount);
assert(ids.every(id=>master.products.some(p=>p.id===id)),"master","目前核心公開產品 ID 缺失",(master.products||[]).map(x=>x.id));

const p30=product(master.products,"guilu-drink-30");
const p180=product(master.products,"guilu-drink-180");
const tang=product(master.products,"guilu-tangkuai");
const jiao=product(master.products,"guilu-jiao");
assert(p30?.name==="龜鹿飲30cc玻璃罐","30cc","正式名稱錯誤",p30?.name);
assert(p30?.specification==="30cc／罐（小玻璃罐）","30cc","正式規格錯誤",p30?.specification);
assert(usage30Matches(p30?.usage?.[0]),"30cc","最新正式使用方式必須同步 public-product-master",p30?.usage?.[0]);
assert(/小玻璃罐/.test(p30?.package||"")&&/裸罐/.test(p30?.package||"")&&/無貼紙/.test(p30?.package||""),"30cc","包裝必須維持小玻璃裸罐、無貼紙",p30?.package);
assert(p180?.specification==="180cc／包（鋁袋）","180cc","正式規格錯誤",p180?.specification);
assert(!tang&&!jiao,"master","暫緩產品不得回流公開");
assert(master.fulfillmentPolicy?.drinkLeadTime==="約5～7個工作天出貨","交期","龜鹿飲交期錯誤",master.fulfillmentPolicy?.drinkLeadTime);
assert((master.fulfillmentPolicy?.madeToOrderProducts||[]).length===2&&master.fulfillmentPolicy.madeToOrderProducts.includes("guilu-drink-30")&&master.fulfillmentPolicy.madeToOrderProducts.includes("guilu-drink-180"),"交期","5～7 工作天只可套用兩種龜鹿飲",master.fulfillmentPolicy?.madeToOrderProducts);

for(const path of ["product-master.json","catalog-public.json","assets/data/official-products.json","config/official-products.json","data.json"]){
  const data=json(path);
  const found=[];
  (function walk(v){
    if(Array.isArray(v)){for(const x of v)walk(x);return;}
    if(!v||typeof v!=="object")return;
    if(v.id==="guilu-drink-30")found.push(v);
    for(const x of Object.values(v))walk(x);
  })(data);
  assert(found.length>0,path,"找不到龜鹿飲30cc鏡像資料");
  for(const item of found){
    for(const key of ["usagePrimary","usage_primary"]){
      if(item[key]!=null)assert(usage30Matches(item[key]),path,`${key} 不得回退`,item[key]);
    }
    if(Array.isArray(item.usage)&&item.usage.length)assert(usage30Matches(item.usage[0]),path,"usage[0] 不得回退",item.usage[0]);
  }
  assert(!/75g\s*[（(]\s*2\s*兩/.test(read(path)),path,"龜鹿湯塊不得回流舊 2兩 標示");
}

const ai=json("ai-answers.json");
const answer30=(ai.answers||[]).find(x=>x.id==="drink-30-vs-180");
const answerAll=(ai.answers||[]).find(x=>x.id==="all-products");
assert(answer30?.answer?.includes(DAILY_30),"ai-answers","30cc 問答未同步目前正式用法",answer30?.answer);
assert(!(ai.answers||[]).some(a=>/龜鹿湯塊|龜鹿膠/.test(a.answer||'')),"ai-answers","暫緩產品不得回流公開問答");

const geo=read("geo-data.json");
assert(geo.includes(DAILY_30),"geo-data","GEO 未同步 30cc 目前正式用法");
assert(!/75g\s*[（(]\s*2\s*兩/.test(geo),"geo-data","GEO 仍含龜鹿湯塊舊 2兩 標示");

const siteAuthority=read("site-product-data-authority.js");
assert(usage30Matches(siteAuthority.match(/const CURRENT_30_USAGE=['"]([^'"]+)['"]/ )?.[1]),"runtime","產品資料守門員未同步目前正式用法");
assert(siteAuthority.includes("publicIds.length"),"runtime","產品資料守門員須依目前公開清單計數");

const publicHtml=[...read("sitemap.xml").matchAll(/<loc>https:\/\/ts15825868\.github\.io\/xianjiawei\/([^<]+\.html)<\/loc>/g)].map(m=>m[1]);
for(const path of publicHtml){
  const html=read(path);
  if(/台興山產/.test(html))fail(path,"公開頁不得顯示舊品牌台興山產");
  if(/75g\s*[（(]\s*2\s*兩/.test(html))fail(path,"公開頁仍含龜鹿湯塊舊 2兩 標示");
  if(path!=="links.html"&&!html.includes("https://lin.ee/sHZW7NkR"))note(path,"頁面本體未直接出現 LINE URL；可能由共用 runtime 注入");
}

for(const path of ["links.html","contact.html"]){
  const html=read(path);
  assert(/10:00[－–-]20:00/.test(html),path,"營業時間必須為週一至週五 10:00–20:00");
}
assert(read("links.html").includes(LINE_URL),"links.html","連結入口缺少正式 LINE URL");

for(const path of ["llms.txt","llms-full.txt"]){
  const txt=read(path);
  assert(txt.includes(DAILY_30),path,"AI 文字入口未同步 30cc 目前正式用法");
  assert(!/龜鹿湯塊|龜鹿膠/.test(txt),path,"AI 文字入口不得宣傳暫緩產品");
}

console.log(JSON.stringify({checkedAt:new Date().toISOString(),publicHtml:publicHtml.length,notes,failures},null,2));
if(failures.length)process.exit(1);

