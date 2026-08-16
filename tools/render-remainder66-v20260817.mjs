import fs from 'node:fs';
import path from 'node:path';

const batchFiles=[1,2,3].map(n=>`asset-staging/remainder66-v20260817/batch${n}.json`);
const posts=batchFiles.flatMap(f=>JSON.parse(fs.readFileSync(f,'utf8')).posts||[]);
if(posts.length!==66) throw new Error(`expected 66 posts, got ${posts.length}`);

const outSvg='asset-staging/remainder66-v20260817/svg';
const outManifest='asset-staging/remainder66-v20260817/manifest.json';
fs.mkdirSync(outSvg,{recursive:true});

const safeBoss={
  choose:'images/brand/hd-v20260812/choose.jpg',
  faq:'images/brand/hd-v20260812/faq.png',
  brand:'images/brand/hd-v20260812/brand-story.png'
};
const productMap={
  drink30:{label:'龜鹿飲30cc',file:'images/products-v3/guilu-drink-30.jpg'},
  drink180:{label:'龜鹿飲180cc',file:'images/products-v3/guilu-drink-180.jpg'},
  gao:{label:'龜鹿膏100g',file:'images/products-v3/guilu-gao.jpg'},
  jiao:{label:'龜鹿膠600g',file:'images/products-v3/guilu-jiao.jpg'},
  luerong:{label:'鹿茸粉75g',file:'images/products-v3/luerong-fen.jpg'},
  tangkuai:{label:'龜鹿湯塊75g',file:'images/products-v3/guilu-tangkuai.jpg'}
};
const palettes=[
  ['#102b46','#f7f1e4','#b61d1d','#d4af37'],['#17382f','#f5eee0','#9f2e28','#c79a44'],['#3c3028','#f7efe2','#a32724','#d7b66a'],
  ['#263d55','#f4efe6','#8f2828','#c6a25e'],['#38412c','#f6f0e4','#a52a27','#d1aa57'],['#462f2a','#f6eadc','#982624','#d5ad62']
];
function esc(s=''){return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');}
function mime(file){const e=path.extname(file).toLowerCase(); return e==='.png'?'image/png':e==='.jpg'||e==='.jpeg'?'image/jpeg':'image/webp';}
function dataUri(file){return `data:${mime(file)};base64,${fs.readFileSync(file).toString('base64')}`;}
function sanitizeCopy(s=''){
  return String(s)
   .replace('如果本來就容易覺得燥熱、睡不好或口乾，也可以減量或隔天再安排。','第一次可以先從較少份量開始，覺得當天不適合時就先暫停，之後再依自己的生活狀況安排。')
   .replace('如果本來容易覺得燥熱、睡不好或口乾，可以減量或隔天再安排。','第一次可以先從較少份量開始，覺得當天不適合時就先暫停，之後再依自己的生活狀況安排。');
}
function bossSource(p){
  const c=(p.category||'')+(p.scene||'')+(p.bg||'');
  if(/品牌|工序|萬華|brand|workshop/.test(c)) return safeBoss.brand;
  if(/保存|FAQ|規格|標示|收納|storage|faq|compare|first_open|order/.test(c)) return safeBoss.faq;
  return safeBoss.choose;
}
function family(p){
  const s=(p.scene||'')+' '+(p.category||'');
  if(/雨|rain/.test(s)) return 'rain';
  if(/熱|hot|炎熱|溫差/.test(s)) return 'weather';
  if(/料理|湯|kitchen|dinner|meal|recipes|thermos|soup/.test(s)) return 'kitchen';
  if(/LINE|諮詢|下單|contact|phone|shipping|order/.test(s)) return 'phone';
  if(/萬華|street|visit|walk/.test(s)) return 'street';
  if(/工序|熬製|workshop|brand/.test(s)) return 'workshop';
  if(/保存|收納|冰箱|storage|fridge|pantry|unbox|整理/.test(s)) return 'storage';
  if(/工作|辦公|office|meeting|business|desk|commute/.test(s)) return 'office';
  if(/行程|calendar|routine|週|schedule/.test(s)) return 'calendar';
  return 'home';
}
function sceneArt(kind,color='#173653'){
 const common=`stroke="${color}" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
 if(kind==='office') return `<g ${common}><rect x="35" y="95" width="170" height="95" rx="10"/><path d="M120 190v38M80 228h80M25 255h230"/><path d="M230 130h48v72h-48z"/><path d="M244 115v-18M230 100h28"/></g>`;
 if(kind==='kitchen') return `<g ${common}><path d="M45 155h200l-18 82H63z"/><path d="M80 155v-25h130v25M105 110c-18-28 18-32 0-58M165 110c-18-28 18-32 0-58"/><path d="M35 255h225"/></g>`;
 if(kind==='rain') return `<g ${common}><path d="M45 145q70-95 150 0q38-38 72 0H45z"/><path d="M155 145v105q0 25 28 25q22 0 22-20"/><path d="M55 55l-10 25M115 40l-8 25M185 50l-10 25M245 62l-9 25"/></g>`;
 if(kind==='weather') return `<g ${common}><circle cx="95" cy="95" r="42"/><path d="M95 20v30M95 140v30M20 95h30M140 95h30M42 42l22 22M148 42l-22 22"/><rect x="185" y="82" width="52" height="145" rx="20"/><path d="M198 62h26M211 62v20"/></g>`;
 if(kind==='phone') return `<g ${common}><rect x="70" y="25" width="135" height="245" rx="24"/><path d="M105 65h65M105 220h65"/><path d="M235 78h55v58h-55l-20 18 5-18h15zM15 125h55v58H15l-20 18 5-18h15z"/></g>`;
 if(kind==='street') return `<g ${common}><path d="M30 250V105l65-45 65 45v145M160 250V72h105v178"/><rect x="65" y="155" width="55" height="95"/><path d="M190 115h45M190 155h45M190 195h45"/></g>`;
 if(kind==='workshop') return `<g ${common}><path d="M65 130h155l-18 100H83z"/><path d="M105 128v-25h75v25"/><path d="M112 230q-18 35 20 55q10-35 25-58q22 38 10 60q50-28 15-65"/><path d="M40 85h35M210 75h45"/></g>`;
 if(kind==='storage') return `<g ${common}><rect x="45" y="30" width="170" height="235" rx="15"/><path d="M45 115h170M45 185h170"/><circle cx="190" cy="73" r="7" fill="${color}"/><circle cx="190" cy="150" r="7" fill="${color}"/><path d="M235 95h50v145h-50zM248 120h24M248 155h24M248 190h24"/></g>`;
 if(kind==='calendar') return `<g ${common}><rect x="38" y="65" width="215" height="190" rx="15"/><path d="M38 115h215M85 40v45M205 40v45"/><path d="M75 155h20M125 155h20M175 155h20M75 200h20M125 200h20M175 200h20"/></g>`;
 return `<g ${common}><path d="M30 145l115-92 115 92v115H30z"/><path d="M110 260v-78h70v78M65 150h35v35H65zM195 150h35v35h-35z"/></g>`;
}
function titleLines(s=''){
 const max=18; const chars=[...String(s)]; let lines=[''];
 for(const ch of chars){ if(lines.at(-1).length>=max && /[，：？；、]/.test(ch)===false) lines.push(''); lines[lines.length-1]+=ch; }
 if(lines.length>3){ lines=[lines[0],lines[1],lines.slice(2).join('')]; }
 return lines.slice(0,3);
}
const finalPosts=[];
for(let i=0;i<posts.length;i++){
 const p={...posts[i],copy:sanitizeCopy(posts[i].copy)};
 const pal=palettes[i%palettes.length]; const [navy,cream,red,gold]=pal;
 const bgFile=bossSource(p); const bg=dataUri(bgFile); const kind=family(p);
 const lines=titleLines(p.title);
 const prodIds=(p.products||[]).filter(x=>productMap[x]).slice(0,4);
 const cardW=prodIds.length<=1?310:prodIds.length===2?190:prodIds.length===3?135:105;
 const gap=prodIds.length<=1?0:14; const start=675;
 const productCards=prodIds.map((id,j)=>{const pr=productMap[id]; const x=start+j*(cardW+gap); return `<g><rect x="${x}" y="930" width="${cardW}" height="270" rx="20" fill="#fffdf8" stroke="${gold}" stroke-width="3"/><image href="${dataUri(pr.file)}" x="${x+10}" y="945" width="${cardW-20}" height="190" preserveAspectRatio="xMidYMid meet"/><text x="${x+cardW/2}" y="1170" text-anchor="middle" class="prod">${esc(pr.label)}</text></g>`}).join('');
 const bullets=(p.bullets||[]).slice(0,3).map((b,j)=>`<g transform="translate(0 ${j*85})"><circle cx="95" cy="1000" r="21" fill="${red}"/><text x="95" y="1008" text-anchor="middle" class="n">${j+1}</text><text x="135" y="1008" class="bullet">${esc(b)}</text></g>`).join('');
 const cropX=-100-(i%4)*45; const flip=(i%2)===1;
 const bgTransform=flip?`translate(1080 0) scale(-1 1)`:'';
 const titleSvg=lines.map((line,j)=>`<text x="65" y="${190+j*72}" class="title">${esc(line)}</text>`).join('');
 const sceneCaption=esc(`${p.category}｜${p.scene}`);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><defs><linearGradient id="shade" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${navy}" stop-opacity=".90"/><stop offset=".57" stop-color="${navy}" stop-opacity=".35"/><stop offset="1" stop-color="${navy}" stop-opacity=".08"/></linearGradient><style>text{font-family:'Noto Sans CJK TC','Noto Sans TC','PingFang TC',sans-serif}.title{font-family:'Noto Serif CJK TC','Noto Serif TC',serif;font-size:52px;font-weight:800;fill:#fffaf0}.kicker{font-size:28px;font-weight:700;fill:#fffaf0}.scene{font-size:22px;font-weight:700;fill:${navy}}.bullet{font-size:22px;font-weight:650;fill:${navy}}.n{font-size:19px;font-weight:800;fill:white}.prod{font-size:18px;font-weight:800;fill:${navy}}.foot{font-family:'Noto Serif CJK TC','Noto Serif TC',serif;font-size:28px;font-weight:750;fill:#f5e8c4}.sceneSmall{font-size:18px;fill:${navy}}</style></defs><rect width="1080" height="1350" fill="${cream}"/><clipPath id="hero"><rect width="1080" height="790"/></clipPath><g clip-path="url(#hero)" transform="${bgTransform}"><image href="${bg}" x="${cropX}" y="0" width="1260" height="790" preserveAspectRatio="xMidYMid slice"/></g><rect width="1080" height="790" fill="url(#shade)"/><rect x="55" y="50" width="380" height="56" rx="28" fill="${red}" fill-opacity=".94" stroke="${gold}" stroke-width="2"/><text x="82" y="88" class="kicker">仙加味｜${esc(p.category)}</text>${titleSvg}<g transform="translate(62 455)"><rect width="350" height="275" rx="30" fill="#fffaf0" fill-opacity=".93" stroke="${gold}" stroke-width="3"/><g transform="translate(30 10) scale(.83)">${sceneArt(kind,navy)}</g><text x="175" y="245" text-anchor="middle" class="scene">${sceneCaption}</text></g><rect x="0" y="790" width="1080" height="490" fill="${cream}"/><text x="62" y="860" class="scene">這篇的生活場景</text>${bullets}<text x="675" y="890" class="scene">正式產品實物</text>${productCards || `<g><rect x="675" y="930" width="310" height="270" rx="20" fill="#fffdf8" stroke="${gold}" stroke-width="3"/><text x="830" y="1050" text-anchor="middle" class="scene">仙加味</text><text x="830" y="1092" text-anchor="middle" class="sceneSmall">品牌／工序情境</text></g>`}<rect x="0" y="1280" width="1080" height="70" fill="${navy}"/><text x="540" y="1324" text-anchor="middle" class="foot">仙加味｜補養，是一種節奏。</text></svg>`;
 fs.writeFileSync(path.join(outSvg,`${p.id}.svg`),svg);
 finalPosts.push({...p,image_path:`images/posts/remainder66-v20260817/${p.id}.webp`,image_url:`https://ts15825868.github.io/xianjiawei/images/posts/remainder66-v20260817/${p.id}.webp`,image_source:'2026-08-17剩餘66篇正式重製｜網站同款Q版小老闆｜明確生活場景｜產品使用仙加味正式實物圖等比例呈現｜非AI重畫產品｜人工待審核'});
}
const ids=new Set(finalPosts.map(p=>p.id)); const titles=new Set(finalPosts.map(p=>p.title)); const copies=new Set(finalPosts.map(p=>p.copy)); const urls=new Set(finalPosts.map(p=>p.image_url));
if(ids.size!==66||titles.size!==66||copies.size!==66||urls.size!==66) throw new Error(`uniqueness ids=${ids.size} titles=${titles.size} copies=${copies.size} urls=${urls.size}`);
for(const p of finalPosts){ if(!p.copy.includes('仙加味')) throw new Error(`${p.id}: missing brand link`); if((p.title+p.copy).includes('台興山產')) throw new Error(`${p.id}: blocked name`); }
fs.writeFileSync(outManifest,JSON.stringify({version:'2026-08-17-remainder66-v1',count:66,posts:finalPosts},null,2)+'\n');
console.log('PASS rendered SVG source specs:',finalPosts.length,'unique titles/copy/images');
