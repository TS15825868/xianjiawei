"use strict";

/* 官網顧客產品圖片安全層 2026-08-10
 * 顧客可見卡片／詳頁／Modal 統一使用 products-v4-final 六項完整顯示層。
 * products-v3 仍是後端／LINE／貼文中心正式原圖權威；本檔只控制公開官網顯示。
 */
(function(){
  const VERSION='20260810-products-v4-final-v1';
  const CUSTOMER=Object.freeze({
    gao:`images/products-v4-final/guilu-gao.svg?v=${VERSION}`,
    drink30:`images/products-v4-final/guilu-drink-30.svg?v=${VERSION}`,
    drink180:`images/products-v4-final/guilu-drink-180.svg?v=${VERSION}`,
    tangkuai:`images/products-v4-final/guilu-tangkuai.svg?v=${VERSION}`,
    jiao:`images/products-v4-final/guilu-jiao.svg?v=${VERSION}`,
    luerong:`images/products-v4-final/luerong-fen.svg?v=${VERSION}`
  });
  const IDS=Object.freeze({'guilu-gao':'gao','guilu-drink-30':'drink30','guilu-drink-180':'drink180','guilu-tangkuai':'tangkuai','guilu-jiao':'jiao','luerong-fen':'luerong'});
  const RULES=Object.freeze([
    {key:'gao',tests:[/products-v[234][^/]*\/guilu-gao/i,/dm-final\/01_guilu-gao-100g-dm\.jpg/i]},
    {key:'drink30',tests:[/products-v[234][^/]*\/guilu-drink-30/i,/guilu-drink-30cc-glass\.jpg/i,/dm-final\/02_guilu-drink-30cc-dm\.jpg/i,/guilu-drink-30-clean\.(?:svg|jpg)/i,/30cc[^/]*(?:bottle|瓶)/i]},
    {key:'drink180',tests:[/products-v[234][^/]*\/guilu-drink-180/i,/dm-final\/03_guilu-drink-180cc-dm\.jpg/i]},
    {key:'luerong',tests:[/products-v[234][^/]*\/luerong-fen/i,/dm-final\/04_luerong-fen-75g-dm\.jpg/i]},
    {key:'tangkuai',tests:[/products-v[234][^/]*\/guilu-tangkuai/i,/dm-final\/05_guilu-tangkuai-75g-dm\.jpg/i]},
    {key:'jiao',tests:[/products-v[234][^/]*\/guilu-jiao/i,/dm-final\/06_guilu-jiao-600g-dm\.jpg/i]}
  ]);
  const ALT=Object.freeze({gao:'龜鹿膏100g產品照片',drink30:'龜鹿飲30cc小玻璃罐產品照片',drink180:'龜鹿飲180cc鋁袋產品照片',tangkuai:'龜鹿湯塊75g產品照片',jiao:'龜鹿膠600g產品照片',luerong:'鹿茸粉75g產品照片'});
  function match(value){
    const text=String(value||'');
    if(/products-v4-final\//i.test(text))return'';
    for(const rule of RULES){if(rule.tests.some(test=>test.test(text)))return rule.key;}
    return'';
  }
  function customerFor(value){const key=match(value);return key?CUSTOMER[key]:'';}
  function forceImage(node,key){
    if(!node||!key||!CUSTOMER[key])return;
    node.setAttribute('src',CUSTOMER[key]);
    node.alt=ALT[key];
    node.style.objectFit='contain';node.style.objectPosition='center';node.style.width='100%';node.style.height='100%';node.style.maxWidth='100%';node.style.maxHeight='100%';node.style.transform='none';node.style.clipPath='none';
    node.dataset.xjwOfficialProduct=key;node.dataset.xjwProductPhoto='products-v4-final-customer-display';node.dataset.xjwScalePolicy='uniform-only-contain-no-crop';
  }
  function repairNode(node,attr){
    const value=node.getAttribute(attr)||'';const key=match(value);if(!key)return;
    node.setAttribute(attr,CUSTOMER[key]);
    if(node.tagName==='IMG')forceImage(node,key);
    if(node.tagName==='A'){const label=(node.textContent||'').trim();if(/DM|海報|大圖|產品圖/.test(label))node.textContent='查看產品照片';node.title='查看產品照片';}
  }
  function keyFromProductCard(card){return IDS[String(card?.dataset?.productId||'').trim()]||'';}
  function keyFromLocation(){const path=location.pathname.toLowerCase();if(path.includes('product-guilu-drink-30cc'))return'drink30';if(path.includes('product-guilu-drink-180cc'))return'drink180';if(path.includes('product-guilu-gao'))return'gao';if(path.includes('product-guilu-tangkuai'))return'tangkuai';if(path.includes('product-guilu-jiao'))return'jiao';if(path.includes('product-luerong-fen'))return'luerong';return'';}
  function keyFromModal(modal){const text=String(modal?.textContent||'');if(/30\s*cc/.test(text))return'drink30';if(/180\s*cc/.test(text))return'drink180';if(/龜鹿膏/.test(text))return'gao';if(/龜鹿湯塊/.test(text))return'tangkuai';if(/龜鹿膠/.test(text))return'jiao';if(/鹿茸粉/.test(text))return'luerong';return'';}
  function forceKnownSurfaces(root=document){
    root.querySelectorAll?.('.product-card[data-product-id]').forEach(card=>{const key=keyFromProductCard(card),img=card.querySelector('.product-card__img img, img');if(key&&img)forceImage(img,key);});
    const detailKey=keyFromLocation();
    if(detailKey){document.querySelectorAll('.product-detail-hero__media img').forEach(img=>forceImage(img,detailKey));document.querySelectorAll('.product-detail-hero__media a').forEach(a=>{a.href=CUSTOMER[detailKey];a.title='查看產品照片';});}
    const modal=document.getElementById('product-modal');
    if(modal&&modal.classList.contains('show')){const key=keyFromModal(modal);if(key){modal.querySelectorAll('img').forEach(img=>forceImage(img,key));modal.querySelectorAll('a[href]').forEach(a=>{if(match(a.href))a.href=CUSTOMER[key];});}}
  }
  function repair(root){
    const scope=root?.querySelectorAll?root:document;
    scope.querySelectorAll('img[src], source[srcset]').forEach(node=>repairNode(node,node.tagName==='SOURCE'?'srcset':'src'));
    scope.querySelectorAll('a[href], [data-dm-src]').forEach(node=>{repairNode(node,'href');const dm=node.getAttribute('data-dm-src')||'',key=match(dm);if(key)node.setAttribute('data-dm-src',CUSTOMER[key]);});
    forceKnownSurfaces(scope);
  }
  let queued=false;function queueRepair(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;repair(document);});}
  function start(){repair(document);const observer=new MutationObserver(queueRepair);observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src','href','class']});}
  window.XJWProductImageSafety=Object.freeze({version:VERSION,customer:CUSTOMER,rules:RULES,match,customerFor,repair,forceKnownSurfaces});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();