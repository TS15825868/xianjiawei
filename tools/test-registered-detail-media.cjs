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
assert.equal(safety.match('images/guilu-gao.jpg'),'gao','legacy unregistered photo still maps to official main');
assert.equal(safety.match('images/dm-final/01_guilu-gao-100g-dm.jpg'),'','detail DM remains intact');
console.log('PASS: registered details survive image safety; legacy main fallback stays active');
