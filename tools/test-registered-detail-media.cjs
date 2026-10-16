'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const context={window:{},location:{href:'https://ts15825868.github.io/xianjiawei/product-guilu-gao.html',pathname:'/xianjiawei/product-guilu-gao.html'},URL,document:{readyState:'loading',addEventListener(){}}};
vm.createContext(context);
for(const file of ['site-product-media-authority.js','site-product-image-safety.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context);
const safety=context.window.XJWProductImageSafety;
for(const product of Object.values(context.window.XJW_PRODUCT_MEDIA_AUTHORITY.products)){
 for(const detail of product.detailImages){
  assert.equal(safety.match(detail),'','registered detail must not be rewritten');
  assert.equal(safety.match(new URL(detail+'?v=verification',context.location.href).href),'','cache query cannot retire registered details');
 }
}
// All CURRENTLY PUBLIC partner detail photos must remain untouched by the legacy main-image repair layer.
const catalog=JSON.parse(fs.readFileSync('partner-catalog.json','utf8'));
for(const item of catalog.products.filter(x=>x.public===true&&x.image&&Array.isArray(x.detailImages)&&x.detailImages.length)){
 const registered=context.window.XJW_PRODUCT_MEDIA_AUTHORITY.detailImages(item.id);
 const main=context.window.XJW_PRODUCT_MEDIA_AUTHORITY.mainImage(item.id);
 assert(!main || main===item.image.split('?')[0],item.id+' main must agree with latest partner catalog');
 for(const file of item.detailImages){
  assert(registered.includes(file),item.id+' detail is not registered: '+file);
  assert(fs.existsSync(file),item.id+' detail file missing: '+file);
  assert.equal(safety.match(file),'',item.id+' detail must not become a main image');
  assert.equal(safety.match(new URL(file+'?v=20261016',context.location.href).href),'',item.id+' query version must remain detail');
 }
}
assert.equal(safety.match('images/guilu-gao.jpg'),'gao','legacy unregistered photo still maps to official main');
assert.equal(safety.match('images/dm-final/01_guilu-gao-100g-dm.jpg'),'','detail DM remains intact');
console.log('PASS: public partner and own-product details survive image safety; latest catalog retains main authority');
