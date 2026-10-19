"use strict";
const fs=require("fs");
const pages={"guilu-gao":"product-guilu-gao.html","guilu-drink-30":"product-guilu-drink-30cc.html","guilu-drink-180":"product-guilu-drink-180cc.html","luerong-fen":"product-luerong-fen.html","jinan-sisheng-siwuyin":"product-jinan-siwuyin.html","danshen-tea-collection":"product-danshen-tea.html","guilu-vitality":"product-guilu-vitality.html","uboss-sizhenbao":"product-four-treasures.html","royalherb-erzhenbao-64":"product-er-zhen-bao.html"};
const html=fs.readFileSync("products.html","utf8");
const home=fs.readFileSync("index.html","utf8");
const media=fs.readFileSync("site-product-media-authority.js","utf8");
const partner=JSON.parse(fs.readFileSync("partner-catalog.json","utf8")).products;
const errors=[];
for(const [id,page] of Object.entries(pages)){
 const pos=media.indexOf('"'+id+'": {');
 const sub=media.slice(pos,pos+330);
 const m=sub.match(/"mainImage": "(images\/[^"]+)"/);
 if(!m){errors.push("media authority missing "+id);continue}
 const main=m[1];
 for(const [file,text] of [["index.html",home],["products.html",html],[page,fs.readFileSync(page,"utf8")]]){
  if(!text.includes(main))errors.push(file+" has different main image for "+id);
 }
 if(!fs.existsSync(main))errors.push(id+" does not have a source image "+main);
 const partnerItem=partner.find(p=>p.id===id);
 if(partnerItem&&partnerItem.public===true&&partnerItem.image!==main)errors.push(id+" catalog authority mismatch");
}
for(const id of ["guilu-gao","guilu-drink-30","guilu-drink-180","luerong-fen","jinan-sisheng-siwuyin"]){
 const a=html.indexOf('data-fallback-product="'+id+'"');
 const card=html.slice(a,a+900);
 if(!card.includes('class="product-card__img"><a data-product-intro="1"'))errors.push("static fallback image not interactive: "+id);
}
for(const id of ["uboss-sizhenbao","royalherb-erzhenbao-64"]){
 const page=fs.readFileSync(pages[id],"utf8");
 if(!page.includes(`images/catalog-real-owner-v20261019/${id}-back.png`))errors.push("missing complete manufacturer back photo for "+id);
}
if(!fs.readFileSync("site.css","utf8").includes("final pack-only catalog presentation"))errors.push("missing final contain CSS");
if(errors.length){console.error(errors.join("\n"));process.exitCode=1;}else console.log("PASS nine real-product hero references, clickable fallback cards, labels and no-stretch media");
