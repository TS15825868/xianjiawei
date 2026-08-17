import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const W=1080,H=1350;

const FORMAL_PRODUCT={
  gao:'images/products-v3/guilu-gao.jpg',
  drink30:'images/products-v3/guilu-drink-30.jpg',
  drink180:'images/products-v3/guilu-drink-180.jpg',
  luerong:'images/products-v3/luerong-fen.jpg',
  tangkuai:'images/products-v3/guilu-tangkuai.jpg',
  jiao:'images/products-v3/guilu-jiao.jpg',
};
const PRODUCT_BOX={
  gao:[175,220],
  drink30:[105,175],
  drink180:[155,240],
  luerong:[155,210],
  tangkuai:[190,220],
  jiao:[210,245],
};
const HERO={
  default:'images/brand/approved-v405/home-brand.webp',
  work:'images/brand/approved-v405/faq.webp',
  kitchen:'images/brand/approved-v405/recipes.webp',
  consult:'images/brand/approved-v405/contact-line.webp',
  brand:'images/brand/approved-v405/brand-story.webp',
  choose:'images/brand/approved-v405/choose.webp',
  use:'images/brand/approved-v405/guide-how-to-use.webp',
};

const hash=s=>[...String(s)].reduce((a,c)=>((a*33+c.charCodeAt(0))>>>0),5381);

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
  const shift=(seed%5)*13;
  const common=`<defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff5df" stop-opacity=".02"/><stop offset="1" stop-color="#102b43" stop-opacity=".18"/></linearGradient></defs><rect width="1080" height="1350" fill="url(#shade)"/>`;
  const table=`<path d="M500 1035 L1080 965 L1080 1350 L455 1350 Z" fill="#65432d" opacity=".48"/><path d="M500 1035 L1080 965" stroke="#d0a56e" stroke-width="8" opacity=".35"/>`;
  const window=`<rect x="655" y="125" width="315" height="345" rx="18" fill="#eaf3ee" opacity=".10" stroke="#f2dfbd" stroke-width="10"/><line x1="812" y1="135" x2="812" y2="460" stroke="#f2dfbd" stroke-width="8" opacity=".42"/><line x1="665" y1="297" x2="960" y2="297" stroke="#f2dfbd" stroke-width="8" opacity=".42"/>`;
  let body='';
  if(kind==='work') body=`${window}${table}<rect x="725" y="760" width="230" height="150" rx="16" fill="#273846" opacity=".42"/><rect x="765" y="925" width="170" height="16" rx="8" fill="#ead7b3" opacity=".55"/>`;
  else if(kind==='storage') body=`${table}<rect x="710" y="180" width="270" height="650" rx="30" fill="#efe8da" opacity=".35" stroke="#c8b28b" stroke-width="9"/><line x1="720" y1="500" x2="970" y2="500" stroke="#b4a284" stroke-width="7" opacity=".55"/><rect x="915" y="300" width="12" height="105" rx="6" fill="#887864" opacity=".7"/>`;
  else if(kind==='kitchen') body=`${window}${table}<ellipse cx="820" cy="1015" rx="215" ry="58" fill="#2f241d" opacity=".40"/><ellipse cx="820" cy="955" rx="175" ry="78" fill="#8b6748" opacity=".45"/><path d="M735 910 Q765 830 795 910 M835 900 Q865 800 900 900" stroke="#fff0d4" stroke-width="14" fill="none" opacity=".42"/>`;
  else if(kind==='rain') body=`${window}${table}<g stroke="#d5e7ee" stroke-width="7" opacity=".45">${Array.from({length:11},(_,i)=>`<line x1="${620+(i%5)*78}" y1="${125+(i*53)%390}" x2="${598+(i%5)*78}" y2="${185+(i*53)%390}"/>`).join('')}</g><path d="M750 930 Q860 780 970 930 Z" fill="#344958" opacity=".42"/>`;
  else if(kind==='outdoor') body=`<path d="M610 1350 L770 520 L955 520 L1080 1350 Z" fill="#c9a978" opacity=".15"/><path d="M810 1350 L867 520" stroke="#f5e4c7" stroke-width="9" opacity=".24"/><circle cx="1010" cy="240" r="92" fill="#59734e" opacity=".25"/>`;
  else if(kind==='consult') body=`${table}<rect x="760" y="300" width="180" height="350" rx="28" fill="#293d50" opacity=".44"/><rect x="782" y="345" width="136" height="245" rx="16" fill="#e6eee7" opacity=".42"/><circle cx="850" cy="620" r="14" fill="#d5c29f" opacity=".65"/>`;
  else if(kind==='brand') body=`${table}<rect x="680" y="170" width="290" height="510" rx="18" fill="#50392d" opacity=".34"/><line x1="695" y1="335" x2="955" y2="335" stroke="#d3b789" stroke-width="9" opacity=".45"/><line x1="695" y1="500" x2="955" y2="500" stroke="#d3b789" stroke-width="9" opacity=".45"/>`;
  else if(kind==='heat') body=`${window}${table}<circle cx="930" cy="185" r="64" fill="#efb841" opacity=".45"/><rect x="820" y="900" width="60" height="155" rx="26" fill="#d8eae9" opacity=".42" stroke="#718a8b" stroke-width="7"/>`;
  else if(kind==='morning') body=`${window}${table}<circle cx="915" cy="205" r="54" fill="#e9b34c" opacity=".36"/><ellipse cx="820" cy="1040" rx="115" ry="40" fill="#ead8b6" opacity=".36"/>`;
  else if(kind==='season') body=`${window}${table}<path d="M950 180 Q1015 250 965 320 Q900 255 950 180" fill="#c58340" opacity=".32"/><path d="M900 245 Q930 310 880 360 Q830 300 900 245" fill="#8d5d37" opacity=".28"/>`;
  else body=`${window}${table}<circle cx="${930-shift}" cy="835" r="62" fill="#587451" opacity=".20"/><rect x="${910-shift}" y="875" width="38" height="100" rx="18" fill="#775940" opacity=".28"/>`;
  return `<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">${common}${body}</svg>`;
}

