import fs from 'node:fs';
import path from 'node:path';

const manifestPath='asset-staging/priority10-svg-v20260817/manifest.json';
const outDir='asset-staging/priority10-svg-v20260817/svg';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
fs.mkdirSync(outDir,{recursive:true});

const sceneConfig={
  'XJW-GUILU-choose-by-place':{bg:'images/brand/approved-v405/choose.webp',pos:'72% 50%',bullets:['在家與外出，先看今天的行程','直接飲用、溫熱飲用或料理搭配','先看生活，再選產品'],tag:'生活選擇'},
  'XJW-GUILU-drink180-home':{bg:'images/brand/approved-v405/home-brand.webp',pos:'76% 48%',bullets:['回到家，把步調放慢一點','180cc鋁袋，可隔水加熱後溫熱飲用','依自己的生活習慣安排'],tag:'傍晚・居家'},
  'XJW-GUILU-drink30-work-break':{bg:'images/brand/approved-v405/guide-how-to-use.webp',pos:'75% 50%',bullets:['早上出門，輕巧帶著走','工作告一段落，再找個空檔飲用','30cc小玻璃裸罐，比例不放大'],tag:'上班・工作空檔'},
  'XJW-GUILU-gao-storage':{bg:'images/brand/approved-v405/faq.webp',pos:'76% 48%',bullets:['未開封：常溫陰涼處','開罐後：記得冷藏保存','取用後蓋好，再放回固定位置'],tag:'居家・保存整理'},
  'XJW-GUILU-jiao-600g':{bg:'images/brand/approved-v405/brand-story.webp',pos:'76% 50%',bullets:['週末有時間，慢慢把型態看清楚','600g／盒（1斤）・32塊裝','從料理習慣與家庭使用方式認識'],tag:'週末・產品認識'},
  'XJW-GUILU-luerong-75g':{bg:'images/brand/hd-v20260812/choose.jpg',pos:'80% 48%',bullets:['下午工作告一段落','75g／罐・單一產品型態','先看標示，再依自己的習慣安排'],tag:'下午・工作休息'},
  'XJW-GUILU-tangkuai-soup':{bg:'images/brand/approved-v405/recipes.webp',pos:'73% 50%',bullets:['今晚煮一鍋家常熱湯','75g／盒・8塊裝','把產品放回熟悉的餐桌與燉煮情境'],tag:'晚餐・家常料理'},
  'XJW-SOCIAL-20260815-01-warm-drink-moment':{bg:'images/brand/approved-v405/guide-how-to-use.webp',pos:'62% 48%',bullets:['離開螢幕幾分鐘','30cc與180cc依工作／外出／居家情境選擇','喜歡溫熱時，再依自己的方式調整溫度'],tag:'辦公室・下午'},
  'XJW-SOCIAL-20260815-03-storage-basics':{bg:'images/brand/hd-v20260812/faq.png',pos:'76% 48%',bullets:['星期天順手整理櫃子','確認開封與未開封產品的位置','龜鹿膏開罐後冷藏；其他依包裝標示保存'],tag:'星期天・居家整理'},
  'XJW-SOCIAL-20260815-02-line-consult-and-trial':{bg:'images/brand/approved-v405/contact-line.webp',pos:'77% 48%',bullets:['先說平常在家還是常外出','再說習慣的時間與飲用／料理方式','產品、試喝與下單都可透過LINE詢問'],tag:'LINE・諮詢情境'}
};

const productMap={
  drink30:{label:'龜鹿飲30cc',file:'images/products-v3/guilu-drink-30.jpg'},
  drink180:{label:'龜鹿飲180cc',file:'images/products-v3/guilu-drink-180.jpg'},
  gao:{label:'龜鹿膏100g',file:'images/products-v3/guilu-gao.jpg'},
  jiao:{label:'龜鹿膠600g',file:'images/products-v3/guilu-jiao.jpg'},
  luerong:{label:'鹿茸粉75g',file:'images/products-v3/luerong-fen.jpg'},
  tangkuai:{label:'龜鹿湯塊75g',file:'images/products-v3/guilu-tangkuai.jpg'}
};

