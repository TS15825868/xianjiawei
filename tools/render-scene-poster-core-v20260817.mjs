import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const W=1080,H=1350;
const NAVY='#173a5f',CREAM='#f7f1e6',RED='#a62821',GOLD='#c79a48',GREEN='#344c38',INK='#18293b';
const FONT_SANS=path.resolve('assets/fonts/NotoSansTC-Regular.ttf');
const FONT_SERIF=path.resolve('assets/fonts/NotoSerifTC-Bold.ttf');

const FORMAL_PRODUCT={
  gao:'images/dm-final/01_guilu-gao-100g-dm.jpg',
  drink30:'images/dm-final/02_guilu-drink-30cc-dm-official-v20260814.jpg',
  drink180:'images/dm-final/03_guilu-drink-180cc-dm.jpg',
  luerong:'images/dm-final/04_luerong-fen-75g-dm.jpg',
  tangkuai:'images/dm-final/05_guilu-tangkuai-75g-dm.jpg',
  jiao:'images/dm-final/06_guilu-jiao-600g-dm.jpg',
};
const PRODUCT_LABEL={gao:'龜鹿膏100g',drink30:'龜鹿飲30cc',drink180:'龜鹿飲180cc',luerong:'鹿茸粉75g',tangkuai:'龜鹿湯塊75g',jiao:'龜鹿膠600g'};
const HERO={
  default:'images/brand/approved-v405/home-brand.webp',
  work:'images/brand/approved-v405/faq.webp',
  kitchen:'images/brand/approved-v405/recipes.webp',
  consult:'images/brand/approved-v405/contact-line.webp',
  brand:'images/brand/approved-v405/brand-story.webp',
  choose:'images/brand/approved-v405/choose.webp',
  use:'images/brand/approved-v405/guide-how-to-use.webp',
};

