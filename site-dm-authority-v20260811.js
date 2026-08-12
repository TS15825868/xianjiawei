"use strict";

/* 仙加味顧客DM權威層｜2026-08-12 binary-fix-v2
 * 產品圖與DM分開：產品頁／產品卡使用六張正式產品圖；DM欄位只使用各產品詳細DM。
 * 龜鹿膏原 .webp 檔內容無效，暫改用同一份核准 JPG 母圖；其餘五張沿用有效 WebP。
 * products-v3仍只作實物外觀、包裝與比例校正。
 */
(function(){
  if(window.__XJW_DM_AUTHORITY__) return;
  window.__XJW_DM_AUTHORITY__=true;

  const VERSION='20260812-dm-binary-fix-v2';
  const DM=Object.freeze({
    'guilu-gao':'images/dm-final/01_guilu-gao-100g-dm.jpg',
    'guilu-drink-30':'images/dm-approved-v20260810/guilu-drink-30cc.webp',
    'guilu-drink-180':'images/dm-approved-v20260810/guilu-drink-180cc.webp',
    'guilu-tangkuai':'images/dm-approved-v20260810/guilu-tangkuai-75g.webp',
    'guilu-jiao':'images/dm-approved-v20260810/guilu-jiao-600g.webp',
    'luerong-fen':'images/dm-approved-v20260810/lurong-fen-75g.webp'
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
          return dm?{...product,dmImage:`${dm}?v=${VERSION}`,dmImagePolicy:'separate-corrected-detailed-dm-valid-binary-contain-no-crop'}:product;
        });
      }
      data.runtime={...(data.runtime||{}),dmSource:'separate-corrected-detailed-dm-valid-binary',dmVersion:VERSION,trialImage:`${TRIAL}?v=20260812-screenshot-fix-v1`,dmRoleRule:'product image / detailed DM / trial image are separate media roles'};
      return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:response.headers});
    }catch(error){
      console.warn('仙加味DM權威套用失敗',error);
      return response;
    }
  };
  window.XJWCurrentDmAuthority=Object.freeze({version:VERSION,products:DM,trial:TRIAL,role:'separate-detailed-dm'});
})();
