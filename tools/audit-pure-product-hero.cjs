"use strict";
// Guard current published photographed packaging without freezing historical hero paths.
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const crypto=require("node:crypto");
const load=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const partner=load("partner-catalog.json").products.filter(p=>p.public===true);
const own=load("public-product-master.json").products;
const pure=load("images/catalog-pure-v20261017/manifest.json");
const userEvidence=load("images/catalog-user-original-v20261017/source-integrity.json");
const authorityJs=fs.readFileSync("site-product-media-authority.js","utf8");
const context={window:{}};
vm.runInNewContext(authorityJs,context,{timeout:1500});
const media=context.window.XJW_PRODUCT_MEDIA_AUTHORITY;
const home=fs.readFileSync("index.html","utf8");
const listing=fs.readFileSync("products.html","utf8");
const css=fs.readFileSync("site.css","utf8");
const errors=[];
const check=(ok,why)=>{if(!ok)errors.push(why)};
const knownPublic=[...own.map(p=>({id:p.id,page:new URL(p.page).pathname.split("/").pop(),image:media.mainImage(p.id),partner:false})),
                  ...partner.map(p=>({id:p.id,page:p.page,image:p.image,partner:true}))];
const seenIds=new Set();
for(const p of knownPublic){
 check(!seenIds.has(p.id),"duplicated public product "+p.id);seenIds.add(p.id);
 const img=String(p.image||"").split("?")[0];
 check(img.startsWith("images/")&&!/(\/staging\/|\/design-review\/)/.test(img),p.id+" has no approved photo");
 if(!img.startsWith("images/")||!fs.existsSync(img))continue;
 const photo=fs.readFileSync(img);
 const validPng=photo.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const validWebp=photo.subarray(0,4).toString()==="RIFF"&&photo.subarray(8,12).toString()==="WEBP";
 check(photo.length>30000&&(validPng||validWebp),p.id+" invalid photographic file");
 const pureEntry=pure.items.find(x=>x.file===img);
 const userEntry=userEvidence.photos.find(x=>x.file===img&&x.id===p.id);
 if(img.startsWith("images/catalog-user-original-v20261017/")){
   check(!!userEntry,p.id+" owner-photo source mapping missing");
   if(userEntry){
     check(/^[0-9a-f]{64}$/.test(userEntry.originalSha256),"missing genuine uploaded-source SHA for "+p.id);
     check(userEntry.sourceArchive==="新增商品(2).zip","unexpected owner archive for "+p.id);
     check(crypto.createHash("sha256").update(photo).digest("hex")===userEntry.mediaSha256,
           p.id+" public bytes differ from owner-approved actual product cutout");
   }
 }else if(img.startsWith("images/catalog-")){
   check(!!pureEntry,p.id+" old approved source provenance not found");
   if(pureEntry){
     check(pureEntry.preserved===true&&pureEntry.redrawn===false,p.id+" packaging source has AI/redrawn flag");
     check(!!pureEntry.source&&fs.existsSync(pureEntry.source),p.id+" actual photo source missing");
   }
 }else{
   check(img.startsWith("images/partner-products/"),p.id+" image from unreviewed location");
 }
 const detail=fs.existsSync(p.page)?fs.readFileSync(p.page,"utf8"):"";
 for(const [name,html] of [["index.html",home],["products.html",listing],[p.page,detail],
                           ["site-product-media-authority.js",authorityJs]]){
   check(html.includes(img),name+" current actual main-image reference missing for "+p.id);
 }
 check(media.mainImage(p.id)===img,p.id+" current runtime authority and public catalog disagree");
}
check(css.includes("object-fit:contain")&&css.includes("#F7F4ED"),"complete-pack no-crop and ivory styles missing");
for(const old of ["images/partner-products/scenes-v20261016/four-treasures-front-scene.webp",
                   "images/partner-products/scenes-v20261016/er-zhen-bao-royalherb-original-scene.webp"]){
 check(!home.includes(old)&&!listing.includes(old),"old decorative main still linked: "+old);
}
for(const id of ["guilu-drink-30","guilu-drink-180"]){
 check(fs.readFileSync("trial.html","utf8").includes("catalog-pure-v20261017/"+id+"-main"),
       "trial photo mismatch for "+id);
}
if(errors.length){
 console.error(errors.map(e=>"FAIL "+e).join("\n"));
 process.exitCode=1;
}else console.log("PASS "+knownPublic.length+" up-to-date true physical package images and source provenance, no historical old-main locks");
