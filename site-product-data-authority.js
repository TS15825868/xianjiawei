"use strict";

/* 仙加味目前產品資料權威層｜2026-08-13 v7
 * 六張正式產品圖／詳細DM／trial展示元件為三個獨立角色。
 * 180cc 產品表面只用真實鋁袋產品照片；DM不得反向覆蓋產品主圖。
 * 已知花圖的舊 trial-small-boss binary 全部退出網站 runtime。
 */
(function(){
  if(window.__XJW_PRODUCT_DATA_AUTHORITY__) return;
  window.__XJW_PRODUCT_DATA_AUTHORITY__=true;

  const VERSION='20260813-trial-product-role-fix-v7';
  const DATA_CACHE_VERSION=VERSION;
  const LINE_URL='https://lin.ee/sHZW7NkR';

  const OFFICIAL=Object.freeze({
    'guilu-gao':`images/products-v3/guilu-gao.jpg?v=${VERSION}`,
    'guilu-drink-30':`images/products-v3/guilu-drink-30.jpg?v=${VERSION}`,
    'guilu-drink-180':`images/products-v3/guilu-drink-180.jpg?v=${VERSION}`,
    'guilu-tangkuai':`images/products-v3/guilu-tangkuai.jpg?v=${VERSION}`,
    'guilu-jiao':`images/products-v3/guilu-jiao.jpg?v=${VERSION}`,
    'luerong-fen':`images/products-v3/luerong-fen.jpg?v=${VERSION}`
  });

  const CUSTOMER=Object.freeze({
    'guilu-gao':`images/customer-display-v20260812/guilu-gao.avif?v=${VERSION}`,
    'guilu-drink-30':`images/customer-display-v20260812/guilu-drink-30cc.avif?v=${VERSION}`,
    'guilu-drink-180':`images/products-v2/guilu-drink-180.jpeg?v=${VERSION}`,
    'guilu-tangkuai':`images/customer-display-v20260812/guilu-tangkuai.avif?v=${VERSION}`,
    'guilu-jiao':`images/customer-display-v20260812/guilu-jiao.avif?v=${VERSION}`,
    'luerong-fen':`images/customer-display-v20260812/luerong-fen.avif?v=${VERSION}`
  });

  const TRIAL=Object.freeze({
    mode:'component',
    id:'trial-showcase-v20260813',
    mascot:`images/post-library/userzip3-v20260811/self-care-family-2.webp?v=${VERSION}`,
    product:CUSTOMER['guilu-drink-30'],
    retired:Object.freeze([
      'images/customer-display-v20260812/trial.webp',
      'images/customer-display-v20260812/trial-clean-v4.svg',
      'images/customer-display-v20260812/trial-small-boss.webp',
      'images/customer-display-v20260812/trial-small-boss.jpg',
      'images/customer-display-v20260812/trial-small-boss.png'
    ])
  });
  const ABS=(path)=>new URL(path,location.href).href;

  function normalizeData(data){
    if(!data||!Array.isArray(data.products)) return data;
    data.products=data.products.map(product=>{
      const customer=CUSTOMER[product?.id];
      const official=OFFICIAL[product?.id];
      if(!customer) return product;
      const normalized={...product};
      if(product.id==='guilu-drink-30') normalized.size='30cc／罐（小玻璃罐）';
      if(product.id==='guilu-drink-180') normalized.size='180cc／包（鋁袋）';
      if(product.id==='guilu-tangkuai'){
        normalized.size='75g／盒｜8塊裝';
        normalized.unitApprox='每塊約9.375g（僅詳細資料，不放產品圖或DM主規格）';
      }
      if(product.id==='guilu-jiao'){
        normalized.size='600g（1斤）／盒｜32塊裝';
        normalized.unitApprox='每塊約18.75g（僅詳細資料，不放產品圖或DM主規格）';
      }
      return {
        ...normalized,
        image:customer,
        imageUrl:customer,
        image_url:customer,
        detailImages:[customer],
        officialOriginalImage:official||normalized.officialOriginalImage||'',
        imagePolicy:'formal-product-image-only-contain-no-crop-no-dm-substitution',
        officialImagePolicy:'products-v3-real-product-identity-reference-only',
        physicalScalePolicy:'preserve-real-product-shape-package-and-proportion'
      };
    });
    data.runtime={
      ...(data.runtime||{}),
      productMainImageSource:VERSION,
      productImageVersion:VERSION,
      dmSource:'separate-detailed-dm-authority',
      trialMode:TRIAL.mode,
      trialComponent:TRIAL.id,
      trialMascotSupport:TRIAL.mascot,
      trialProductImage:TRIAL.product,
      retiredTrialBinaries:[...TRIAL.retired],
      trialRole:'separate-trial-component-not-a-product-image-or-dm'
    };
    return data;
  }

  function isDataUrl(value=''){
    try{return /(?:^|\/)data\.json(?:[?#]|$)/i.test(new URL(String(value||''),location.href).pathname)}catch{return false}
  }
  function cacheBustInput(input){
    const raw=typeof input==='string'?input:String(input?.url||'');
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
    if(!dataRequest) return response;
    try{
      const data=normalizeData(await response.clone().json());
      return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:response.headers});
    }catch(error){
      console.warn('仙加味產品資料權威套用失敗',error);
      return response;
    }
  };

  function pageProductId(){
    const path=location.pathname.toLowerCase();
    if(path.includes('product-guilu-gao')) return 'guilu-gao';
    if(path.includes('product-guilu-drink-30cc')) return 'guilu-drink-30';
    if(path.includes('product-guilu-drink-180cc')) return 'guilu-drink-180';
    if(path.includes('product-guilu-tangkuai')) return 'guilu-tangkuai';
    if(path.includes('product-guilu-jiao')) return 'guilu-jiao';
    if(path.includes('product-luerong-fen')) return 'luerong-fen';
    return '';
  }

  function normalizeHead(){
    const id=pageProductId();
    const photo=CUSTOMER[id];
    if(!photo) return;
    const absolute=ABS(photo);
    document.querySelectorAll('meta[property="og:image"],meta[name="twitter:image"]').forEach(meta=>meta.setAttribute('content',absolute));
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script=>{
      try{
        const value=JSON.parse(script.textContent||'{}');
        if(value&&value['@type']==='Product'){
          value.image=absolute;
          script.textContent=JSON.stringify(value);
        }
      }catch{}
    });
  }

  const COPY_REPLACEMENTS=Object.freeze([
    ['30cc／瓶','30cc／罐（小玻璃罐）'],
    ['30cc／瓶（玻璃瓶）','30cc／罐（小玻璃罐）'],
    ['龜鹿飲30cc玻璃瓶','龜鹿飲30cc玻璃罐'],
    ['75g／盒｜8塊裝｜每塊約9.375g','75g／盒｜8塊裝'],
    ['600g／盒｜1斤｜32塊裝','600g（1斤）／盒｜32塊裝'],
    ['600g／盒｜32塊裝｜每塊約18.75g','600g（1斤）／盒｜32塊裝'],
    ['600g（1斤）／盒｜32塊裝｜每塊約18.75g','600g（1斤）／盒｜32塊裝']
  ]);

  function normalizeVisibleCopy(root=document){
    const body=root.body||root;
    if(!body||!document.createTreeWalker) return;
    const walker=document.createTreeWalker(body,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    for(const node of nodes){
      const text=String(node.nodeValue||'');
      let next=text;
      for(const [from,to] of COPY_REPLACEMENTS) next=next.replaceAll(from,to);
      if(next!==text) node.nodeValue=next;
    }
  }

  function normalizeCustomerLinks(root=document){
    if(!root?.querySelectorAll) return;
    root.querySelectorAll('a').forEach(link=>{
      if(String(link.textContent||'').trim()==='查看門市'){
        link.textContent='LINE 詢問';
        link.href=LINE_URL;
        link.target='_blank';
        link.rel='noopener';
      }
    });
  }

  function normalizeCustomerAddress(root=document){
    if(!root?.body||!/\/(?:index\.html)?$/i.test(location.pathname)) return;
    const walker=document.createTreeWalker(root.body,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode()) nodes.push(walker.currentNode);
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
    normalizeHead();
    normalizeCustomerView();
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued) return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;normalizeCustomerView();});
    });
    observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',startCopyGuard,{once:true});
  else startCopyGuard();

  window.XJWProductDataAuthority=Object.freeze({
    version:VERSION,
    officialVersion:VERSION,
    dataCacheVersion:DATA_CACHE_VERSION,
    official:OFFICIAL,
    customer:CUSTOMER,
    trial:TRIAL,
    normalizeData,
    normalizeHead,
    normalizeVisibleCopy,
    normalizeCustomerView,
    cacheBustInput
  });
})();
