"use strict";

/* 仙加味顧客端產品主視覺｜2026-08-12
 * 使用者最新要求：官網／LINE／貼文中心對外優先使用正式DM／正式視覺，不再以簡單原圖作主要展示。
 * products-v3仍保留為實際產品外觀、包裝、比例與標示的不可變身份權威。
 */
(function(){
  if(window.__XJW_CUSTOMER_DISPLAY_20260812__) return;
  window.__XJW_CUSTOMER_DISPLAY_20260812__=true;

  const VERSION='20260812-customer-display-v1';
  const DISPLAY=Object.freeze({
    'guilu-gao':'images/customer-display-v20260812/guilu-gao.webp',
    'guilu-drink-30':'images/customer-display-v20260812/guilu-drink-30cc.webp',
    'guilu-drink-180':'images/customer-display-v20260812/guilu-drink-180cc.webp',
    'guilu-tangkuai':'images/customer-display-v20260812/guilu-tangkuai.webp',
    'guilu-jiao':'images/customer-display-v20260812/guilu-jiao.webp',
    'luerong-fen':'images/customer-display-v20260812/luerong-fen.webp'
  });
  const TRIAL='images/customer-display-v20260812/trial.webp';
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
      return {
        ...product,
        image:displayUrl,
        imageUrl:displayUrl,
        image_url:displayUrl,
        dmImage:displayUrl,
        detailImages:[displayUrl],
        officialOriginalImage:official||product.officialOriginalImage||'',
        imagePolicy:'customer-facing-approved-dm-visual-contain-no-crop',
        officialImagePolicy:'products-v3-real-product-identity-no-redraw',
        physicalScalePolicy:'depicted-product-must-match-real-approved-product-shape-package-and-proportion'
      };
    });
    data.runtime={
      ...(data.runtime||{}),
      productMainImageSource:'current-user-approved-customer-display',
      dmSource:'current-user-approved-customer-display',
      officialProductImageSource:'products-v3-real-product-identity-authority',
      trialImage:`${TRIAL}?v=${VERSION}`,
      displayVersion:VERSION,
      displayRule:'customer-facing uses polished approved DM visuals; actual product depiction must match products-v3 and current specs'
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
      console.warn('仙加味顧客端正式視覺套用失敗',error);
      return response;
    }
  };

  window.XJWCustomerDisplayAuthority=Object.freeze({version:VERSION,products:DISPLAY,trial:TRIAL,official:OFFICIAL,normalize});
})();