const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hash=s=>[...String(s)].reduce((a,c)=>((a*33+c.charCodeAt(0))>>>0),5381);
function wrap(text,max=13,maxLines=3){
  const src=String(text||'').replace(/\s+/g,'').replace(/｜/g,'·'); const out=[]; let cur='';
  for(const ch of src){ if(cur.length>=max){out.push(cur);cur='';if(out.length>=maxLines)break;} cur+=ch; }
  if(cur&&out.length<maxLines)out.push(cur); return out;
}
function sceneKind(item){
  const s=`${item.scene||''} ${item.category||''} ${item.title||''}`;
  if(/雨|rain/.test(s)) return 'rain';
  if(/冰箱|保存|收納|storage|fridge|pantry/.test(s)) return 'storage';
  if(/料理|廚|燉|湯|晚餐|dinner|kitchen/.test(s)) return 'kitchen';
  if(/工作|辦公|work|office|desk/.test(s)) return 'work';
  if(/外出|街|通勤|戶外|out|street|commute/.test(s)) return 'outdoor';
  if(/LINE|諮詢|consult|phone/.test(s)) return 'consult';
  if(/萬華|工藝|火候|品牌|brand|craft|workshop/.test(s)) return 'brand';
  if(/早上|晨|morning/.test(s)) return 'morning';
  if(/下午|afternoon/.test(s)) return 'afternoon';
  if(/悶熱|高溫|暑|heat|summer/.test(s)) return 'heat';
  if(/溫差|換季|season|temperature/.test(s)) return 'season';
  if(/居家|在家|home/.test(s)) return 'home';
  return 'general';
}
function heroFor(item,kind){
  if(item.hero_source&&fs.existsSync(item.hero_source)) return item.hero_source;
  if(kind==='kitchen') return HERO.kitchen;
  if(kind==='work') return HERO.work;
  if(kind==='consult') return HERO.consult;
  if(kind==='brand') return HERO.brand;
  if(/choose|型態|怎麼選/.test(`${item.id} ${item.title}`)) return HERO.choose;
  if(['storage','home','morning','afternoon'].includes(kind)) return HERO.use;
  return HERO.default;
}
function envSvg(kind,seed){
  const v=seed%4; const common=`<defs><linearGradient id="warm" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3da" stop-opacity=".05"/><stop offset="1" stop-color="#0c2742" stop-opacity=".28"/></linearGradient></defs><rect width="1080" height="1350" fill="url(#warm)"/>`;
  const desk=`<path d="M500 1040 L1080 970 L1080 1350 L460 1350 Z" fill="#5e3d28" opacity=".72"/><path d="M500 1040 L1080 970" stroke="#d2a56a" stroke-width="8" opacity=".55"/>`;
  const window=`<rect x="650" y="120" width="330" height="360" rx="18" fill="#e9f2ed" opacity=".18" stroke="#f4e4c1" stroke-width="12"/><line x1="815" y1="130" x2="815" y2="470" stroke="#f4e4c1" stroke-width="9" opacity=".65"/><line x1="660" y1="300" x2="970" y2="300" stroke="#f4e4c1" stroke-width="9" opacity=".65"/>`;
  let body='';
  if(kind==='work') body=`${window}${desk}<rect x="700" y="865" width="260" height="145" rx="12" fill="#313b45" opacity=".82"/><path d="M730 865 L925 865 L900 745 L755 745 Z" fill="#26313a" stroke="#d8c5a1" stroke-width="6"/><rect x="790" y="1070" width="145" height="18" rx="8" fill="#ead9b9" opacity=".78"/><circle cx="950" cy="1080" r="34" fill="#ead9b9" opacity=".82"/>`;
  else if(kind==='storage') body=`${desk}<rect x="675" y="140" width="310" height="730" rx="34" fill="#e8e2d4" opacity=".82" stroke="#c8b894" stroke-width="12"/><line x1="690" y1="490" x2="970" y2="490" stroke="#b3a487" stroke-width="9"/><rect x="900" y="250" width="14" height="130" rx="7" fill="#8b7b66"/><rect x="900" y="585" width="14" height="130" rx="7" fill="#8b7b66"/><rect x="545" y="860" width="410" height="175" rx="14" fill="#8a6444" opacity=".58"/><rect x="580" y="895" width="100" height="75" rx="10" fill="#f2e4c9" opacity=".75"/><rect x="710" y="895" width="100" height="75" rx="10" fill="#f2e4c9" opacity=".75"/>`;
  else if(kind==='kitchen') body=`${window}${desk}<ellipse cx="785" cy="1025" rx="245" ry="64" fill="#2f221b" opacity=".75"/><ellipse cx="785" cy="955" rx="205" ry="95" fill="#8c6949" stroke="#e7cf9f" stroke-width="10"/><path d="M670 900 Q700 820 735 900 M780 880 Q810 770 850 880 M885 905 Q915 820 940 905" stroke="#f5ead5" stroke-width="16" fill="none" opacity=".72"/><rect x="610" y="1085" width="340" height="28" rx="14" fill="#d8b47b" opacity=".6"/>`;
  else if(kind==='rain') body=`${window}${desk}<g stroke="#d7e7ee" stroke-width="8" opacity=".62">${Array.from({length:13},(_,i)=>`<line x1="${620+(i%5)*82}" y1="${120+(i*47)%400}" x2="${595+(i%5)*82}" y2="${190+(i*47)%400}"/>`).join('')}</g><path d="M745 930 Q860 770 975 930 Z" fill="#394b59" opacity=".78"/><path d="M860 930 L860 1060 Q860 1110 910 1110" stroke="#e7d4ae" stroke-width="13" fill="none"/>`;
  else if(kind==='outdoor') body=`<path d="M600 1350 L770 520 L960 520 L1080 1350 Z" fill="#c7a878" opacity=".24"/><path d="M800 1350 L865 520" stroke="#f7ead1" stroke-width="10" opacity=".38"/><rect x="625" y="210" width="330" height="290" rx="18" fill="#dce6df" opacity=".16" stroke="#f2dfbb" stroke-width="9"/><path d="M955 370 Q1030 290 1070 215" stroke="#415f42" stroke-width="24"/><circle cx="1020" cy="220" r="90" fill="#59734d" opacity=".45"/><path d="M560 940 Q655 860 750 940" stroke="#24394e" stroke-width="18" fill="none"/><rect x="580" y="945" width="150" height="130" rx="22" fill="#31435b" opacity=".72"/>`;
  else if(kind==='consult') body=`${desk}<rect x="720" y="285" width="215" height="390" rx="34" fill="#26384c" opacity=".86"/><rect x="742" y="330" width="170" height="285" rx="18" fill="#e7efe8" opacity=".8"/><rect x="765" y="375" width="112" height="44" rx="22" fill="#7cab73"/><rect x="795" y="455" width="92" height="38" rx="19" fill="#d5c6a6"/><rect x="760" y="525" width="125" height="38" rx="19" fill="#7cab73"/><circle cx="825" cy="642" r="16" fill="#d5c6a6"/>`;
  else if(kind==='brand') body=`${desk}<g opacity=".58"><rect x="650" y="150" width="340" height="530" rx="18" fill="#503a2e"/><line x1="665" y1="325" x2="975" y2="325" stroke="#d5b98b" stroke-width="10"/><line x1="665" y1="505" x2="975" y2="505" stroke="#d5b98b" stroke-width="10"/>${[700,790,880].map((x,i)=>`<rect x="${x}" y="${205+(i%2)*22}" width="58" height="92" rx="18" fill="#e6d4b0"/>`).join('')}${[690,805,900].map((x,i)=>`<rect x="${x}" y="${385+(i%2)*18}" width="62" height="90" rx="18" fill="#d9c39d"/>`).join('')}</g><ellipse cx="820" cy="1030" rx="180" ry="58" fill="#31241d" opacity=".64"/><ellipse cx="820" cy="970" rx="150" ry="72" fill="#7c5b3e" opacity=".7"/><path d="M760 920 Q790 830 820 920 M845 910 Q875 810 900 910" stroke="#efe0c3" stroke-width="13" fill="none" opacity=".62"/>`;
  else if(kind==='heat') body=`${window}${desk}<circle cx="920" cy="170" r="70" fill="#efb83f" opacity=".75"/><g stroke="#efb83f" stroke-width="12" opacity=".65">${[0,45,90,135].map(a=>`<line x1="920" y1="55" x2="920" y2="20" transform="rotate(${a} 920 170)"/>`).join('')}</g><rect x="795" y="900" width="72" height="170" rx="30" fill="#d9ebea" opacity=".7" stroke="#6f8b8c" stroke-width="8"/>`;
  else if(kind==='morning') body=`${window}${desk}<circle cx="910" cy="205" r="58" fill="#e9b54d" opacity=".65"/><ellipse cx="805" cy="1040" rx="120" ry="42" fill="#ead7b0" opacity=".7"/><rect x="720" y="970" width="170" height="65" rx="24" fill="#f0e3c5" opacity=".75"/>`;
  else if(kind==='season') body=`${window}${desk}<path d="M955 180 Q1020 250 965 325 Q900 260 955 180" fill="#c6843f" opacity=".56"/><path d="M900 240 Q930 310 875 360 Q825 300 900 240" fill="#8f5e35" opacity=".48"/><rect x="760" y="945" width="180" height="115" rx="24" fill="#dbc49a" opacity=".68"/>`;
  else body=`${window}${desk}<rect x="720" y="930" width="245" height="105" rx="24" fill="#d9c39a" opacity=".5"/><circle cx="965" cy="830" r="68" fill="#587251" opacity=".35"/><rect x="945" y="865" width="40" height="110" rx="18" fill="#785941" opacity=".55"/>`;
  return `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">${common}${body}</svg>`;
}
function textSvg(item,kind,index){
  const title=wrap(item.title,12,3); const bullets=(item.bullets&&item.bullets.length?item.bullets:['明確生活情境','依自己的節奏安排','仙加味日常搭配']).slice(0,3);
  const pill=kind==='work'?'工作空檔':kind==='storage'?'保存整理':kind==='kitchen'?'家常料理':kind==='rain'?'雨天日常':kind==='outdoor'?'外出情境':kind==='consult'?'LINE諮詢':kind==='brand'?'品牌工藝':kind==='morning'?'早上日常':kind==='heat'?'悶熱外出':kind==='season'?'換季溫差':'生活日常';
  const titleSize=title.length>=3?54:62;
  return `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
  <style>@font-face{font-family:noto;src:url('${FONT_SANS}')}@font-face{font-family:serif;src:url('${FONT_SERIF}')} .s{font-family:noto}.ser{font-family:serif}</style>
  <rect x="38" y="42" width="492" height="1030" rx="34" fill="#f7f1e6" fill-opacity=".93" stroke="#c79a48" stroke-width="3"/>
  <rect x="70" y="72" width="225" height="54" rx="27" fill="${NAVY}"/><text x="182" y="108" text-anchor="middle" fill="#f5e5c2" font-size="25" class="s">仙加味｜${esc(pill)}</text>
  ${title.map((l,i)=>`<text x="76" y="${205+i*78}" fill="${INK}" font-size="${titleSize}" font-weight="700" class="ser">${esc(l)}</text>`).join('')}
  <line x1="78" y1="470" x2="490" y2="470" stroke="#d4b06c" stroke-width="3"/>
  ${bullets.map((b,i)=>`<circle cx="95" cy="${540+i*98}" r="22" fill="${i===0?GREEN:NAVY}"/><text x="95" y="${548+i*98}" text-anchor="middle" fill="#fff8e9" font-size="22" class="s">${i+1}</text><text x="135" y="${550+i*98}" fill="${INK}" font-size="29" class="s">${esc(String(b).slice(0,16))}</text>`).join('')}
  <text x="78" y="888" fill="#765f49" font-size="24" class="s">有場景地安排，讓產品回到真正的日常。</text>
  <rect x="0" y="1220" width="1080" height="130" fill="${NAVY}" fill-opacity=".96"/><text x="540" y="1298" text-anchor="middle" fill="#f0cf8b" font-size="34" class="ser">仙加味｜補養，是一種節奏。</text>
  </svg>`;
}
async function productLayers(item){
  const products=(item.products||[]).filter(p=>FORMAL_PRODUCT[p]&&fs.existsSync(FORMAL_PRODUCT[p])).slice(0,2);
  const layers=[]; if(!products.length)return layers;
  const cardW=products.length===1?240:178, cardH=products.length===1?286:230, gap=16;
  for(let i=0;i<products.length;i++){
    const p=products[i], src=FORMAL_PRODUCT[p];
    const img=await sharp(src).resize(cardW-18,cardH-55,{fit:'contain',background:'#f8f0e3'}).jpeg({quality:88}).toBuffer();
    const x=78+i*(cardW+gap); const y=930-(products.length===1?0:0);
    const frame=Buffer.from(`<svg width="${cardW}" height="${cardH}" xmlns="http://www.w3.org/2000/svg"><rect width="${cardW}" height="${cardH}" rx="18" fill="#fffaf0" stroke="#c79a48" stroke-width="3"/><rect x="0" y="${cardH-42}" width="${cardW}" height="42" rx="0" fill="#173a5f"/><text x="${cardW/2}" y="${cardH-14}" text-anchor="middle" font-family="sans-serif" font-size="19" fill="#f6dfb0">${esc(PRODUCT_LABEL[p])}</text></svg>`);
    layers.push({input:frame,left:x,top:y},{input:img,left:x+9,top:y+7});
  }
  return layers;
}
export async function renderScenePoster(item,index,outPath){
  const kind=sceneKind(item); const hero=heroFor(item,kind); if(!fs.existsSync(hero)) throw new Error(`missing hero ${hero}`);
  const base=await sharp(hero).resize(W,H,{fit:'cover',position:'attention'}).modulate({brightness:0.92,saturation:0.88}).webp({quality:90}).toBuffer();
  const env=Buffer.from(envSvg(kind,hash(item.id)+index)); const txt=Buffer.from(textSvg(item,kind,index)); const products=await productLayers(item);
  await sharp(base).composite([{input:env,left:0,top:0},{input:txt,left:0,top:0},...products]).webp({quality:91,effort:6}).toFile(outPath);
  return {kind,hero};
}
export function cacheBusted(url){ return String(url).replace(/\?.*$/,'')+'?v=20260817-scene2'; }
export function sceneSourceLabel(){ return '2026-08-17完整生活場景重製v2｜網站同款Q版小老闆｜辦公／居家／料理／保存／雨天／外出／諮詢等明確場景｜正式產品實物來源｜產品不AI重畫｜人工待審核'; }
