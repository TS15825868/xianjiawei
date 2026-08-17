"use strict";

/* 仙加味產品資料權威層｜2026-08-17 SSOT
 * product-master.json 是六項正式產品公共安全核心事實的唯一來源。
 * data.json 與頁面既有內容只作版面／非核心文案底稿；核心產品事實一律由 SSOT 覆寫。
 */
(function(){
  if(window.__XJW_PRODUCT_DATA_AUTHORITY__)return;
  window.__XJW_PRODUCT_DATA_AUTHORITY__=true;

  const VERSION='20260817-product-ssot-v1';
  const MASTER_URL='product-master.json';
  const LINE_URL='https://lin.ee/sHZW7NkR';
  const nativeFetch=window.fetch.bind(window);
  const ABS=path=>new URL(path,location.href).href;
  const state={master:null,error:null};

  function cacheBusted(url){
    const value=new URL(url,location.href);
    value.searchParams.set('xjw',VERSION);
    return value.href;
  }

  const masterPromise=nativeFetch(cacheBusted(MASTER_URL),{cache:'no-store'})
    .then(response=>{
      if(!response.ok)throw new Error(`product-master HTTP ${response.status}`);
      return response.json();
    })
    .then(master=>{
      if(master?.authority!=='xianjiawei-product-ssot'||!Array.isArray(master?.products)||master.products.length!==6){
        throw new Error('product-master authority/productCount invalid');
      }
      state.master=master;
      return master;
    })
    .catch(error=>{
      state.error=error;
      console.error('仙加味產品 SSOT 載入失敗；暫以既有靜態資料顯示',error);
      return null;
    });

  function productById(master,id){
    return (master?.products||[]).find(product=>product.id===id)||null;
  }

  function fulfillmentNotice(master,product){
    if(product?.fulfillmentType==='made-to-order-drink')return master?.fulfillmentPolicy?.drinkNotice||'';
    if(product?.fulfillmentType==='ready-stock')return master?.fulfillmentPolicy?.readyStockNotice||'';
    return '';
  }

  function normalizeProduct(product,master){
    const source=productById(master,product?.id);
    if(!source)return product;
    const image=source.approvedProductImage||product.image||'';
    const dm=source.approvedDm||product.dmImage||image;
    return {
      ...product,
      series:source.series||product.series,
      name:source.name,
      displayName:source.displayName||source.name,
      specification:source.specification,
      size:source.size||source.specification,
      spec:source.specification,
      form:source.form||product.form,
      package:source.package||product.package,
      description:source.description||product.description,
      ingredients:Array.isArray(source.ingredients)?[...source.ingredients]:product.ingredients,
      usagePrimary:source.usagePrimary||product.usagePrimary,
      usageTiming:source.usageTiming||product.usageTiming,
      usage:Array.isArray(source.usage)?[...source.usage]:product.usage,
      storage:Array.isArray(source.storage)?[...source.storage]:product.storage,
      fit:source.fit||product.fit,
      purpose:source.purpose||product.purpose,
      purposeDirection:source.purposeDirection||product.purposeDirection,
      page:source.page||product.page,
      detailPage:source.page||product.detailPage,
      fulfillmentType:source.fulfillmentType||product.fulfillmentType,
      fulfillmentNotice:fulfillmentNotice(master,source)||product.fulfillmentNotice,
      readyStock:Boolean(source.readyStock),
      detailUnitApprox:source.detailUnitApprox||product.detailUnitApprox,
      unitApprox:source.detailUnitApprox||product.unitApprox,
      image,
      imageUrl:image,
      image_url:image,
      detailImages:[image],
      dmImage:dm,
      officialOriginalImage:source.officialOriginalImage||product.officialOriginalImage||'',
      knownContainerDimensionsMm:source.knownContainerDimensionsMm??product.knownContainerDimensionsMm,
      aspectRatioWidthToHeight:source.aspectRatioWidthToHeight??product.aspectRatioWidthToHeight,
      imagePolicy:'ssot-approved-product-image-no-crop-no-stretch',
      physicalScalePolicy:product.physicalScalePolicy||'preserve-real-product-shape-package-and-proportion'
    };
  }

  function normalizeData(data,master){
    if(!data||!Array.isArray(data.products)||!master)return data;
    const normalized={...data};
    normalized.products=data.products.map(product=>normalizeProduct(product,master));
    normalized.fulfillmentPolicy={...(data.fulfillmentPolicy||{}),...(master.fulfillmentPolicy||{})};
    normalized.officialProductIds=[...(master.officialProductIds||[])];
    normalized.officialProductCount=master.productCount;
    normalized.productMasterVersion=master.version;
    normalized.productMasterAuthority=master.authority;
    normalized.publicDisclaimer=master.publicDisclaimer||data.publicDisclaimer;
    normalized.runtime={
      ...(data.runtime||{}),
      productDataAuthority:'product-master.json',
      productMasterVersion:master.version,
      productMasterMode:'single-source-of-truth',
      productMasterLoaded:true
    };
    return normalized;
  }

  function isDataUrl(value=''){
    try{return /(?:^|\/)data\.json(?:[?#]|$)/i.test(new URL(String(value||''),location.href).pathname)}catch{return false;}
  }

  function cacheBustInput(input){
    const raw=typeof input==='string'?input:String(input?.url||'');
    const url=new URL(raw,location.href);
    url.searchParams.set('xjw',VERSION);
    if(typeof input==='string')return url.href;
    try{return new Request(url.href,input)}catch{return url.href;}
  }

  window.fetch=async function(input,init){
    const raw=typeof input==='string'?input:String(input?.url||'');
    const dataRequest=isDataUrl(raw);
    const response=await nativeFetch(dataRequest?cacheBustInput(input):input,init);
    if(!dataRequest)return response;
    try{
      const [data,master]=await Promise.all([response.clone().json(),masterPromise]);
      const normalized=normalizeData(data,master);
      return new Response(JSON.stringify(normalized),{status:response.status,statusText:response.statusText,headers:response.headers});
    }catch(error){
      console.warn('仙加味產品 SSOT 套用失敗',error);
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

  async function normalizeHead(){
    const master=await masterPromise;
    const product=productById(master,pageProductId());
    const image=product?.approvedProductImage;
    if(!image)return;
    const absolute=ABS(image);
    document.querySelectorAll('meta[property="og:image"],meta[name="twitter:image"]').forEach(meta=>{if(meta.content!==absolute)meta.content=absolute;});
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script=>{
      try{
        const value=JSON.parse(script.textContent||'{}');
        if(value&&value['@type']==='Product'){
          value.name=product.name||value.name;
          value.image=absolute;
          if(product.description)value.description=product.description;
          script.textContent=JSON.stringify(value);
        }
      }catch{}
    });
  }

  const COPY_REPLACEMENTS=Object.freeze([
    ['30cc／瓶（玻璃瓶）','30cc／罐（小玻璃罐）'],
    ['30cc／瓶','30cc／罐（小玻璃罐）'],
    ['龜鹿飲30cc玻璃瓶','龜鹿飲30cc玻璃罐'],
    ['600g／盒｜1斤｜32塊裝','600g （1斤）／盒｜32塊裝']
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
        link.textContent='LINE 詢問';
        link.href=LINE_URL;
        link.target='_blank';
        link.rel='noopener';
      }
    });
  }

  function normalizeCustomerView(){normalizeVisibleCopy();normalizeCustomerLinks();}

  function startCopyGuard(){
    normalizeHead();
    normalizeCustomerView();
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;normalizeCustomerView();});
    });
    observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startCopyGuard,{once:true});else startCopyGuard();

  window.XJWProductDataAuthority=Object.freeze({
    version:VERSION,
    masterUrl:MASTER_URL,
    getMaster:()=>masterPromise,
    normalizeData,
    normalizeProduct,
    normalizeHead,
    normalizeVisibleCopy,
    normalizeCustomerView,
    state
  });
})();
