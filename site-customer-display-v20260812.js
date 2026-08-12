"use strict";

/* 仙加味顧客端產品主視覺｜2026-08-12 最終六產品圖
 * 使用者最新確認：官網／LINE／貼文中心對外使用這一批六張正式產品圖；DM與試喝圖分開管理。
 * products-v3仍保留為實際產品外觀、包裝、比例與標示的不可變身份參考，不得用來覆蓋最新顧客主視覺。
 */
(function(){
  if(window.__XJW_CUSTOMER_DISPLAY_20260812__) return;
  window.__XJW_CUSTOMER_DISPLAY_20260812__=true;

  const VERSION='20260812-six-product-final-v2';
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
        dmImage:displayUrl,
        detailImages:[displayUrl],
        officialOriginalImage:official||product.officialOriginalImage||'',
        imagePolicy:'user-confirmed-six-product-customer-visual-contain-no-crop',
        officialImagePolicy:'products-v3-real-product-identity-reference-no-redraw',
        physicalScalePolicy:'depicted-product-must-match-real-approved-product-shape-package-and-proportion'
      };
    });
    data.runtime={
      ...(data.runtime||{}),
      productMainImageSource:'20260812-user-confirmed-six-product-final',
      dmSource:'separate-current-approved-dm-layer',
      officialProductImageSource:'products-v3-real-product-identity-reference',
      trialImage:`${TRIAL}?v=${VERSION}`,
      displayVersion:VERSION,
      displayRule:'六張產品圖=產品主視覺；DM與試喝圖分開；30cc/180cc/湯塊/龜鹿膠不得再共用試喝圖或錯圖'
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
      console.warn('仙加味顧客端正式六產品圖套用失敗',error);
      return response;
    }
  };

  window.XJWCustomerDisplayAuthority=Object.freeze({version:VERSION,products:DISPLAY,trial:TRIAL,official:OFFICIAL,normalize});
})();
