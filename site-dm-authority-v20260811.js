"use strict";

/* 仙加味目前顧客DM權威層｜2026-08-12
 * 顧客端優先使用使用者最新核准正式DM／視覺圖。
 * products-v3仍是產品實物與包裝身份權威；任何展示圖不得改變實際產品。
 */
(function(){
  if(window.__XJW_DM_AUTHORITY__) return;
  window.__XJW_DM_AUTHORITY__=true;

  const VERSION='20260812-user-approved-customer-display';
  const DM=Object.freeze({
    'guilu-gao':'images/customer-display-v20260812/guilu-gao.webp',
    'guilu-drink-30':'images/customer-display-v20260812/guilu-drink-30cc.webp',
    'guilu-drink-180':'images/customer-display-v20260812/guilu-drink-180cc.webp',
    'guilu-tangkuai':'images/customer-display-v20260812/guilu-tangkuai.webp',
    'guilu-jiao':'images/customer-display-v20260812/guilu-jiao.webp',
    'luerong-fen':'images/customer-display-v20260812/luerong-fen.webp'
  });
  const TRIAL='images/customer-display-v20260812/trial.webp';
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
          return dm?{...product,dmImage:`${dm}?v=${VERSION}`,dmImagePolicy:'current-user-approved-customer-display-contain-no-crop'}:product;
        });
      }
      data.runtime={...(data.runtime||{}),dmSource:'current-user-approved-customer-display',dmVersion:VERSION,trialImage:`${TRIAL}?v=${VERSION}`};
      return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:response.headers});
    }catch(error){
      console.warn('仙加味目前DM權威套用失敗',error);
      return response;
    }
  };
  window.XJWCurrentDmAuthority=Object.freeze({version:VERSION,products:DM,trial:TRIAL});
})();
