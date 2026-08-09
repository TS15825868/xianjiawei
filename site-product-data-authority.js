"use strict";

/* 仙加味產品資料權威層｜2026-08-10
 * products-v3 = 六項正式原始產品照，供產品權威、LINE OA、貼文審核與 officialOriginalImage 使用。
 * products-v4-final = 官網顧客顯示層，六項完整成套；不得反向改寫 products-v3 權威。
 * 所有產品只允許等比例 contain 顯示，禁止裁切、拉寬、拉高或改變包裝比例。
 */
(function(){
  if(window.__XJW_PRODUCT_DATA_AUTHORITY__) return;
  window.__XJW_PRODUCT_DATA_AUTHORITY__=true;
  const OFFICIAL_VERSION='20260810-products-v3-latest-originals-v3';
  const CUSTOMER_VERSION='20260810-products-v4-final-v1';
  const DATA_CACHE_VERSION='20260810-17';
  const OFFICIAL=Object.freeze({
    'guilu-gao':`images/products-v3/guilu-gao.jpg?v=${OFFICIAL_VERSION}`,
    'guilu-drink-30':`images/products-v3/guilu-drink-30.jpg?v=${OFFICIAL_VERSION}`,
    'guilu-drink-180':`images/products-v3/guilu-drink-180.jpg?v=${OFFICIAL_VERSION}`,
    'guilu-tangkuai':`images/products-v3/guilu-tangkuai.jpg?v=${OFFICIAL_VERSION}`,
    'guilu-jiao':`images/products-v3/guilu-jiao.jpg?v=${OFFICIAL_VERSION}`,
    'luerong-fen':`images/products-v3/luerong-fen.jpg?v=${OFFICIAL_VERSION}`
  });
  const CUSTOMER=Object.freeze({
    'guilu-gao':`images/products-v4-final/guilu-gao.svg?v=${CUSTOMER_VERSION}`,
    'guilu-drink-30':`images/products-v4-final/guilu-drink-30.svg?v=${CUSTOMER_VERSION}`,
    'guilu-drink-180':`images/products-v4-final/guilu-drink-180.svg?v=${CUSTOMER_VERSION}`,
    'guilu-tangkuai':`images/products-v4-final/guilu-tangkuai.svg?v=${CUSTOMER_VERSION}`,
    'guilu-jiao':`images/products-v4-final/guilu-jiao.svg?v=${CUSTOMER_VERSION}`,
    'luerong-fen':`images/products-v4-final/luerong-fen.svg?v=${CUSTOMER_VERSION}`
  });
  const ABS=(path)=>new URL(path,location.href).href;
  function normalizeData(data){
    if(!data||!Array.isArray(data.products)) return data;
    data.products=data.products.map(product=>{
      const official=OFFICIAL[product?.id];
      const customer=CUSTOMER[product?.id];
      if(!official||!customer) return product;
      return {
        ...product,
        image:customer,
        imageUrl:customer,
        image_url:customer,
        dmImage:customer,
        officialOriginalImage:official,
        detailImages:[customer],
        imagePolicy:'customer-display-v4-final-contain-no-crop',
        officialImagePolicy:'products-v3-authority-original-no-redraw',
        physicalScalePolicy:'preserve-original-aspect-and-realistic-relative-scale'
      };
    });
    data.runtime={
      ...(data.runtime||{}),
      productMainImageSource:'products-v4-final-customer-display',
      officialProductImageSource:'products-v3-latest-original-product-photos',
      dmFallback:'customer-display-v4-final',
      productsV2Use:'legacy-reference-only',
      productScalePolicy:'uniform-only-no-equal-height-equal-width',
      dataCacheVersion:DATA_CACHE_VERSION
    };
    return data;
  }
  function isDataUrl(value=''){
    try{return /(?:^|\/)data\.json(?:[?#]|$)/i.test(new URL(String(value||''),location.href).pathname)}catch{return false}
  }
  function cacheBustInput(input){
    const raw=typeof input==='string'?input:String(input?.url||'');
    if(!isDataUrl(raw)) return input;
    const url=new URL(raw,location.href);
    url.searchParams.set('xjw',DATA_CACHE_VERSION);
    if(typeof input==='string') return url.href;
    try{return new Request(url.href,input)}catch{return url.href}
  }
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const raw=typeof input==='string'?input:String(input?.url||'');
    const dataRequest=isDataUrl(raw);
    const response=await nativeFetch(dataRequest?cacheBustInput(input):input,init);
    try{
      if(dataRequest){
        const cloned=response.clone();
        const data=normalizeData(await cloned.json());
        return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:response.headers});
      }
    }catch(error){console.warn('仙加味產品顧客顯示層套用失敗',error)}
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
    const id=pageProductId(); const photo=CUSTOMER[id]; if(!photo)return;
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
  window.XJWProductDataAuthority=Object.freeze({version:CUSTOMER_VERSION,officialVersion:OFFICIAL_VERSION,dataCacheVersion:DATA_CACHE_VERSION,official:OFFICIAL,customer:CUSTOMER,normalizeData,normalizeHead,normalizeVisibleCopy,cacheBustInput});
})();