function mime(file){const e=path.extname(file).toLowerCase(); return e==='.png'?'image/png':e==='.jpg'||e==='.jpeg'?'image/jpeg':'image/webp';}
function dataUri(file){const b=fs.readFileSync(file).toString('base64');return `data:${mime(file)};base64,${b}`;}
function esc(s=''){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
function titleTspans(title){return title.split('\n').map((x,i)=>`<tspan x="70" dy="${i?72:0}">${esc(x)}</tspan>`).join('');}

for(const [index,post] of manifest.posts.entries()){
  const cfg=sceneConfig[post.id]; if(!cfg) throw new Error(`missing scene ${post.id}`);
  const bg=dataUri(cfg.bg);
  const prods=(post.products||[]).filter(x=>productMap[x]);
  const cards=prods.map((id,i)=>{
    const p=productMap[id]; const n=prods.length;
    const w=n===1?330:n===2?205:145; const gap=n===1?0:18; const x=690+i*(w+gap)-(n===1?0:(n===2?0:5));
    return `<g><rect x="${x}" y="868" width="${w}" height="300" rx="24" fill="#fffdf8" stroke="#d4af37" stroke-width="3"/><image href="${dataUri(p.file)}" x="${x+16}" y="888" width="${w-32}" height="210" preserveAspectRatio="xMidYMid meet"/><text x="${x+w/2}" y="1134" text-anchor="middle" class="prod">${esc(p.label)}</text></g>`;
  }).join('');
  const noProd=prods.length===0?`<g><rect x="690" y="868" width="330" height="300" rx="24" fill="#fffdf8" stroke="#d4af37" stroke-width="3"/><text x="855" y="998" text-anchor="middle" class="brandbig">仙加味</text><text x="855" y="1056" text-anchor="middle" class="small">補養，是一種節奏。</text></g>`:'';
  const bullets=cfg.bullets.map((b,i)=>`<g transform="translate(0 ${i*92})"><circle cx="100" cy="917" r="24" fill="#b61d1d"/><text x="100" y="927" text-anchor="middle" class="num">${i+1}</text><text x="145" y="928" class="bullet">${esc(b)}</text></g>`).join('');
  const cropOffset=index%3===0?'xMidYMid':index%3===1?'xMaxYMid':'xMidYMid';
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#071d35" stop-opacity=".18"/><stop offset=".58" stop-color="#071d35" stop-opacity=".15"/><stop offset="1" stop-color="#071d35" stop-opacity=".96"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="6" stdDeviation="9" flood-opacity=".25"/></filter><style>
text{font-family:'Noto Sans CJK TC','Noto Sans TC','PingFang TC',sans-serif}.kicker{font-size:29px;font-weight:700;fill:#f7f0df}.title{font-family:'Noto Serif CJK TC','Noto Serif TC',serif;font-size:58px;font-weight:800;fill:#fffaf0}.tag{font-size:26px;font-weight:700;fill:#173653}.bullet{font-size:25px;font-weight:650;fill:#173653}.num{font-size:22px;font-weight:800;fill:white}.prod{font-size:22px;font-weight:800;fill:#173653}.brandbig{font-family:'Noto Serif CJK TC','Noto Serif TC',serif;font-size:48px;font-weight:800;fill:#173653}.small{font-size:22px;fill:#7b654a}.footer{font-family:'Noto Serif CJK TC','Noto Serif TC',serif;font-size:29px;font-weight:700;fill:#f6e9c9}
</style></defs>
<rect width="1080" height="1350" fill="#f7f4ed"/>
<clipPath id="scene"><rect x="0" y="0" width="1080" height="805" rx="0"/></clipPath>
<g clip-path="url(#scene)"><image href="${bg}" x="-145" y="0" width="1370" height="805" preserveAspectRatio="${cropOffset} slice"/><rect width="1080" height="805" fill="url(#g)"/></g>
<rect x="58" y="58" width="360" height="58" rx="29" fill="#173653" fill-opacity=".92" stroke="#d4af37" stroke-width="2"/><text x="86" y="97" class="kicker">${esc(post.kicker)}</text>
<text x="70" y="198" class="title" filter="url(#shadow)">${titleTspans(post.title)}</text>
<rect x="70" y="705" width="310" height="58" rx="20" fill="#f7f4ed" fill-opacity=".94"/><text x="225" y="744" text-anchor="middle" class="tag">${esc(cfg.tag)}</text>
<rect x="0" y="805" width="1080" height="475" fill="#f7f4ed"/>
<text x="70" y="854" class="tag">這篇的生活場景</text>${bullets}
<text x="690" y="844" class="tag">正式產品實物</text>${cards}${noProd}
<rect x="0" y="1280" width="1080" height="70" fill="#173653"/><text x="540" y="1325" text-anchor="middle" class="footer">仙加味｜補養，是一種節奏。</text>
</svg>`;
  fs.writeFileSync(path.join(outDir,`${post.id}.svg`),svg);
  console.log('SVG',post.id,svg.length);
}
if(manifest.posts.length!==10) throw new Error(`count ${manifest.posts.length}`);