async function productLayers(item){
  const products=(item.products||[]).filter(p=>FORMAL_PRODUCT[p]&&fs.existsSync(FORMAL_PRODUCT[p])).slice(0,2);
  const layers=[];
  if(!products.length) return layers;
  let cursor=970;
  for(let i=products.length-1;i>=0;i--){
    const p=products[i];
    const [w,h]=PRODUCT_BOX[p]||[170,220];
    cursor-=w;
    const left=Math.max(560,cursor);
    const top=H-h-110-(i%2)*12;
    const shadow=Buffer.from(`<svg width="${w+24}" height="44" xmlns="http://www.w3.org/2000/svg"><ellipse cx="${(w+24)/2}" cy="23" rx="${Math.max(44,w/2.15)}" ry="15" fill="#0d2234" opacity=".24"/></svg>`);
    const img=await sharp(FORMAL_PRODUCT[p]).resize(w,h,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
    layers.push({input:shadow,left:left-12,top:top+h-18},{input:img,left,top});
    cursor-=28;
  }
  return layers;
}

export async function renderScenePoster(item,index,outPath){
  const kind=sceneKind(item);
  const hero=heroFor(item,kind);
  if(!fs.existsSync(hero)) throw new Error(`missing hero ${hero}`);
  for(const p of (item.products||[]).slice(0,2)){
    if(FORMAL_PRODUCT[p]&&!fs.existsSync(FORMAL_PRODUCT[p])) throw new Error(`missing formal product ${FORMAL_PRODUCT[p]}`);
  }
  const base=await sharp(hero).resize(W,H,{fit:'cover',position:'attention'}).modulate({brightness:0.96,saturation:0.93}).webp({quality:91}).toBuffer();
  const env=Buffer.from(envSvg(kind,hash(item.id)+index));
  const products=await productLayers(item);
  await sharp(base).composite([{input:env,left:0,top:0},...products]).webp({quality:92,effort:6}).toFile(outPath);
  return {kind,hero};
}

export function cacheBusted(url){
  return String(url).replace(/\?.*$/,'')+'?v=20260817-scene3';
}

export function sceneSourceLabel(){
  return '2026-08-17完整生活場景重製v3｜無內嵌文字｜網站同款Q版小老闆｜正式products-v3產品原圖｜30cc與180cc依正式比例縮小｜產品不AI重畫｜人工待審核';
}
