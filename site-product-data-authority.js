"use strict";

/* 仙加味正式產品資料圖片權威層｜2026-08-08
 * 在 site-core 讀取 data.json 前即將所有產品主圖映射到 products-v2 實際產品照片。
 * products-v3 與 dm-final 只保留宣傳版面用途，不再成為產品卡、詳頁、OG 或結構化資料主圖。
 * 同步清理錄影中仍可見的「五種型態・六項規格」舊說法。
 */
(function(){
  if(window.__XJW_PRODUCT_DATA_AUTHORITY__) return;
  window.__XJW_PRODUCT_DATA_AUTHORITY__=true;
  const VERSION='20260808-22-products-v2-source';
  const OFFICIAL=Object.freeze({
    'guilu-gao':`images/products-v2/guilu-gao.jpeg?v=${VERSION}`,
    'guilu-drink-30':`images/products-v2/guilu-drink-30.jpeg?v=${VERSION}`,
    'guilu-drink-180':`images/products-v2/guilu-drink-180.jpeg?v=${VERSION}`,
    'guilu-tangkuai':`images/products-v2/guilu-tangkuai.jpeg?v=${VERSION}`,
    'guilu-jiao':`images/products-v2/guilu-jiao-open-new.jpg?v=${VERSION}`,
    'luerong-fen':`images/products-v2/luerong-fen.jpeg?v=${VERSION}`
  });
  const ABS=(path)=>new URL(path,location.href).href;
  function normalizeData(data){
    if(!data||!Array.isArray(data.products)) return data;
    data.products=data.products.map(product=>{
      const photo=OFFICIAL[product?.id];
      if(!photo) return product;
      return {...product,image:photo,dmImage:photo,detailImages:[photo],imagePolicy:'actual-product-photo-contain-no-crop'};
    });
    data.runtime={...(data.runtime||{}),productMainImageSource:'products-v2-actual-photos',productsV3Use:'marketing-layout-reference-only'};
    return data;
  }
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const response=await nativeFetch(input,init);
    try{
      const url=typeof input==='string'?input:String(input?.url||'');
      if(/(?:^|\/)data\.json(?:[?#]|$)/i.test(url)){
        const cloned=response.clone();
        const data=normalizeData(await cloned.json());
        return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:response.headers});
      }
    }catch(error){console.warn('仙加味產品圖片權威層套用失敗',error)}
    return response;
  };
  function pageProductId(){
    const path=location.pathname.toLowerCase();
    if(path.includes('product-guilu-drink-30cc'))return 'guilu-drink-30';
    if(path.includes('product-guilu-drink-180cc'))return 'guilu-drink-180';
    if(path.includes('product-guilu-gao'))return 'guilu-gao';
    if(path.includes('product-guilu-tangkuai'))return 'guilu-tangkuai';
    if(path.includes('product-guilu-jiao'))return 'guilu-jiao';
    if(path.includes('product-luerong-fen'))return 'luerong-fen';
    return '';
  }
  function normalizeHead(){
    const id=pageProductId(); const photo=OFFICIAL[id]; if(!photo)return;
    const absolute=ABS(photo);
    document.querySelectorAll('meta[property="og:image"],meta[name="twitter:image"]').forEach(meta=>meta.setAttribute('content',absolute));
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script=>{
      try{const value=JSON.parse(script.textContent||'{}');if(value&&value['@type']==='Product'){value.image=absolute;script.textContent=JSON.stringify(value)}}catch{}
    });
  }
  function normalizeVisibleCopy(root=document){
    const walker=document.createTreeWalker(root.body||root,NodeFilter.SHOW_TEXT);
    const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    for(const node of nodes){
      const text=String(node.nodeValue||'');
      if(text.includes('五種型態・六項規格')) node.nodeValue=text.replaceAll('五種型態・六項規格','六個正式產品・六個正式規格');
      if(text.includes('五種型態、六項規格')) node.nodeValue=String(node.nodeValue||'').replaceAll('五種型態、六項規格','六個正式產品、六個正式規格');
    }
  }
  function startCopyGuard(){
    normalizeVisibleCopy();
    const observer=new MutationObserver(()=>normalizeVisibleCopy());
    observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  }
  normalizeHead();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startCopyGuard,{once:true});else startCopyGuard();
  window.XJWProductDataAuthority=Object.freeze({version:VERSION,official:OFFICIAL,normalizeData,normalizeHead,normalizeVisibleCopy});
})();
