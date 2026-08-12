"use strict";

/* 官網顧客產品圖片安全層｜2026-08-12 formal-image-fix-v3
 * 顧客產品頁／產品卡：六張使用者確認的正式產品圖優先。
 * DM：獨立媒體角色，由 DM 權威層管理；dm-approved 與 dm-final 目錄不得被產品圖安全層覆蓋。
 * products-v3：只保留為真實產品外觀、包裝與比例的實物身份參考。
 */
(function(){
  const VERSION='20260812-formal-image-fix-v3';
  const CUSTOMER=Object.freeze({
    gao:`images/customer-display-v20260812/guilu-gao.webp?v=${VERSION}`,
    drink30:`images/customer-display-v20260812/guilu-drink-30cc.webp?v=${VERSION}`,
    drink180:`images/customer-display-v20260812/guilu-drink-180cc.webp?v=${VERSION}`,
    tangkuai:`images/customer-display-v20260812/guilu-tangkuai.webp?v=${VERSION}`,
    jiao:`images/customer-display-v20260812/guilu-jiao.webp?v=${VERSION}`,
    luerong:`images/customer-display-v20260812/luerong-fen.webp?v=${VERSION}`
  });
  const OFFICIAL=Object.freeze({
    drink30:'images/products-v3/guilu-drink-30.jpg',
    drink180:'images/products-v3/guilu-drink-180.jpg'
  });
  const IDS=Object.freeze({'guilu-gao':'gao','guilu-drink-30':'drink30','guilu-drink-180':'drink180','guilu-tangkuai':'tangkuai','guilu-jiao':'jiao','luerong-fen':'luerong'});
  const RULES=Object.freeze([
    {key:'gao',tests:[/guilu-gao/i]},
    {key:'drink30',tests:[/guilu-drink-30/i,/30cc[^/]*(?:bottle|瓶)/i]},
    {key:'drink180',tests:[/guilu-drink-180/i]},
    {key:'luerong',tests:[/luerong-fen/i,/lurong-fen/i]},
    {key:'tangkuai',tests:[/guilu-tangkuai/i]},
    {key:'jiao',tests:[/guilu-jiao/i]}
  ]);
  const ALT=Object.freeze({gao:'龜鹿膏正式產品圖',drink30:'龜鹿飲30cc正式產品圖｜小玻璃裸罐',drink180:'龜鹿飲180cc正式產品圖｜鋁袋',tangkuai:'龜鹿湯塊75g／盒｜8塊裝正式產品圖',jiao:'龜鹿膠600g（1斤）／盒｜32塊裝正式產品圖',luerong:'鹿茸粉75g正式產品圖'});
  function alreadyCurrent(value){
    const text=String(value||'');
    return Object.values(CUSTOMER).some(url=>text.includes(String(url).split('?')[0]));
  }
  function isDetailedDm(value){return /\/images\/(?:dm-approved-v20260810|dm-final)\//i.test(String(value||''));}
  function match(value){
    const text=String(value||'');
    if(alreadyCurrent(text)||isDetailedDm(text))return'';
    for(const rule of RULES){if(rule.tests.some(test=>test.test(text)))return rule.key;}
    return'';
  }
  function customerFor(value){const key=match(value);return key?CUSTOMER[key]:'';}
  function forceImage(node,key){
    if(!node||!key||!CUSTOMER[key])return;
    node.setAttribute('src',CUSTOMER[key]);
    node.alt=ALT[key];
    node.style.objectFit='contain';node.style.objectPosition='center';node.style.width='100%';node.style.height='100%';node.style.maxWidth='100%';node.style.maxHeight='100%';node.style.transform='none';node.style.clipPath='none';
    node.dataset.xjwCustomerDisplay='official-product-image-formal-image-fix-v3';
    node.dataset.xjwProductIdentityAuthority='products-v3';
    node.dataset.xjwScalePolicy='uniform-only-contain-no-stretch';
  }
  function repairNode(node,attr){
    const value=node.getAttribute(attr)||'';const key=match(value);if(!key)return;
    node.setAttribute(attr,CUSTOMER[key]);
    if(node.tagName==='IMG')forceImage(node,key);
    if(node.tagName==='A'){const label=(node.textContent||'').trim();if(/產品圖|產品照片|主視覺/.test(label))node.textContent='查看正式產品圖';node.title='查看正式產品圖';}
  }
  function keyFromProductCard(card){return IDS[String(card?.dataset?.productId||'').trim()]||'';}
  function keyFromLocation(){const path=location.pathname.toLowerCase();if(path.includes('product-guilu-drink-30cc'))return'drink30';if(path.includes('product-guilu-drink-180cc'))return'drink180';if(path.includes('product-guilu-gao'))return'gao';if(path.includes('product-guilu-tangkuai'))return'tangkuai';if(path.includes('product-guilu-jiao'))return'jiao';if(path.includes('product-luerong-fen'))return'luerong';return'';}
  function keyFromModal(modal){const text=String(modal?.textContent||'');if(/30\s*cc/.test(text))return'drink30';if(/180\s*cc/.test(text))return'drink180';if(/龜鹿膏/.test(text))return'gao';if(/龜鹿湯塊/.test(text))return'tangkuai';if(/龜鹿膠/.test(text))return'jiao';if(/鹿茸粉/.test(text))return'luerong';return'';}
  function forceKnownSurfaces(root=document){
    root.querySelectorAll?.('.product-card[data-product-id]').forEach(card=>{const key=keyFromProductCard(card),img=card.querySelector('.product-card__img img, img');if(key&&img)forceImage(img,key);});
    const detailKey=keyFromLocation();
    if(detailKey){document.querySelectorAll('.product-detail-hero__media img').forEach(img=>forceImage(img,detailKey));document.querySelectorAll('.product-detail-hero__media a').forEach(a=>{a.href=CUSTOMER[detailKey];a.title='查看正式產品圖';});}
    const modal=document.getElementById('product-modal');
    if(modal&&modal.classList.contains('show')){const key=keyFromModal(modal);if(key){modal.querySelectorAll('img').forEach(img=>forceImage(img,key));modal.querySelectorAll('a[href]').forEach(a=>{if(match(a.href))a.href=CUSTOMER[key];});}}
    if(location.pathname.toLowerCase().includes('trial.html')){
      document.querySelectorAll('.trial-product-grid article').forEach(card=>{const text=card.textContent||'';const key=/180\s*cc/.test(text)?'drink180':/30\s*cc/.test(text)?'drink30':'';const img=card.querySelector('img');if(key&&img)forceImage(img,key);});
      const intro=document.querySelector('#trial-products-title')?.parentElement?.querySelector('p:last-child');
      if(intro)intro.textContent='試喝主圖與六張正式產品圖分開管理；產品本體仍以 products-v3 真實外觀、包裝與比例作校正。';
    }
  }
  function repair(root){
    const scope=root?.querySelectorAll?root:document;
    scope.querySelectorAll('img[src], source[srcset]').forEach(node=>repairNode(node,node.tagName==='SOURCE'?'srcset':'src'));
    scope.querySelectorAll('a[href]').forEach(node=>repairNode(node,'href'));
    forceKnownSurfaces(scope);
  }
  let queued=false;function queueRepair(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;repair(document);});}
  function start(){repair(document);const observer=new MutationObserver(queueRepair);observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src','href','class']});}
  window.XJWProductImageSafety=Object.freeze({version:VERSION,customer:CUSTOMER,officialIdentity:OFFICIAL,rules:RULES,match,customerFor,isDetailedDm,repair,forceKnownSurfaces});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
