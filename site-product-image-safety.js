"use strict";

/* 正式產品原圖安全層：舊DM、舊30cc瓶型路徑與歷史產品圖，不得再作現行正式產品圖。 */
(function(){
  const VERSION = "20260808-18";
  const OFFICIAL = Object.freeze({
    gao: `images/products-v3/guilu-gao.jpg?v=${VERSION}`,
    drink30: `images/products-v3/guilu-drink-30.jpg?v=${VERSION}`,
    drink180: `images/products-v3/guilu-drink-180.jpg?v=${VERSION}`,
    tangkuai: `images/products-v3/guilu-tangkuai.jpg?v=${VERSION}`,
    jiao: `images/products-v3/guilu-jiao.jpg?v=${VERSION}`,
    luerong: `images/products-v3/luerong-fen.jpg?v=${VERSION}`,
  });
  const RULES = Object.freeze([
    {key:'gao',tests:[/images\/dm-final\/01_guilu-gao-100g-dm\.jpg/i]},
    {key:'drink30',tests:[/images\/guilu-drink-30cc-glass\.jpg/i,/images\/dm-final\/02_guilu-drink-30cc-dm\.jpg/i,/guilu-drink-30-clean\.svg/i,/30cc[^/]*(?:bottle|瓶)/i]},
    {key:'drink180',tests:[/images\/dm-final\/03_guilu-drink-180cc-dm\.jpg/i]},
    {key:'luerong',tests:[/images\/dm-final\/04_luerong-fen-75g-dm\.jpg/i]},
    {key:'tangkuai',tests:[/images\/dm-final\/05_guilu-tangkuai-75g-dm\.jpg/i]},
    {key:'jiao',tests:[/images\/dm-final\/06_guilu-jiao-600g-dm\.jpg/i]},
  ]);
  const ALT = Object.freeze({
    gao:'龜鹿膏100g正式產品原圖',
    drink30:'龜鹿飲30cc小玻璃裸罐正式產品原圖',
    drink180:'龜鹿飲180cc狹長鋁袋正式產品原圖',
    tangkuai:'龜鹿湯塊75g深藍盒正式產品原圖',
    jiao:'龜鹿膠600g淡紫盒正式產品原圖',
    luerong:'鹿茸粉75g白色塑膠罐正式產品原圖',
  });

  function match(value){
    const text=String(value||'');
    for(const rule of RULES){if(rule.tests.some((test)=>test.test(text)))return rule.key;}
    return '';
  }
  function officialFor(value){const key=match(value);return key?OFFICIAL[key]:'';}
  function repairNode(node,attr){
    const value=node.getAttribute(attr)||'';
    const key=match(value);if(!key)return;
    node.setAttribute(attr,OFFICIAL[key]);
    if(node.tagName==='IMG'){
      node.alt=ALT[key];node.style.objectFit='contain';node.style.objectPosition='center';node.dataset.xjwOfficialProduct=key;
    }
    if(node.tagName==='A'){
      const label=(node.textContent||'').trim();
      if(/DM|海報|大圖/.test(label))node.textContent='開啟正式產品原圖';
      node.title='目前正式產品圖以原圖為準；歷史DM不作現行正式規格依據。';
    }
  }
  function repair(root){
    const scope=root?.querySelectorAll?root:document;
    scope.querySelectorAll('img[src], source[srcset]').forEach((node)=>repairNode(node,node.tagName==='SOURCE'?'srcset':'src'));
    scope.querySelectorAll('a[href], [data-dm-src]').forEach((node)=>{
      repairNode(node,'href');
      const dm=node.getAttribute('data-dm-src')||'';const key=match(dm);if(key)node.setAttribute('data-dm-src',OFFICIAL[key]);
    });
  }
  function start(){
    repair(document);
    const observer=new MutationObserver((records)=>records.forEach((record)=>record.addedNodes.forEach((node)=>{
      if(node.nodeType!==1)return;repair(node);repair(node.parentElement||document);
    })));
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
  window.XJWProductImageSafety=Object.freeze({version:VERSION,official:OFFICIAL,rules:RULES,match,officialFor,repair});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
