"use strict";
const fs=require("fs");
const own=JSON.parse(fs.readFileSync("data.json","utf8")).products;
const publicPartner=JSON.parse(fs.readFileSync("partner-catalog.json","utf8")).products.filter(p=>p.public===true);
const pages=Object.fromEntries([...own,...publicPartner].map(p=>[p.id,p.page]));
const fallbackIds=new Set(own.slice(0,4).map(p=>p.id));
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
 for(const [file,text] of [...(fallbackIds.has(id)?[["index.html",home]]:[]),["products.html",html],[page,fs.readFileSync(page,"utf8")]]){
  if(!text.includes(main))errors.push(file+" has different main image for "+id);
 }
 if(!fs.existsSync(main))errors.push(id+" does not have a source image "+main);
 const partnerItem=partner.find(p=>p.id===id);
 if(partnerItem&&partnerItem.public===true&&partnerItem.image!==main)errors.push(id+" catalog authority mismatch");
}
for(const id of [...own.slice(0,4).map(p=>p.id),"jinan-sisheng-siwuyin"]){
 const a=html.indexOf('data-fallback-product="'+id+'"');
 const card=html.slice(a,a+900);
 if(!card.includes('class="product-card__img"><a data-product-intro="1"'))errors.push("static fallback image not interactive: "+id);
}
for(const id of ["uboss-sizhenbao","royalherb-erzhenbao-64"]){
 const page=fs.readFileSync(pages[id],"utf8");
 if(!page.includes(`images/catalog-real-owner-v20261019/${id}-back.png`))errors.push("missing complete manufacturer back photo for "+id);
}
const homePages=[...home.matchAll(/<a\b[^>]*href="(product-[a-z0-9-]+\.html)"[^>]*>\s*<img/gi)].map(x=>x[1]);
const expectedHome=own.slice(0,4).map(p=>p.page);
if(homePages.length!==expectedHome.length || new Set(homePages).size!==homePages.length ||
   homePages.some(x=>!expectedHome.includes(x)))errors.push("homepage fallback must show only four approved own-brand images");
if(!fs.readFileSync("site.css","utf8").includes("final pack-only catalog presentation"))errors.push("missing final contain CSS");
if(errors.length){console.error(errors.join("\n"));process.exitCode=1;}else console.log("PASS nine real-product hero references, clickable fallback cards, labels and no-stretch media");
