"use strict";

/* 官網顧客產品圖片安全層｜2026-08-14 stability-v8
 * 產品卡／產品詳頁／Modal／trial產品卡只能使用正式產品主圖。
 * DM 為獨立角色；180cc 明確禁止以詳細DM海報取代產品主圖。
 * 重要：所有 DOM 寫入都先比較現值，避免 MutationObserver 在 Safari 反覆重繪。
 */
(function(){
  if(window.__XJW_PRODUCT_IMAGE_SAFETY_V8__)return;
  window.__XJW_PRODUCT_IMAGE_SAFETY_V8__=true;

  const VERSION='20260814-site-refresh-v4';
  const CUSTOMER=Object.freeze({
    gao:`images/customer-display-v20260812/guilu-gao.avif?v=${VERSION}`,
    drink30:`images/customer-display-v20260812/guilu-drink-30cc.avif?v=${VERSION}`,
    drink180:`images/customer-display-v20260812/guilu-drink-180cc-product.jpg?v=${VERSION}`,
    tangkuai:`images/customer-display-v20260812/guilu-tangkuai.avif?v=${VERSION}`,
    jiao:`images/customer-display-v20260812/guilu-jiao.avif?v=${VERSION}`,
    luerong:`images/customer-display-v20260812/luerong-fen.avif?v=${VERSION}`
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
  const ALT=Object.freeze({
    gao:'龜鹿膏正式產品圖',
    drink30:'龜鹿飲30cc正式產品圖｜小玻璃裸罐',
    drink180:'龜鹿飲180cc正式產品圖｜鋁袋',
    tangkuai:'龜鹿湯塊75g／盒｜8塊裝正式產品圖',
    jiao:'龜鹿膠600g（1斤）／盒｜32塊裝正式產品圖',
    luerong:'鹿茸粉75g正式產品圖'
  });

  function absolute(value=''){
    try{return new URL(String(value||''),location.href).href}catch{return String(value||'')}
  }
  function sameUrl(a,b){return absolute(a)===absolute(b)}
  function setAttrIfChanged(node,name,value){
    if(!node)return false;
    const current=node.getAttribute(name)||'';
    const same=(name==='src'||name==='href')?sameUrl(current,value):current===String(value);
    if(same)return false;
    node.setAttribute(name,value);
    return true;
  }
  function setTextIfChanged(node,value){
    if(!node||node.textContent===value)return false;
    node.textContent=value;
    return true;
  }
  function setStyleIfChanged(node,name,value){
    if(!node||node.style[name]===value)return false;
    node.style[name]=value;
    return true;
  }
  function alreadyCurrent(value){
    const text=String(value||'');
    return Object.values(CUSTOMER).some(url=>text.includes(String(url).split('?')[0]));
  }
  function isDetailedDm(value){return /\/images\/(?:dm-approved-v20260810|dm-final|dm-v3)\//i.test(String(value||''));}
  function match(value){
    const text=String(value||'');
    if(alreadyCurrent(text)||isDetailedDm(text))return'';
    for(const rule of RULES){if(rule.tests.some(test=>test.test(text)))return rule.key;}
    return'';
  }
  function customerFor(value){const key=match(value);return key?CUSTOMER[key]:'';}

  function forceImage(node,key){
    if(!node||!key||!CUSTOMER[key])return false;
    let changed=false;
    changed=setAttrIfChanged(node,'src',CUSTOMER[key])||changed;
    if(node.hasAttribute('srcset')){node.removeAttribute('srcset');changed=true;}
    if(node.alt!==ALT[key]){node.alt=ALT[key];changed=true;}
    changed=setStyleIfChanged(node,'objectFit','contain')||changed;
    changed=setStyleIfChanged(node,'objectPosition','center')||changed;
    changed=setStyleIfChanged(node,'width','100%')||changed;
    changed=setStyleIfChanged(node,'maxWidth','100%')||changed;
    changed=setStyleIfChanged(node,'maxHeight','100%')||changed;
    changed=setStyleIfChanged(node,'transform','none')||changed;
    changed=setStyleIfChanged(node,'clipPath','none')||changed;
    if(node.dataset.xjwCustomerDisplay!=='official-product-image-v8'){node.dataset.xjwCustomerDisplay='official-product-image-v8';changed=true;}
    if(node.dataset.xjwProductIdentityAuthority!=='products-v3'){node.dataset.xjwProductIdentityAuthority='products-v3';changed=true;}
    if(node.dataset.xjwScalePolicy!=='uniform-only-contain-no-stretch'){node.dataset.xjwScalePolicy='uniform-only-contain-no-stretch';changed=true;}
    return changed;
  }

  function repairNode(node,attr){
    const value=node.getAttribute(attr)||'';
    const key=match(value);
    if(!key)return false;
    let changed=setAttrIfChanged(node,attr,CUSTOMER[key]);
    if(node.tagName==='IMG')changed=forceImage(node,key)||changed;
    if(node.tagName==='A'){
      const label=(node.textContent||'').trim();
      if(/產品圖|產品照片|主視覺/.test(label))changed=setTextIfChanged(node,'查看正式產品圖')||changed;
      if(node.title!=='查看正式產品圖'){node.title='查看正式產品圖';changed=true;}
    }
    return changed;
  }

  function keyFromProductCard(card){return IDS[String(card?.dataset?.productId||'').trim()]||'';}
  function keyFromLocation(){
    const path=location.pathname.toLowerCase();
    if(path.includes('product-guilu-drink-30cc'))return'drink30';
    if(path.includes('product-guilu-drink-180cc'))return'drink180';
    if(path.includes('product-guilu-gao'))return'gao';
    if(path.includes('product-guilu-tangkuai'))return'tangkuai';
    if(path.includes('product-guilu-jiao'))return'jiao';
    if(path.includes('product-luerong-fen'))return'luerong';
    return'';
  }
  function keyFromModal(modal){
    const text=String(modal?.textContent||'');
    if(/30\s*cc/.test(text))return'drink30';
    if(/180\s*cc/.test(text))return'drink180';
    if(/龜鹿膏/.test(text))return'gao';
    if(/龜鹿湯塊/.test(text))return'tangkuai';
    if(/龜鹿膠/.test(text))return'jiao';
    if(/鹿茸粉/.test(text))return'luerong';
    return'';
  }

  function forceKnownSurfaces(root=document){
    root.querySelectorAll?.('.product-card[data-product-id]').forEach(card=>{
      const key=keyFromProductCard(card);
      const img=card.querySelector('.product-card__img img, img');
      if(key&&img)forceImage(img,key);
    });

    const detailKey=keyFromLocation();
    if(detailKey){
      document.querySelectorAll('.product-detail-hero__media img').forEach(img=>forceImage(img,detailKey));
      document.querySelectorAll('.product-detail-hero__media a').forEach(a=>{
        setAttrIfChanged(a,'href',CUSTOMER[detailKey]);
        if(a.title!=='查看正式產品圖')a.title='查看正式產品圖';
      });
    }

    const modal=document.getElementById('product-modal');
    if(modal&&modal.classList.contains('show')){
      const key=keyFromModal(modal);
      if(key){
        modal.querySelectorAll('img').forEach(img=>forceImage(img,key));
        modal.querySelectorAll('a[href]').forEach(a=>{if(match(a.href))setAttrIfChanged(a,'href',CUSTOMER[key]);});
      }
    }

    if(location.pathname.toLowerCase().includes('trial.html')){
      document.querySelectorAll('.trial-product-card').forEach(card=>{
        const key=String(card.dataset.productKey||'');
        const img=card.querySelector('.trial-product-card__media img');
        if(key&&img){
          forceImage(img,key);
          setStyleIfChanged(img,'height','auto');
          setStyleIfChanged(img,'maxHeight','none');
        }
      });
    }
  }

  function repair(root=document){
    const scope=root?.querySelectorAll?root:document;
    scope.querySelectorAll('img[src], source[srcset]').forEach(node=>repairNode(node,node.tagName==='SOURCE'?'srcset':'src'));
    scope.querySelectorAll('a[href]').forEach(node=>repairNode(node,'href'));
    forceKnownSurfaces(scope);
  }

  let queued=false;
  function queueRepair(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;repair(document);});
  }
  function start(){
    repair(document);
    const observer=new MutationObserver(queueRepair);
    observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src','href','class']});
  }

  window.XJWProductImageSafety=Object.freeze({version:VERSION,customer:CUSTOMER,officialIdentity:OFFICIAL,rules:RULES,match,customerFor,isDetailedDm,repair,forceKnownSurfaces});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
