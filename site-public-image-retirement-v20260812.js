"use strict";

/* 仙加味公開網站舊圖退役層｜2026-09-26 v10
 * 一般展示統一使用 products-v3 六項正式主產品圖。
 * 舊雜背景實拍、customer-display 舊檔與 approved-v405 舊產品合成圖若回流，一律導回同一套主圖。
 * dm-final 為完整產品介紹頁詳細圖，不在本層退役。
 */
(function(){
  if(window.__XJW_PUBLIC_IMAGE_RETIREMENT_20260812__)return;
  window.__XJW_PUBLIC_IMAGE_RETIREMENT_20260812__=true;

  const VERSION='20260926-unified-product-main-v32';
  const MAIN=Object.freeze({
    'guilu-gao':`images/products-v3/guilu-gao.jpg?v=${VERSION}`,
    'guilu-drink-30':`images/products-v3/guilu-drink-30.jpg?v=${VERSION}`,
    'guilu-drink-180':`images/products-v3/guilu-drink-180.jpg?v=${VERSION}`,
    'guilu-tangkuai':`images/products-v3/guilu-tangkuai.jpg?v=${VERSION}`,
    'guilu-jiao':`images/products-v3/guilu-jiao.jpg?v=${VERSION}`,
    'luerong-fen':`images/products-v3/luerong-fen.jpg?v=${VERSION}`
  });
  const PRODUCT_REPLACEMENTS=Object.freeze({
    'product-guilu-gao-100g.webp':MAIN['guilu-gao'],
    'product-guilu-drink-30cc.webp':MAIN['guilu-drink-30'],
    'product-guilu-drink-180cc.webp':MAIN['guilu-drink-180'],
    'product-guilu-tangkuai-75g.webp':MAIN['guilu-tangkuai'],
    'product-guilu-jiao-600g.webp':MAIN['guilu-jiao'],
    'product-luerong-fen-75g.webp':MAIN['luerong-fen'],
    'guilu-gao.jpg':MAIN['guilu-gao'],
    'guilu-drink-30cc-glass.jpg':MAIN['guilu-drink-30'],
    'guilu-drink-180cc.jpg':MAIN['guilu-drink-180'],
    'guilu-tangkuai-open-new.jpg':MAIN['guilu-tangkuai'],
    'guilu-jiao-open-new.jpg':MAIN['guilu-jiao'],
    'luerong-fen.jpeg':MAIN['luerong-fen'],
    'guilu-gao.avif':MAIN['guilu-gao'],
    'guilu-drink-30cc.avif':MAIN['guilu-drink-30'],
    'guilu-drink-180cc-product.jpg':MAIN['guilu-drink-180'],
    'guilu-tangkuai.avif':MAIN['guilu-tangkuai'],
    'guilu-jiao.avif':MAIN['guilu-jiao'],
    'luerong-fen.avif':MAIN['luerong-fen']
  });
  const COMPOSITES=new Set(['home-brand.webp','products-all.webp','contact-line.webp','combo.webp','guide-how-to-use.webp']);
  const SAFE_FALLBACK=`images/logo.png?v=${VERSION}`;

  function clean(value=''){
    try{return new URL(String(value||''),location.href).pathname.replace(/^.*\/xianjiawei\//,'');}
    catch{return String(value||'').split('?')[0].replace(/^\//,'');}
  }
  function basename(value=''){const path=clean(value);return path.split('/').pop()||'';}
  function isDetailedDm(value=''){return /\/images\/dm-final\//i.test(String(value||''));}
  function isCurrentMain(value=''){
    const path=clean(value);
    return Object.values(MAIN).some(url=>clean(url)===path);
  }
  function isRetiredComposite(value=''){
    const path=clean(value);
    return path.includes('images/brand/approved-v405/')&&COMPOSITES.has(basename(path));
  }
  function productReplacement(value=''){
    if(isDetailedDm(value)||isCurrentMain(value))return'';
    const path=clean(value),file=basename(path);
    if(!/^(?:images\/|.*\/images\/)/i.test(path))return'';
    return PRODUCT_REPLACEMENTS[file]||'';
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
      img.src=replacement;img.removeAttribute('srcset');
      img.style.objectFit='contain';img.style.objectPosition='center';img.style.transform='none';img.style.clipPath='none';
      img.dataset.xjwRetiredLegacyProduct='1';return;
    }
    if(isRetiredComposite(src)){
      if(removeCompositeContext(img))return;
      img.src=SAFE_FALLBACK;img.alt=img.alt||'仙加味';
      img.style.objectFit='contain';img.style.objectPosition='center';img.style.transform='none';
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

  window.XJWPublicImageRetirement=Object.freeze({version:VERSION,main:MAIN,productReplacements:PRODUCT_REPLACEMENTS,retiredComposites:[...COMPOSITES],repair});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
