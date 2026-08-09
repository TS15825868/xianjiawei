"use strict";

/* 仙加味正式產品資料圖片權威層｜2026-08-10
 * products-v3 六張正式路徑已直接換成使用者最新提供的原始產品實拍；不再用 DM／海報作為產品主圖。
 * 舊 products-v2 與 dm-final 只保留歷史／宣傳參考，不再成為產品卡、詳頁、OG 或結構化資料主圖。
 * 所有產品本體只允許等比例顯示；禁止拉寬、拉高、cover裁切或把不同產品強制等高／等寬。
 */
(function(){
  if(window.__XJW_PRODUCT_DATA_AUTHORITY__) return;
  window.__XJW_PRODUCT_DATA_AUTHORITY__=true;
  const VERSION='20260810-products-v3-latest-originals-v3';
  const DATA_CACHE_VERSION='20260810-16';
  const OFFICIAL=Object.freeze({
    'guilu-gao':`images/products-v3/guilu-gao.jpg?v=${VERSION}`,
    'guilu-drink-30':`images/products-v3/guilu-drink-30.jpg?v=${VERSION}`,
    'guilu-drink-180':`images/products-v3/guilu-drink-180.jpg?v=${VERSION}`,
    'guilu-tangkuai':`images/products-v3/guilu-tangkuai.jpg?v=${VERSION}`,
    'guilu-jiao':`images/products-v3/guilu-jiao.jpg?v=${VERSION}`,
    'luerong-fen':`images/products-v3/luerong-fen.jpg?v=${VERSION}`
  });
  const ABS=(path)=>new URL(path,location.href).href;
  function normalizeData(data){
    if(!data||!Array.isArray(data.products)) return data;
    data.products=data.products.map(product=>{
      const photo=OFFICIAL[product?.id];
      if(!photo) return product;
      return {
        ...product,
        image:photo,
        imageUrl:photo,
        image_url:photo,
        dmImage:photo,
        officialOriginalImage:photo,
        detailImages:[photo],
        imagePolicy:'approved-original-product-photo-uniform-scale-contain-no-crop',
        physicalScalePolicy:'preserve-original-aspect-and-realistic-relative-scale'
      };
    });
    data.runtime={
      ...(data.runtime||{}),
      productMainImageSource:'products-v3-latest-original-product-photos',
      dmFallback:'approved-original-photo-until-current-dm-passes-review',
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
  window.XJWProductDataAuthority=Object.freeze({version:VERSION,dataCacheVersion:DATA_CACHE_VERSION,official:OFFICIAL,normalizeData,normalizeHead,normalizeVisibleCopy,cacheBustInput});
})();