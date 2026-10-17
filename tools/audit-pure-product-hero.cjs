"use strict";
// 檢查最新「已確認原廠/使用者實拍」產品圖片，來源可追溯；不鎖定舊版路徑。
const fs=require("node:fs");
const vm=require("node:vm");
const crypto=require("node:crypto");
const read=p=>JSON.parse(fs.readFileSync(p,"utf8"));
const source=read("images/catalog-pure-v20261017/manifest.json");
const origin=read("images/catalog-user-original-v20261017/source-integrity.json");
const owner=read("ops/owner-approved-nine-packages-20261017.json");
const release=read("data/owner-final-product-photo-release-v20261017.json");
const own=read("public-product-master.json").products;
const partner=read("partner-catalog.json").products.filter(p=>p.public===true);
const authoritySource=fs.readFileSync("site-product-media-authority.js","utf8");
const context={window:{}};
vm.runInNewContext(authoritySource,context,{timeout:1500});
const media=context.window.XJW_PRODUCT_MEDIA_AUTHORITY;
const home=fs.readFileSync("index.html","utf8");
const listing=fs.readFileSync("products.html","utf8");
const trial=fs.readFileSync("trial.html","utf8");
const css=fs.readFileSync("site.css","utf8");
const errors=[];
const check=(ok,msg)=>{if(!ok)errors.push(msg);};
const normalized=value=>String(value||"").split("?")[0];
const approvedOwner=new Map();
for(const [id,v] of Object.entries(release.photoOriginals||{}))approvedOwner.set(v.image,{id,sha:v.publishedSha256,sourceSha:v.sourceSha256});
for(const item of release.fiveTeaRectifications||[])approvedOwner.set(item.straightenedMain,{id:item.product,sha:item.publishedSha256,original:item.originalSource});
const ownProductIds=new Set(own.map(p=>p.id));
const current=[...own.map(p=>({id:p.id,page:new URL(p.page,"https://ts15825868.github.io/xianjiawei/").pathname.split("/").pop(),image:media.mainImage(p.id)})),
  ...partner.map(p=>({id:p.id,page:p.page,image:p.image}))];
const verified=new Set();
const verifyPhoto=(id,path)=>{
  const image=normalized(path);
  check(image.startsWith("images/")&&!/(\/staging\/|\/design-review\/)/.test(image),id+" main path is not a reviewed image");
  if(!image.startsWith("images/")||!fs.existsSync(image)){check(false,id+" image missing "+image);return;}
  const data=fs.readFileSync(image);
  const webp=data.subarray(0,4).toString()==="RIFF"&&data.subarray(8,12).toString()==="WEBP";
  const png=data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  check(data.length>30000&&(webp||png),id+" main file has invalid image header/size");
  const digest=crypto.createHash("sha256").update(data).digest("hex");
  const ownerEntry=approvedOwner.get(image);
  const pureEntry=source.items.find(x=>x.file===image);
  const userEntry=origin.photos.find(x=>x.file===image&&x.id===id);
  if(ownerEntry){
    check(digest===ownerEntry.sha,id+" current owner-approved image SHA mismatch");
    if(ownerEntry.sourceSha){
      const original=owner.photos[ownerEntry.id]; // 丹參系列與玫瑰果品項共用同一張經核准的系列代表實拍
      check(!!original&&original.sha256===ownerEntry.sourceSha,id+" owner-provided source SHA not recorded correctly");
    }else if(ownerEntry.original){
      check(fs.existsSync(ownerEntry.original),id+" prior true photographic tea front no longer present");
    }
  }else if(userEntry){
    check(digest===userEntry.mediaSha256,id+" owner-original photo hash mismatch");
    check(/^[0-9a-f]{64}$/.test(userEntry.originalSha256),id+" unverified uploaded source");
  }else if(pureEntry){
    check(pureEntry.preserved===true&&pureEntry.redrawn===false&&fs.existsSync(pureEntry.source),id+" photographed source missing or redrawn");
  }else check(false,id+" photographed packaging provenance not found; add new source evidence instead of locking old version");
};
for(const p of current){
  check(!verified.has(p.id),"duplicate published ID "+p.id);
  verified.add(p.id);
  const image=normalized(p.image);
  verifyPhoto(p.id,image);
  const detail=fs.existsSync(p.page)?fs.readFileSync(p.page,"utf8"):"";
  for(const [name,html] of [["homepage",home],["catalog",listing],["detail",detail],["media authority",authoritySource]]){
    check(html.includes(image),p.id+" "+name+" does not show approved full package");
  }
  check(media.mainImage(p.id)===image,p.id+" runtime catalog mismatch");
}
const tea=partner.find(p=>p.id==="danshen-tea-collection");
check(tea&&tea.variants?.length===6,"all six tea variants must remain independent");
if(tea){
 const details=fs.readFileSync(tea.page,"utf8");
 for(const v of tea.variants||[]){
   check(v.id&&v.image,"tea variant missing ID/photo");
   verifyPhoto(v.id,v.image);
   check(details.includes(v.image),v.id+" not linked in formal tea detail page");
   check(media.mainImage(v.id)===v.image,v.id+" variant/photo authority mismatch");
 }
}
for(const id of ["guilu-drink-30","guilu-drink-180"]){
 const currentPath=media.mainImage(id);
 check(trial.includes(currentPath),"trial photo mismatch for current approved "+id);
}
check(css.includes("catalog-owner-final-v20261017/") && css.includes("object-fit:contain") && css.includes("#F7F4ED"),
      "current complete pack style missing for approved carton photos");
for(const old of ["images/partner-products/scenes-v20261016/four-treasures-front-scene.webp",
 "images/partner-products/scenes-v20261016/er-zhen-bao-royalherb-original-scene.webp"]){
 check(!home.includes(old)&&!listing.includes(old),"old decorative image linked "+old);
}
if(errors.length){
 console.error(errors.map(e=>"FAIL "+e).join("\n"));
 process.exitCode=1;
}else console.log("PASS "+current.length+" public SKUs + 6 tea packages: authentic SHA-tracked images, full package CSS and current trial routes");
