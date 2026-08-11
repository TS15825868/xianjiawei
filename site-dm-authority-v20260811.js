"use strict";

/* 仙加味目前顧客DM權威層｜2026-08-11
 * 產品本體仍固定 products-v3 使用者上傳真實原圖；dmImage 改用目前核准上傳 DM。
 */
(function(){
  if(window.__XJW_DM_AUTHORITY__) return;
  window.__XJW_DM_AUTHORITY__=true;

  const VERSION='20260811-user-approved-dm';
  const DM=Object.freeze({
    'guilu-gao':'images/dm-final/01_guilu-gao-100g-dm.jpg',
    'guilu-drink-30':'images/dm-approved-v20260810/guilu-drink-30cc.webp',
    'guilu-drink-180':'images/dm-final/03_guilu-drink-180cc-dm.jpg',
    'guilu-tangkuai':'images/dm-final/05_guilu-tangkuai-75g-dm.jpg',
    'guilu-jiao':'images/dm-final/06_guilu-jiao-600g-dm.jpg',
    'luerong-fen':'images/dm-final/04_luerong-fen-75g-dm.jpg'
  });
  const TRIAL='images/dm-approved-v20260810/guilu-drink-trial.webp';
  const isDataUrl=(value='')=>{
    try{return /(?:^|\/)data\.json(?:[?#]|$)/i.test(new URL(String(value||''),location.href).pathname)}catch{return false}
  };
  const previousFetch=window.fetch.bind(window);
  window.fetch=async function(input,init){
    const raw=typeof input==='string'?input:String(input?.url||'');
    const response=await previousFetch(input,init);
    if(!isDataUrl(raw)) return response;
    try{
      const data=await response.clone().json();
      if(Array.isArray(data.products)){
        data.products=data.products.map(product=>{
          const dm=DM[product?.id];
          return dm?{...product,dmImage:`${dm}?v=${VERSION}`,dmImagePolicy:'current-user-approved-dm-contain-no-crop'}:product;
        });
      }
      data.runtime={...(data.runtime||{}),dmSource:'current-user-approved-uploaded-dm',dmVersion:VERSION,trialImage:`${TRIAL}?v=${VERSION}`};
      return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:response.headers});
    }catch(error){
      console.warn('仙加味目前DM權威套用失敗',error);
      return response;
    }
  };
  window.XJWCurrentDmAuthority=Object.freeze({version:VERSION,products:DM,trial:TRIAL});
})();
