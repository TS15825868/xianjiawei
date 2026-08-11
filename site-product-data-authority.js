"use strict";

/* 仙加味目前產品資料權威層
 * products-v3 = 六項正式真實產品原圖，也是官網顧客產品本體、分享預覽、detail image 唯一來源。
 * 顧客DM屬獨立展示媒體，必須先通過目前規格／內嵌文字驗證；不得反向改寫產品本體。
 * 所有產品只允許等比例 contain，禁止裁切、拉寬、拉高、AI重畫或改變包裝比例。
 */
(function(){
  if(window.__XJW_PRODUCT_DATA_AUTHORITY__) return;
  window.__XJW_PRODUCT_DATA_AUTHORITY__=true;
  const OFFICIAL_VERSION='20260810-products-v3-latest-originals-v3';
  const CUSTOMER_VERSION='20260811-products-v3-current-customer-authority';
  const DATA_CACHE_VERSION='20260811-current';
  const LINE_URL='https://lin.ee/sHZW7NkR';
  const OFFICIAL=Object.freeze({
    'guilu-gao':`images/products-v3/guilu-gao.jpg?v=${OFFICIAL_VERSION}`,
    'guilu-drink-30':`images/products-v3/guilu-drink-30.jpg?v=${OFFICIAL_VERSION}`,
    'guilu-drink-180':`images/products-v3/guilu-drink-180.jpg?v=${OFFICIAL_VERSION}`,
    'guilu-tangkuai':`images/products-v3/guilu-tangkuai.jpg?v=${OFFICIAL_VERSION}`,
    'guilu-jiao':`images/products-v3/guilu-jiao.jpg?v=${OFFICIAL_VERSION}`,
    'luerong-fen':`images/products-v3/luerong-fen.jpg?v=${OFFICIAL_VERSION}`
  });
  const CUSTOMER=OFFICIAL;
  const ABS=(path)=>new URL(path,location.href).href;
  function normalizeData(data){
    if(!data||!Array.isArray(data.products)) return data;
    data.products=data.products.map(product=>{
      const official=OFFICIAL[product?.id];
      if(!official) return product;
      const normalized={...product};
      if(product.id==='guilu-gao'){
        normalized.spec='100g／罐';
        normalized.size='100g／罐';
        normalized.usage=['一天一次一小匙','初次可先從半匙開始','可直接食用或加入約100～300mL溫熱水化開','避免接近睡前食用'];
      }
      if(product.id==='guilu-drink-30'){
        normalized.name='龜鹿飲30cc玻璃罐';
        normalized.spec='30cc／罐（小玻璃罐）';
        normalized.size='30cc／罐（小玻璃罐）';
        normalized.usage=['每日一份','開罐即可飲用','可隔水加熱或溫熱後飲用','避免冰飲','開罐後請儘速飲用完畢'];
      }
      if(product.id==='guilu-drink-180'){
        normalized.name='龜鹿飲180cc鋁袋';
        normalized.spec='180cc／包（鋁袋）';
        normalized.size='180cc／包（鋁袋）';
        normalized.usage=['每日一份','撕開包裝即可飲用','可隔水加熱或溫熱後飲用','避免冰飲','開封後請儘速飲用完畢'];
      }
      if(product.id==='guilu-tangkuai'){
        normalized.spec='75g／盒｜8塊裝';
        normalized.size='75g／盒｜8塊裝';
      }
      if(product.id==='guilu-jiao'){
        normalized.spec='600g／盒｜32塊裝';
        normalized.size='600g／盒｜32塊裝';
      }
      if(product.id==='luerong-fen'){
        normalized.spec='75g／罐';
        normalized.size='75g／罐';
      }
      return {
        ...normalized,
        image:official,
        imageUrl:official,
        image_url:official,
        dmImage:official,
        officialOriginalImage:official,
        detailImages:[official],
        imagePolicy:'products-v3-current-customer-authority-contain-no-crop',
        officialImagePolicy:'products-v3-authority-original-no-redraw',
        physicalScalePolicy:'preserve-original-aspect-and-realistic-relative-scale'
      };
    });
    data.runtime={
      ...(data.runtime||{}),
      productMainImageSource:'products-v3-latest-original-product-photos',
      officialProductImageSource:'products-v3-latest-original-product-photos',
      shareImageSource:'products-v3-jpeg-authority',
      dmFallback:'products-v3-until-dm-copy-currently-validated',
      productsV2Use:'legacy-reference-only',
      productsV4Use:'retired-customer-display-reference-only',
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
    const id=pageProductId(); const photo=OFFICIAL[id]; if(!photo)return;
    const absolute=ABS(photo);
    document.querySelectorAll('meta[property="og:image"],meta[name="twitter:image"]').forEach(meta=>meta.setAttribute('content',absolute));
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script=>{
      try{const value=JSON.parse(script.textContent||'{}');if(value&&value['@type']==='Product'){value.image=absolute;script.textContent=JSON.stringify(value)}}catch{}
    });
  }
  const COPY_REPLACEMENTS=Object.freeze([
    ['五種型態・六項規格','六個正式產品・六個正式規格'],
    ['五種型態、六項規格','六個正式產品、六個正式規格'],
    ['五種產品使用方式','六項正式產品使用方式'],
    ['每日早上及下午各一小匙','一天一次一小匙'],
    ['規格：30cc／瓶','規格：30cc／罐（小玻璃罐）'],
    ['30cc／瓶（玻璃瓶）','30cc／罐（小玻璃罐）'],
    ['30cc／瓶','30cc／罐（小玻璃罐）'],
    ['龜鹿飲30cc玻璃瓶','龜鹿飲30cc玻璃罐'],
    ['75g／盒｜8塊裝｜每塊約9.375g','75g／盒｜8塊裝'],
    ['規格：600g／盒｜1斤｜32塊裝','規格：600g／盒｜32塊裝'],
    ['600g／盒｜1斤｜32塊裝','600g／盒｜32塊裝'],
    ['600g（1斤）／盒｜32塊裝｜每塊約18.75g','600g／盒｜32塊裝']
  ]);
  function normalizeVisibleCopy(root=document){
    const body=root.body||root;
    if(!body)return;
    const walker=document.createTreeWalker(body,NodeFilter.SHOW_TEXT);
    const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    for(const node of nodes){
      let text=String(node.nodeValue||'');
      let next=text;
      for(const [from,to] of COPY_REPLACEMENTS) next=next.replaceAll(from,to);
      if(next!==text) node.nodeValue=next;
    }
  }
  function normalizeCustomerLinks(root=document){
    if(!root?.querySelectorAll)return;
    root.querySelectorAll('a').forEach(link=>{
      const label=String(link.textContent||'').trim();
      if(label==='查看門市'){
        link.textContent='LINE 詢問';
        link.href=LINE_URL;
        link.target='_blank';
        link.rel='noopener';
      }
    });
  }
  function normalizeCustomerAddress(root=document){
    if(!root?.body)return;
    if(!/\/(?:index\.html)?$/i.test(location.pathname))return;
    const walker=document.createTreeWalker(root.body,NodeFilter.SHOW_TEXT);
    const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    for(const node of nodes){
      const text=String(node.nodeValue||'');
      if(text.includes('台北市萬華區西昌街52號')) node.nodeValue=text.replaceAll('台北市萬華區西昌街52號','想了解門市資訊，歡迎透過 LINE 詢問');
    }
  }
  function normalizeCustomerView(){
    normalizeVisibleCopy();
    normalizeCustomerLinks();
    normalizeCustomerAddress();
  }
  function startCopyGuard(){
    normalizeCustomerView();
    let scheduled=false;
    const observer=new MutationObserver(()=>{
      if(scheduled)return;
      scheduled=true;
      queueMicrotask(()=>{scheduled=false;normalizeCustomerView()});
    });
    observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  }
  normalizeHead();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startCopyGuard,{once:true});else startCopyGuard();
  window.XJWProductDataAuthority=Object.freeze({version:CUSTOMER_VERSION,officialVersion:OFFICIAL_VERSION,dataCacheVersion:DATA_CACHE_VERSION,official:OFFICIAL,customer:CUSTOMER,normalizeData,normalizeHead,normalizeVisibleCopy,normalizeCustomerView,cacheBustInput});
})();