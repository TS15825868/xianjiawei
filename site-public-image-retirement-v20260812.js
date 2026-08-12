"use strict";

/* 仙加味公開網站舊圖退役層｜2026-08-12 public-image-hotfix-v4
 * 目的：任何舊程式若再次插入 approved-v405 的生成式產品圖／產品拼圖，公開頁立即退役。
 * 六個產品型態改回使用者確認的六張正式產品圖；含多產品的舊情境拼圖不再出現在公開 DOM。
 */
(function(){
  if(window.__XJW_PUBLIC_IMAGE_RETIREMENT_20260812__)return;
  window.__XJW_PUBLIC_IMAGE_RETIREMENT_20260812__=true;

  const VERSION='20260812-public-image-hotfix-v4';
  const PRODUCT_REPLACEMENTS=Object.freeze({
    'product-guilu-gao-100g.webp':`images/customer-display-v20260812/guilu-gao.webp?v=${VERSION}`,
    'product-guilu-drink-30cc.webp':`images/customer-display-v20260812/guilu-drink-30cc.webp?v=${VERSION}`,
    'product-guilu-drink-180cc.webp':`images/customer-display-v20260812/guilu-drink-180cc.webp?v=${VERSION}`,
    'product-guilu-tangkuai-75g.webp':`images/customer-display-v20260812/guilu-tangkuai.webp?v=${VERSION}`,
    'product-guilu-jiao-600g.webp':`images/customer-display-v20260812/guilu-jiao.webp?v=${VERSION}`,
    'product-luerong-fen-75g.webp':`images/customer-display-v20260812/luerong-fen.webp?v=${VERSION}`
  });
  const COMPOSITES=new Set([
    'home-brand.webp',
    'products-all.webp',
    'contact-line.webp',
    'combo.webp',
    'guide-how-to-use.webp'
  ]);
  const APPROVED_PREFIX='images/brand/approved-v405/';
  const SAFE_FALLBACK=`images/logo.png?v=${VERSION}`;

  function clean(value=''){
    try{return new URL(String(value||''),location.href).pathname.replace(/^.*\/xianjiawei\//,'');}
    catch{return String(value||'').split('?')[0].replace(/^\//,'');}
  }
  function basename(value=''){const path=clean(value);return path.split('/').pop()||'';}
  function isRetiredComposite(value=''){
    const path=clean(value);
    return path.includes(APPROVED_PREFIX)&&COMPOSITES.has(basename(path));
  }
  function productReplacement(value=''){
    const path=clean(value);
    if(!path.includes(APPROVED_PREFIX))return'';
    return PRODUCT_REPLACEMENTS[basename(path)]||'';
  }
  function removeCompositeContext(img){
    const mascot=img.closest('.xjw-mascot-context, .xjw-mascot-section');
    if(mascot){mascot.remove();return true;}
    return false;
  }
  function repairImage(img){
    const src=img.getAttribute('src')||'';
    const replacement=productReplacement(src);
    if(replacement){
      img.src=replacement;
      img.style.objectFit='contain';
      img.style.objectPosition='center';
      img.style.transform='none';
      img.dataset.xjwRetiredLegacyProduct='1';
      return;
    }
    if(isRetiredComposite(src)){
      if(removeCompositeContext(img))return;
      img.src=SAFE_FALLBACK;
      img.alt=img.alt||'仙加味';
      img.style.objectFit='contain';
      img.style.objectPosition='center';
      img.style.transform='none';
      img.dataset.xjwRetiredLegacyComposite='1';
    }
  }
  function repairLink(link){
    const href=link.getAttribute('href')||'';
    const replacement=productReplacement(href);
    if(replacement){link.href=replacement;return;}
    if(isRetiredComposite(href))link.href='index.html';
  }
  function repair(root=document){
    root.querySelectorAll?.('img[src]').forEach(repairImage);
    root.querySelectorAll?.('a[href]').forEach(repairLink);
  }
  let queued=false;
  function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;repair(document);});}
  function start(){repair(document);new MutationObserver(queue).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src','href']});}

  window.XJWPublicImageRetirement=Object.freeze({version:VERSION,productReplacements:PRODUCT_REPLACEMENTS,retiredComposites:[...COMPOSITES],repair});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
