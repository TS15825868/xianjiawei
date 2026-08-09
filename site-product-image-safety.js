"use strict";

/* 正式產品原照安全層 2026-08-10
 * products-v3 六張正式路徑目前直接存放真正產品實拍原圖。
 * 官網所有產品卡、詳頁、快速查看一律使用同一批 products-v3 真原圖；
 * 舊 products-v2、舊DM與30cc瓶裝錯版不得再作正式產品主圖。
 * 所有產品只允許等比例顯示，禁止拉寬、拉高或用 cover 裁切。
 */
(function(){
  const VERSION = "20260810-products-v3-true-originals-v2";
  const OFFICIAL = Object.freeze({
    gao: `images/products-v3/guilu-gao.jpg?v=${VERSION}`,
    drink30: `images/products-v3/guilu-drink-30.jpg?v=${VERSION}`,
    drink180: `images/products-v3/guilu-drink-180.jpg?v=${VERSION}`,
    tangkuai: `images/products-v3/guilu-tangkuai.jpg?v=${VERSION}`,
    jiao: `images/products-v3/guilu-jiao.jpg?v=${VERSION}`,
    luerong: `images/products-v3/luerong-fen.jpg?v=${VERSION}`,
  });
  const IDS = Object.freeze({
    'guilu-gao':'gao',
    'guilu-drink-30':'drink30',
    'guilu-drink-180':'drink180',
    'guilu-tangkuai':'tangkuai',
    'guilu-jiao':'jiao',
    'luerong-fen':'luerong'
  });
  const RULES = Object.freeze([
    {key:'gao',tests:[/products-v2\/guilu-gao\.jpeg/i,/dm-final\/01_guilu-gao-100g-dm\.jpg/i]},
    {key:'drink30',tests:[/products-v2\/guilu-drink-30\.jpeg/i,/guilu-drink-30cc-glass\.jpg/i,/dm-final\/02_guilu-drink-30cc-dm\.jpg/i,/guilu-drink-30-clean\.svg/i,/30cc[^/]*(?:bottle|瓶)/i]},
    {key:'drink180',tests:[/products-v2\/guilu-drink-180\.jpeg/i,/dm-final\/03_guilu-drink-180cc-dm\.jpg/i]},
    {key:'luerong',tests:[/products-v2\/luerong-fen\.jpeg/i,/dm-final\/04_luerong-fen-75g-dm\.jpg/i]},
    {key:'tangkuai',tests:[/products-v2\/guilu-tangkuai\.jpeg/i,/dm-final\/05_guilu-tangkuai-75g-dm\.jpg/i]},
    {key:'jiao',tests:[/products-v2\/guilu-jiao-open-new\.jpg/i,/dm-final\/06_guilu-jiao-600g-dm\.jpg/i]},
  ]);
  const ALT = Object.freeze({
    gao:'龜鹿膏100g正式實際產品照片',
    drink30:'龜鹿飲30cc小玻璃裸罐正式實際產品照片',
    drink180:'龜鹿飲180cc狹長鋁袋正式實際產品照片',
    tangkuai:'龜鹿湯塊75g深藍盒正式實際產品照片',
    jiao:'龜鹿膠600g淡紫盒正式實際產品照片',
    luerong:'鹿茸粉75g白色塑膠罐正式實際產品照片',
  });

  function match(value){
    const text=String(value||'');
    if(/products-v3\//i.test(text)) return '';
    for(const rule of RULES){if(rule.tests.some((test)=>test.test(text)))return rule.key;}
    return '';
  }
  function officialFor(value){const key=match(value);return key?OFFICIAL[key]:'';}
  function forceImage(node,key){
    if(!node||!key||!OFFICIAL[key])return;
    node.setAttribute('src',OFFICIAL[key]);
    node.alt=ALT[key];
    node.style.objectFit='contain';
    node.style.objectPosition='center';
    node.style.width='100%';
    node.style.height='100%';
    node.style.maxWidth='100%';
    node.style.maxHeight='100%';
    node.style.transform='none';
    node.style.clipPath='none';
    node.dataset.xjwOfficialProduct=key;
    node.dataset.xjwProductPhoto='products-v3';
    node.dataset.xjwScalePolicy='uniform-only';
  }
  function repairNode(node,attr){
    const value=node.getAttribute(attr)||'';
    const key=match(value);if(!key)return;
    node.setAttribute(attr,OFFICIAL[key]);
    if(node.tagName==='IMG')forceImage(node,key);
    if(node.tagName==='A'){
      const label=(node.textContent||'').trim();
      if(/DM|海報|大圖|產品圖/.test(label))node.textContent='開啟正式實際產品照片';
      node.title='正式產品主圖以核准實際產品照片為準；不得改變產品比例、尺寸觀感或包裝。';
    }
  }
  function keyFromProductCard(card){return IDS[String(card?.dataset?.productId||'').trim()]||'';}
  function keyFromLocation(){
    const path=location.pathname.toLowerCase();
    if(path.includes('product-guilu-drink-30cc'))return 'drink30';
    if(path.includes('product-guilu-drink-180cc'))return 'drink180';
    if(path.includes('product-guilu-gao'))return 'gao';
    if(path.includes('product-guilu-tangkuai'))return 'tangkuai';
    if(path.includes('product-guilu-jiao'))return 'jiao';
    if(path.includes('product-luerong-fen'))return 'luerong';
    return '';
  }
  function keyFromModal(modal){
    const text=String(modal?.textContent||'');
    if(/30\s*cc/.test(text))return 'drink30';
    if(/180\s*cc/.test(text))return 'drink180';
    if(/龜鹿膏/.test(text))return 'gao';
    if(/龜鹿湯塊/.test(text))return 'tangkuai';
    if(/龜鹿膠/.test(text))return 'jiao';
    if(/鹿茸粉/.test(text))return 'luerong';
    return '';
  }
  function forceKnownSurfaces(root=document){
    root.querySelectorAll?.('.product-card[data-product-id]').forEach(card=>{
      const key=keyFromProductCard(card);const img=card.querySelector('.product-card__img img, img');if(key&&img)forceImage(img,key);
    });
    const detailKey=keyFromLocation();
    if(detailKey){
      document.querySelectorAll('.product-detail-hero__media img').forEach(img=>forceImage(img,detailKey));
      document.querySelectorAll('.product-detail-hero__media a').forEach(a=>{a.href=OFFICIAL[detailKey];a.title='開啟正式實際產品照片';});
    }
    const modal=document.getElementById('product-modal');
    if(modal&&modal.classList.contains('show')){
      const key=keyFromModal(modal);if(key){modal.querySelectorAll('img').forEach(img=>forceImage(img,key));modal.querySelectorAll('a[href*="dm-final"],a[href*="products-v2"]').forEach(a=>{a.href=OFFICIAL[key];});}
    }
  }
  function repair(root){
    const scope=root?.querySelectorAll?root:document;
    scope.querySelectorAll('img[src], source[srcset]').forEach((node)=>repairNode(node,node.tagName==='SOURCE'?'srcset':'src'));
    scope.querySelectorAll('a[href], [data-dm-src]').forEach((node)=>{
      repairNode(node,'href');
      const dm=node.getAttribute('data-dm-src')||'';const key=match(dm);if(key)node.setAttribute('data-dm-src',OFFICIAL[key]);
    });
    forceKnownSurfaces(scope);
  }
  let queued=false;
  function queueRepair(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;repair(document);});}
  function start(){
    repair(document);
    const observer=new MutationObserver(queueRepair);
    observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src','href','class']});
  }
  window.XJWProductImageSafety=Object.freeze({version:VERSION,official:OFFICIAL,rules:RULES,match,officialFor,repair,forceKnownSurfaces});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
