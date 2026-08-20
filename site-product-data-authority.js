"use strict";

/* 仙加味產品資料權威層｜2026-08-20 七項公開母資料
 * public-product-master.json 是七項目前正式產品文字／AI核心事實的公開權威。
 * data.json 保留六項已有正式產品圖的顧客展示資料與通路欄位；
 * 產品圖／DM沿用目前核准媒體，不得由文字母資料重畫或替換。
 */
(function(){
  if(window.__XJW_PRODUCT_DATA_AUTHORITY__)return;
  window.__XJW_PRODUCT_DATA_AUTHORITY__=true;

  const VERSION='20260820-seven-product-public-master-v2';
  const MASTER_URL='public-product-master.json';
  const LINE_URL='https://lin.ee/sHZW7NkR';
  const CURRENT_30_USAGE='每日 1–2 罐';
  const MEDIA_PRODUCT_IDS=Object.freeze(['guilu-gao','guilu-drink-30','guilu-drink-180','guilu-tangkuai','guilu-jiao','luerong-fen']);
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
      if(!response.ok)throw new Error(`public-product-master HTTP ${response.status}`);
      return response.json();
    })
    .then(master=>{
      if(master?.authority!=='user-confirmed-current'||master?.productCount!==7||!Array.isArray(master?.products)||master.products.length!==7){
        throw new Error('public-product-master authority/productCount invalid');
      }
      const p30=(master.products||[]).find(product=>product.id==='guilu-drink-30');
      if(!Array.isArray(p30?.usage)||p30.usage[0]!==CURRENT_30_USAGE){
        throw new Error(`public-product-master 30cc usage invalid: ${p30?.usage?.[0]||'missing'}`);
      }
      state.master=master;
      return master;
    })
    .catch(error=>{
      state.error=error;
      console.error('仙加味七項產品公開母資料載入失敗；暫以既有靜態資料顯示',error);
      return null;
    });

  function productById(master,id){
    return (master?.products||[]).find(product=>product.id===id)||null;
  }

  function fulfillmentNotice(master,product){
    if(product?.id==='guilu-drink-30'||product?.id==='guilu-drink-180')return product.fulfillment||master?.fulfillmentPolicy?.drinkLeadTime||'';
    return '';
  }

  function usagePrimary(source,product){
    if(Array.isArray(source?.usage)&&String(source.usage[0]||'').trim())return String(source.usage[0]).trim();
    return source?.usagePrimary||product?.usagePrimary||'';
  }

  function normalizeProduct(product,master){
    const source=productById(master,product?.id);
    if(!source)return product;
    // 正式圖片與DM只保留目前展示資料既有核准媒體；七項文字母資料不持有或生成產品圖。
    const image=product.image||product.imageUrl||product.image_url||'';
    const dm=product.dmImage||image;
    const usage=Array.isArray(source.usage)&&source.usage.length?[...source.usage]:product.usage;
    const detail=source.detail||source.detailUnitApprox||product.detailUnitApprox||product.unitApprox||'';
    return {
      ...product,
      series:source.series||product.series,
      name:source.name,
      displayName:source.name,
      specification:source.specification,
      size:source.specification,
      spec:source.specification,
      form:source.form||product.form,
      package:source.package||product.package,
      ingredients:Array.isArray(source.ingredients)&&source.ingredients.length?[...source.ingredients]:product.ingredients,
      usagePrimary:usagePrimary(source,product),
      usageTiming:source.usageTiming||product.usageTiming,
      usage,
      detailUnitApprox:detail||undefined,
      unitApprox:detail||undefined,
      fulfillmentType:(source.id==='guilu-drink-30'||source.id==='guilu-drink-180')?'made-to-order-drink':product.fulfillmentType,
      fulfillmentNotice:fulfillmentNotice(master,source)||product.fulfillmentNotice,
      page:source.page?new URL(source.page,location.href).pathname.split('/').pop():product.page,
      detailPage:source.page?new URL(source.page,location.href).pathname.split('/').pop():product.detailPage,
      image,
      imageUrl:image,
      image_url:image,
      detailImages:Array.isArray(product.detailImages)&&product.detailImages.length?product.detailImages:(image?[image]:[]),
      dmImage:dm,
      officialOriginalImage:product.officialOriginalImage||'',
      imagePolicy:'approved-media-only-no-ai-redraw-no-crop-no-stretch',
      physicalScalePolicy:product.physicalScalePolicy||'preserve-real-product-shape-package-and-proportion'
    };
  }

  function normalizeData(data,master){
    if(!data||!Array.isArray(data.products)||!master)return data;
    const normalized={...data};
    normalized.products=data.products.filter(product=>MEDIA_PRODUCT_IDS.includes(product.id)).map(product=>normalizeProduct(product,master));
    normalized.fulfillmentPolicy={...(data.fulfillmentPolicy||{}),...(master.fulfillmentPolicy||{})};
    normalized.officialProductIds=[...MEDIA_PRODUCT_IDS];
    normalized.officialProductCount=MEDIA_PRODUCT_IDS.length;
    normalized.knowledgeProductIds=(master.products||[]).map(product=>product.id);
    normalized.knowledgeProductCount=master.productCount;
    normalized.productMasterVersion=master.version;
    normalized.productMasterAuthority=master.authority;
    normalized.publicDisclaimer=master.publicCopyPolicy||data.publicDisclaimer;
    normalized.runtime={
      ...(data.runtime||{}),
      productDataAuthority:'public-product-master.json',
      productMasterVersion:master.version,
      productMasterMode:'seven-product-text-authority-six-approved-media-products',
      productMasterLoaded:true,
      knowledgeProductCount:7,
      approvedMediaProductCount:6
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
      console.warn('仙加味七項產品公開母資料套用失敗',error);
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
    if(!product)return;
    document.querySelectorAll('script[type="application/ld+json"]').forEach(script=>{
      try{
        const value=JSON.parse(script.textContent||'{}');
        if(value&&value['@type']==='Product'){
          value.name=`仙加味・${product.name}`;
          const primary=usagePrimary(product,{});
          if(primary===CURRENT_30_USAGE&&typeof value.description==='string'){
            value.description=value.description.replace(/每日\s*1\s*[-–～至]\s*2\s*罐/g,CURRENT_30_USAGE);
          }
          script.textContent=JSON.stringify(value);
        }
      }catch{}
    });
  }

  const COPY_REPLACEMENTS=Object.freeze([
    ['30cc／瓶（玻璃瓶）','30cc／罐（小玻璃罐）'],
    ['30cc／瓶','30cc／罐（小玻璃罐）'],
    ['龜鹿飲30cc玻璃瓶','龜鹿飲30cc玻璃罐'],
    ['每日 1-2罐',CURRENT_30_USAGE],
    ['每日1-2罐',CURRENT_30_USAGE],
    ['每日 1-2 罐',CURRENT_30_USAGE],
    ['每日 1～2罐',CURRENT_30_USAGE],
    ['每日1～2罐',CURRENT_30_USAGE],
    ['每日 1～2 罐',CURRENT_30_USAGE],
    ['每日1–2罐',CURRENT_30_USAGE],
    ['每日 1–2罐',CURRENT_30_USAGE],
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
