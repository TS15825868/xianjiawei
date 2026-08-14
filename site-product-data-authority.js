"use strict";

/* 仙加味目前產品資料權威層｜2026-08-14 v8
 * 六張正式產品圖／詳細DM／trial海報為獨立媒體角色。
 * 權威主規格與每塊約重分欄保存；顧客產品頁、FAQ與快速查看可合併顯示完整規格。
 */
(function(){
  if(window.__XJW_PRODUCT_DATA_AUTHORITY__)return;
  window.__XJW_PRODUCT_DATA_AUTHORITY__=true;

  const VERSION='20260814-site-refresh-v4';
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
    'guilu-drink-180':`images/customer-display-v20260812/guilu-drink-180cc-product.jpg?v=${VERSION}`,
    'guilu-tangkuai':`images/customer-display-v20260812/guilu-tangkuai.avif?v=${VERSION}`,
    'guilu-jiao':`images/customer-display-v20260812/guilu-jiao.avif?v=${VERSION}`,
    'luerong-fen':`images/customer-display-v20260812/luerong-fen.avif?v=${VERSION}`
  });
  const TRIAL=Object.freeze({
    mode:'poster',
    id:'trial-poster-small-boss-official-v20260814',
    poster:`images/trial/trial-poster-small-boss-official-v20260814.jpg?v=${VERSION}`,
    product:CUSTOMER['guilu-drink-30'],
    retired:Object.freeze([
      'images/customer-display-v20260812/trial.webp',
      'images/customer-display-v20260812/trial-clean-v4.svg',
      'images/customer-display-v20260812/trial-small-boss.webp',
      'images/customer-display-v20260812/trial-small-boss.jpg',
      'images/customer-display-v20260812/trial-small-boss.png'
    ])
  });
  const ABS=path=>new URL(path,location.href).href;

  function normalizeData(data){
    if(!data||!Array.isArray(data.products))return data;
    data.products=data.products.map(product=>{
      const customer=CUSTOMER[product?.id];
      const official=OFFICIAL[product?.id];
      if(!customer)return product;
      const normalized={...product};

      if(product.id==='guilu-drink-30'){
        normalized.size='30cc／罐（小玻璃罐）';
        normalized.usage=['每日 1-2罐','可直接飲用或隔水溫熱後飲用','飲用時間可依個人使用習慣與作息時間安排','避免冰飲','開罐後請儘速飲用完畢'];
      }
      if(product.id==='guilu-drink-180'){
        normalized.size='180cc／包（鋁袋）';
        normalized.usage=['每日一包','可直接飲用或隔水溫熱後飲用','飲用時間可依個人使用習慣與作息時間安排','避免冰飲','開封後請儘速飲用完畢'];
      }
      if(product.id==='guilu-gao'){
        normalized.size='100g／罐';
        normalized.usage=['食用時間可依個人使用習慣與作息時間安排','初次可先從半匙開始','可直接取用或加入約100～300mL溫熱水化開'];
        normalized.storage=['未開封常溫陰涼保存','開罐後請密封冷藏並使用乾淨湯匙取用'];
      }
      if(product.id==='guilu-tangkuai'){
        normalized.size='75g （2兩）／盒｜8塊裝';
        normalized.unitApprox='每塊約9.375g';
      }
      if(product.id==='guilu-jiao'){
        normalized.size='600g （1斤）／盒｜32塊裝';
        normalized.unitApprox='每塊約18.75 g';
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
      trialPoster:TRIAL.poster,
      trialProductImage:TRIAL.product,
      retiredTrialBinaries:[...TRIAL.retired]
    };
    return data;
  }

  function isDataUrl(value=''){
    try{return /(?:^|\/)data\.json(?:[?#]|$)/i.test(new URL(String(value||''),location.href).pathname)}catch{return false;}
  }
  function cacheBustInput(input){
    const raw=typeof input==='string'?input:String(input?.url||'');
    const url=new URL(raw,location.href);
    url.searchParams.set('xjw',DATA_CACHE_VERSION);
    if(typeof input==='string')return url.href;
    try{return new Request(url.href,input)}catch{return url.href;}
  }

  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const raw=typeof input==='string'?input:String(input?.url||'');
    const dataRequest=isDataUrl(raw);
    const response=await nativeFetch(dataRequest?cacheBustInput(input):input,init);
    if(!dataRequest)return response;
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
    if(path.includes('product-guilu-gao'))return'guilu-gao';
    if(path.includes('product-guilu-drink-30cc'))return'guilu-drink-30';
    if(path.includes('product-guilu-drink-180cc'))return'guilu-drink-180';
    if(path.includes('product-guilu-tangkuai'))return'guilu-tangkuai';
    if(path.includes('product-guilu-jiao'))return'guilu-jiao';
    if(path.includes('product-luerong-fen'))return'luerong-fen';
    return'';
  }

  function normalizeHead(){
    const id=pageProductId(),photo=CUSTOMER[id];
    if(!photo)return;
    const absolute=ABS(photo);
    document.querySelectorAll('meta[property="og:image"],meta[name="twitter:image"]').forEach(meta=>{if(meta.content!==absolute)meta.content=absolute;});
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script=>{
      try{
        const value=JSON.parse(script.textContent||'{}');
        if(value&&value['@type']==='Product'&&value.image!==absolute){value.image=absolute;script.textContent=JSON.stringify(value);}
      }catch{}
    });
  }

  const COPY_REPLACEMENTS=Object.freeze([
    ['30cc／瓶（玻璃瓶）','30cc／罐（小玻璃罐）'],
    ['30cc／瓶','30cc／罐（小玻璃罐）'],
    ['龜鹿飲30cc玻璃瓶','龜鹿飲30cc玻璃罐'],
    ['600g／盒｜1斤｜32塊裝','600g （1斤）／盒｜32塊裝'],
    ['食用時間可依個人使用習慣與作息時間安排','食用時間可依個人使用習慣與作息時間安排'],
    ['一般食用時間可依個人使用習慣與作息時間安排','食用時間可依個人使用習慣與作息時間安排']
  ]);

  function normalizeVisibleCopy(root=document){
    const body=root.body||root;
    if(!body||!document.createTreeWalker)return;
    const walker=document.createTreeWalker(body,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      const text=String(node.nodeValue||'');
      let next=text;
      for(const [from,to] of COPY_REPLACEMENTS)next=next.replaceAll(from,to);
      if(next!==text)node.nodeValue=next;
    }
  }

  function normalizeCustomerLinks(root=document){
    if(!root?.querySelectorAll)return;
    root.querySelectorAll('a').forEach(link=>{
      if(String(link.textContent||'').trim()==='查看門市'){
        link.textContent='LINE 詢問';link.href=LINE_URL;link.target='_blank';link.rel='noopener';
      }
    });
  }
  function normalizeCustomerView(){normalizeVisibleCopy();normalizeCustomerLinks();}

  function startCopyGuard(){
    normalizeHead();normalizeCustomerView();
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;queued=true;
      requestAnimationFrame(()=>{queued=false;normalizeCustomerView();});
    });
    observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startCopyGuard,{once:true});else startCopyGuard();

  window.XJWProductDataAuthority=Object.freeze({version:VERSION,officialVersion:VERSION,dataCacheVersion:DATA_CACHE_VERSION,official:OFFICIAL,customer:CUSTOMER,trial:TRIAL,normalizeData,normalizeHead,normalizeVisibleCopy,normalizeCustomerView,cacheBustInput});
})();
