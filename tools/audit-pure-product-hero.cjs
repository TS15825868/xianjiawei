"use strict";
// Primary pack photos must be authentic, intact where source permits, and
// consistent across home, listing, individual hero, and runtime authority.
const fs=require("node:fs");
const path=require("node:path");
const names={
 "guilu-gao":["product-guilu-gao.html","webp"],
 "guilu-drink-30":["product-guilu-drink-30cc.html","png"],
 "guilu-drink-180":["product-guilu-drink-180cc.html","png"],
 "luerong-fen":["product-luerong-fen.html","png"],
 "jinan-sisheng-siwuyin":["product-jinan-siwuyin.html","webp"],
 "danshen-tea-collection":["product-danshen-tea.html","webp"],
 "guilu-vitality":["product-guilu-vitality.html","webp"],
 "uboss-sizhenbao":["product-four-treasures.html","webp"],
 "royalherb-erzhenbao-64":["product-er-zhen-bao.html","webp"]
};
const version="20261017-pure-product-v1";
const load=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const manifest=load("images/catalog-pure-v20261017/manifest.json");
const partner=load("partner-catalog.json").products;
const mediaJs=fs.readFileSync("site-product-media-authority.js","utf8");
const home=fs.readFileSync("index.html","utf8");
const listing=fs.readFileSync("products.html","utf8");
const css=fs.readFileSync("site.css","utf8");
const errors=[];
function check(ok,comment){if(!ok)errors.push(comment)}
for(const [id,[page,ext]] of Object.entries(names)){
 const expected="images/catalog-pure-v20261017/"+id+(["guilu-gao","uboss-sizhenbao","royalherb-erzhenbao-64"].includes(id)?"-main-framed.webp":"-main."+ext);
 const source=manifest.items.find(i=>i.file===expected);
 check(source&&fs.existsSync(source.source),id+" missing physical photo source");
 check(source?.preserved===true&&source?.redrawn===false,id+" source integrity metadata lost");
 check(fs.existsSync(expected),id+" missing published pure product image");
 if(fs.existsSync(expected)){
  const f=fs.readFileSync(expected);const valid=ext==="png"
   ? f.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
   : f.subarray(0,4).toString()==="RIFF"&&f.subarray(8,12).toString()==="WEBP";
  check(f.length>30000&&valid,id+" main file damaged");
 }
 for(const [filename,txt] of [["index.html",home],["products.html",listing],[page,fs.readFileSync(page,"utf8")],["site-product-media-authority.js",mediaJs]]){
  check(txt.includes(expected),filename+" main source differs for "+id);
 }
 const product=partner.find(p=>p.id===id);
 if(product?.public===true)check(product.image===expected,"partner image differs for "+id);
}
check(css.includes("catalog-pure-v20261017")&&css.includes("object-fit:contain"),"new contain and no-crop styling missing");
check(home.includes("site.css?v="+version)&&listing.includes("site.js?v="+version),"public assets cache versions not aligned");
for(const old of ["images/partner-products/scenes-v20261016/four-treasures-front-scene.webp","images/partner-products/scenes-v20261016/er-zhen-bao-royalherb-original-scene.webp"]){
 check(!home.includes(old)&&!listing.includes(old),"old decorative main still linked: "+old);
}
for(const id of ["guilu-drink-30","guilu-drink-180"]){
 check(fs.readFileSync("trial.html","utf8").includes("catalog-pure-v20261017/"+id+"-main"),"trial photo not in sync: "+id);
}
if(errors.length){console.error(errors.map(x=>"FAIL "+x).join("\n"));process.exit(1)}
console.log("PASS "+Object.keys(names).length+" official pure-product primary photographs, current source evidence, product links, and unchanged real packages");
