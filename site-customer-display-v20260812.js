"use strict";

/* 仙加味顧客端產品主視覺｜2026-08-20 current media authority v9
 * 七項產品文字知識以 public-product-master.json 為最高權威。
 * 六項已有核准正式產品圖；產品主圖、詳細DM、試喝正式海報分開管理。
 * products-v3 只作產品身份、包裝與比例校正，不作顧客產品主圖。
 */
(function(){
  if(window.__XJW_CUSTOMER_DISPLAY_20260812__) return;
  window.__XJW_CUSTOMER_DISPLAY_20260812__=true;

  const VERSION='20260820-current-media-authority-v9';
  const CURRENT_30_USAGE='每日 1–2 罐';
  const DISPLAY=Object.freeze({
    'guilu-gao':'images/customer-display-v20260812/guilu-gao.avif',
    'guilu-drink-30':'images/customer-display-v20260812/guilu-drink-30cc.avif',
    'guilu-drink-180':'images/customer-display-v20260812/guilu-drink-180cc-product.jpg',
    'guilu-tangkuai':'images/customer-display-v20260812/guilu-tangkuai.avif',
    'guilu-jiao':'images/customer-display-v20260812/guilu-jiao.avif',
    'luerong-fen':'images/customer-display-v20260812/luerong-fen.avif'
  });
  const TRIAL=Object.freeze({
    mode:'poster',
    id:'trial-poster-small-boss-official-v20260814',
    image:'images/trial/trial-poster-small-boss-official-v20260814.jpg',
    product:DISPLAY['guilu-drink-30'],
    retired:[
      'images/customer-display-v20260812/trial.webp',
      'images/customer-display-v20260812/trial-clean-v4.svg',
      'images/customer-display-v20260812/trial-small-boss.webp',
      'images/customer-display-v20260812/trial-small-boss.jpg',
      'images/customer-display-v20260812/trial-small-boss.png'
    ]
  });
  const IDENTITY=window.XJWProductDataAuthority?.official||Object.freeze({
    'guilu-gao':'images/products-v3/guilu-gao.jpg',
    'guilu-drink-30':'images/products-v3/guilu-drink-30.jpg',
    'guilu-drink-180':'images/products-v3/guilu-drink-180.jpg',
    'guilu-tangkuai':'images/products-v3/guilu-tangkuai.jpg',
    'guilu-jiao':'images/products-v3/guilu-jiao.jpg',
    'luerong-fen':'images/products-v3/luerong-fen.jpg'
  });

  function isDataUrl(value=''){
    try{return /(?:^|\/)data\.json(?:[?#]|$)/i.test(new URL(String(value||''),location.href).pathname)}catch{return false}
  }
  function normalize(data){
    if(!data||!Array.isArray(data.products)) return data;
    data.products=data.products.map(product=>{
      const display=DISPLAY[product?.id];
      const identity=IDENTITY[product?.id];
      if(!display) return product;
      const displayUrl=`${display}?v=${VERSION}`;
      const normalized={...product};
      if(product.id==='guilu-drink-30'){
        normalized.size='30cc／罐（小玻璃罐）';
        normalized.usagePrimary=CURRENT_30_USAGE;
        if(Array.isArray(normalized.usage)&&normalized.usage.length)normalized.usage=[CURRENT_30_USAGE,...normalized.usage.slice(1)];
      }
      if(product.id==='guilu-drink-180'){
        normalized.size='180cc／包（鋁袋）';
        normalized.usagePrimary='每日一包';
        if(Array.isArray(normalized.usage)&&normalized.usage.length)normalized.usage=['每日一包',...normalized.usage.slice(1)];
      }
      if(product.id==='guilu-tangkuai'){
        normalized.size='75g （2兩）／盒｜8塊裝';
        normalized.unitApprox='每塊約9.375g';
      }
      if(product.id==='guilu-jiao'){
        normalized.size='600g （1斤）／盒｜32塊裝';
        normalized.unitApprox='每塊約18.75g';
      }
      return {
        ...normalized,
        image:displayUrl,
        imageUrl:displayUrl,
        image_url:displayUrl,
        detailImages:[displayUrl],
        officialOriginalImage:identity||product.officialOriginalImage||'',
        imagePolicy:'current-customer-display-formal-product-image-contain-no-crop-no-stretch-no-dm-substitution',
        officialImagePolicy:'products-v3-product-identity-package-scale-reference-only-no-redraw',
        physicalScalePolicy:'depicted-product-must-match-real-approved-product-shape-package-and-proportion'
      };
    });
    data.runtime={
      ...(data.runtime||{}),
      productTextAuthority:'public-product-master.json',
      knowledgeProductCount:7,
      approvedMediaProductCount:6,
      productMainImageSource:'images/customer-display-v20260812/',
      productIdentityReference:'images/products-v3/',
      dmSource:'images/dm-final/',
      trialMode:TRIAL.mode,
      trialPoster:`${TRIAL.image}?v=${VERSION}`,
      trialProductImage:`${TRIAL.product}?v=${VERSION}`,
      retiredTrialBinaries:TRIAL.retired,
      drink30Usage:CURRENT_30_USAGE,
      drink180Usage:'每日一包',
      displayVersion:VERSION,
      displayRule:'七項產品文字知識／六項核准正式產品圖；產品主圖、詳細DM、試喝正式海報分離；products-v3只作身份與比例校正；柒玄茶未核准正式產品實物原圖前不得生成包裝。'
    };
    return data;
  }

  const previousFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const raw=typeof input==='string'?input:String(input?.url||'');
    const response=await previousFetch(input,init);
    if(!isDataUrl(raw)) return response;
    try{
      const data=normalize(await response.clone().json());
      return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:response.headers});
    }catch(error){
      console.warn('仙加味顧客端正式產品圖套用失敗',error);
      return response;
    }
  };

  window.XJWCustomerDisplayAuthority=Object.freeze({version:VERSION,current30Usage:CURRENT_30_USAGE,products:DISPLAY,trial:TRIAL,identity:IDENTITY,normalize});
})();