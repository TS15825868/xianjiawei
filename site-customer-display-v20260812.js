"use strict";

/* 仙加味顧客端產品主視覺｜2026-08-13 product-role-fix-v7
 * 六張產品主圖、詳細DM、試喝專頁視覺三個媒體角色分開管理。
 * 180cc 產品主圖改用真實鋁袋產品照片，不得再拿詳細DM海報替代。
 * 已知花圖的 trial-small-boss 二進位全部退出網站 runtime；trial.html 改由正式元件組合呈現。
 */
(function(){
  if(window.__XJW_CUSTOMER_DISPLAY_20260812__) return;
  window.__XJW_CUSTOMER_DISPLAY_20260812__=true;

  const VERSION='20260813-trial-product-role-fix-v8';
  const DISPLAY=Object.freeze({
    'guilu-gao':'images/customer-display-v20260812/guilu-gao.avif',
    'guilu-drink-30':'images/customer-display-v20260812/guilu-drink-30cc.avif',
    'guilu-drink-180':'images/customer-display-v20260812/guilu-drink-180cc-product.jpg',
    'guilu-tangkuai':'images/customer-display-v20260812/guilu-tangkuai.avif',
    'guilu-jiao':'images/customer-display-v20260812/guilu-jiao.avif',
    'luerong-fen':'images/customer-display-v20260812/luerong-fen.avif'
  });
  const TRIAL=Object.freeze({
    mode:'component',
    id:'trial-showcase-v20260813',
    mascot:'images/post-library/userzip3-v20260811/self-care-family-2.webp',
    product:DISPLAY['guilu-drink-30'],
    retired:['images/customer-display-v20260812/trial.webp','images/customer-display-v20260812/trial-clean-v4.svg','images/customer-display-v20260812/trial-small-boss.webp','images/customer-display-v20260812/trial-small-boss.jpg','images/customer-display-v20260812/trial-small-boss.png']
  });
  const OFFICIAL=window.XJWProductDataAuthority?.official||Object.freeze({
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
      const official=OFFICIAL[product?.id];
      if(!display) return product;
      const displayUrl=`${display}?v=${VERSION}`;
      const normalized={...product};
      if(product.id==='guilu-drink-30') normalized.size='30cc／罐（小玻璃罐）';
      if(product.id==='guilu-drink-180') normalized.size='180cc／包（鋁袋）';
      if(product.id==='guilu-tangkuai'){
        normalized.size='75g／盒｜8塊裝';
        normalized.unitApprox='每塊約9.375g（僅詳細資料，不放產品主圖／DM主規格）';
      }
      if(product.id==='guilu-jiao'){
        normalized.size='600g（1斤）／盒｜32塊裝';
        normalized.unitApprox='每塊約18.75g（僅詳細資料，不放產品主圖／DM主規格）';
      }
      return {
        ...normalized,
        image:displayUrl,
        imageUrl:displayUrl,
        image_url:displayUrl,
        detailImages:[displayUrl],
        officialOriginalImage:official||product.officialOriginalImage||'',
        imagePolicy:'formal-product-image-only-contain-no-crop-no-dm-substitution',
        officialImagePolicy:'products-v3-real-product-identity-reference-no-redraw',
        physicalScalePolicy:'depicted-product-must-match-real-approved-product-shape-package-and-proportion'
      };
    });
    data.runtime={
      ...(data.runtime||{}),
      productMainImageSource:VERSION,
      dmSource:'separate-current-approved-dm-layer',
      officialProductImageSource:'products-v3-real-product-identity-reference',
      trialMode:TRIAL.mode,
      trialComponent:TRIAL.id,
      trialMascotSupport:`${TRIAL.mascot}?v=${VERSION}`,
      trialProductImage:`${TRIAL.product}?v=${VERSION}`,
      retiredTrialBinaries:TRIAL.retired,
      displayVersion:VERSION,
      displayRule:'產品主圖／詳細DM／trial元件完全分開；180cc產品主圖不得使用DM；已知花圖trial二進位不得再進網站runtime'
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

  window.XJWCustomerDisplayAuthority=Object.freeze({version:VERSION,products:DISPLAY,trial:TRIAL,official:OFFICIAL,normalize});
})();
