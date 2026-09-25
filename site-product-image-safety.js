"use strict";

/* 官網顧客產品圖片安全層｜2026-09-26 unified product-main safety v12
 * 產品卡／首頁展示／試喝／推薦／產品詳頁主圖只使用同一套 products-v3 正式主圖。
 * dm-final 為完整產品介紹頁詳細圖，不得被主圖守門員覆寫。
 */
(function(){
  if(window.__XJW_PRODUCT_IMAGE_SAFETY_V11__)return;
  window.__XJW_PRODUCT_IMAGE_SAFETY_V11__=true;

  const VERSION='20260926-unified-product-main-v32';
  const CUSTOMER=Object.freeze({
    gao:`images/products-v3/guilu-gao.jpg?v=${VERSION}`,
    drink30:`images/products-v3/guilu-drink-30.jpg?v=${VERSION}`,
    drink180:`images/products-v3/guilu-drink-180.jpg?v=${VERSION}`,
    tangkuai:`images/products-v3/guilu-tangkuai.jpg?v=${VERSION}`,
    jiao:`images/products-v3/guilu-jiao.jpg?v=${VERSION}`,
    luerong:`images/products-v3/luerong-fen.jpg?v=${VERSION}`
  });
  const OFFICIAL=Object.freeze({
  "guilu-gao": "images/guilu-gao.jpg",
  "guilu-drink-30": "images/guilu-drink-30cc-glass.jpg",
  "guilu-drink-180": "images/guilu-drink-180cc.jpg",
  "guilu-tangkuai": "images/products-v2/guilu-tangkuai-open-new.jpg",
  "guilu-jiao": "images/products-v2/guilu-jiao-open-new.jpg",
  "luerong-fen": "images/products-v2/luerong-fen.jpeg"
});
  const IDS=Object.freeze({'guilu-gao':'gao','guilu-drink-30':'drink30','guilu-drink-180':'drink180','guilu-tangkuai':'tangkuai','guilu-jiao':'jiao','luerong-fen':'luerong'});
  const RULES=Object.freeze([
    {key:'gao',tests:[/guilu-gao/i]},
    {key:'drink30',tests:[/guilu-drink-30/i,/30cc[^/]*(?:bottle|瓶|罐)/i]},
    {key:'drink180',tests:[/guilu-drink-180/i]},
    {key:'luerong',tests:[/luerong-fen/i,/lurong-fen/i]},
    {key:'tangkuai',tests:[/guilu-tangkuai/i]},
    {key:'jiao',tests:[/guilu-jiao/i]}
  ]);
  const ALT=Object.freeze({gao:'龜鹿膏100g正式主圖',drink30:'龜鹿飲30cc正式主圖｜小玻璃裸罐',drink180:'龜鹿飲180cc正式主圖｜鋁袋',tangkuai:'龜鹿湯塊75g／8塊裝正式主圖',jiao:'龜鹿膠600g／32塊裝正式主圖',luerong:'鹿茸粉75g正式主圖'});
  const IMAGE_EXT=/\.(?:avif|webp|png|jpe?g|gif|svg)(?:[?#]|$)/i;

  function absolute(value=''){try{return new URL(String(value||''),location.href).href}catch{return String(value||'')}}
  function sameUrl(a,b){return absolute(a)===absolute(b)}
  function setAttrIfChanged(node,name,value){
    if(!node)return false;
    const current=node.getAttribute(name)||'';
    const same=(name==='src'||name==='href')?sameUrl(current,value):current===String(value);
    if(same)return false;
    node.setAttribute(name,value);return true;
  }
  function setStyleIfChanged(node,name,value){if(!node||node.style[name]===value)return false;node.style[name]=value;return true;}
  function alreadyCurrent(value){return Object.values(CUSTOMER).some(url=>sameUrl(value,url));}
  function isDetailedDm(value){return /\/images\/(?:dm-approved-v20260810|dm-final|dm-v3)\//i.test(String(value||''));}
  function isImageHref(value=''){
    const text=String(value||'').trim();
    if(!text||/^#/.test(text)||/\.html(?:[?#]|$)/i.test(text))return false;
    if(/^(?:mailto:|tel:|javascript:)/i.test(text))return false;
    return IMAGE_EXT.test(text)||/\/images\//i.test(text);
  }
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
    node.dataset.xjwCustomerDisplay='unified-formal-product-main-v12';
    node.dataset.xjwProductIdentityAuthority='verified-original-product-reference';
    node.dataset.xjwScalePolicy='uniform-only-contain-no-stretch-no-crop';
    return changed;
  }

  function repairNode(node,attr){
    const value=node.getAttribute(attr)||'';
    if(node.tagName==='A'&&!isImageHref(value))return false;
    const key=match(value);if(!key)return false;
    let changed=setAttrIfChanged(node,attr,CUSTOMER[key]);
    if(node.tagName==='IMG')changed=forceImage(node,key)||changed;
    if(node.tagName==='A'){
      const label=(node.textContent||'').trim();
      if(/產品圖|產品照片|主視覺/.test(label)&&label!=='查看正式產品圖'){node.textContent='查看正式產品圖';changed=true;}
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
    if(/30\s*cc/.test(text))return'drink30';if(/180\s*cc/.test(text))return'drink180';if(/龜鹿膏/.test(text))return'gao';if(/龜鹿湯塊/.test(text))return'tangkuai';if(/龜鹿膠/.test(text))return'jiao';if(/鹿茸粉/.test(text))return'luerong';return'';
  }

  function forceKnownSurfaces(root=document){
    root.querySelectorAll?.('.product-card[data-product-id]').forEach(card=>{const key=keyFromProductCard(card),img=card.querySelector('.product-card__img img, img');if(key&&img)forceImage(img,key);});
    const detailKey=keyFromLocation();
    if(detailKey){
      document.querySelectorAll('.product-detail-hero__media img').forEach(img=>forceImage(img,detailKey));
      document.querySelectorAll('.product-detail-hero__media a').forEach(a=>{if(isImageHref(a.getAttribute('href')||''))setAttrIfChanged(a,'href',CUSTOMER[detailKey]);});
    }
    const modal=document.getElementById('product-modal');
    if(modal&&modal.classList.contains('show')){
      const key=keyFromModal(modal);
      if(key){
        modal.querySelectorAll('img').forEach(img=>{if(!isDetailedDm(img.getAttribute('src')||''))forceImage(img,key);});
        modal.querySelectorAll('a[href]').forEach(a=>{const href=a.getAttribute('href')||'';if(isImageHref(href)&&match(href))setAttrIfChanged(a,'href',CUSTOMER[key]);});
      }
    }
    if(location.pathname.toLowerCase().includes('trial.html')){
      document.querySelectorAll('.trial-product-card').forEach(card=>{const key=String(card.dataset.productKey||''),img=card.querySelector('.trial-product-card__media img');if(key&&img){forceImage(img,key);setStyleIfChanged(img,'height','auto');setStyleIfChanged(img,'maxHeight','none');}});
    }
  }

  function repair(root=document){
    const scope=root?.querySelectorAll?root:document;
    scope.querySelectorAll('img[src], source[srcset]').forEach(node=>repairNode(node,node.tagName==='SOURCE'?'srcset':'src'));
    scope.querySelectorAll('a[href]').forEach(node=>{if(isImageHref(node.getAttribute('href')||''))repairNode(node,'href');});
    forceKnownSurfaces(scope);
  }
  let queued=false;
  function queueRepair(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;repair(document);});}
  function start(){repair(document);const observer=new MutationObserver(queueRepair);observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src','href','srcset','class']});}

  window.XJWProductImageSafety=Object.freeze({version:VERSION,customer:CUSTOMER,officialIdentity:OFFICIAL,rules:RULES,match,customerFor,isDetailedDm,isImageHref,repair,forceKnownSurfaces});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
