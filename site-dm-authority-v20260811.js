"use strict";

/* 仙加味顧客DM權威層｜2026-08-13 HD fix
 * 產品主圖、詳細DM、trial展示元件分開。
 * 本層只負責六張詳細DM；DM一律使用已核准的高解析 JPG 母檔。
 * 不得再以 8~10KB 低解析 WebP 作為顧客端正式DM。
 */
(function(){
  if(window.__XJW_DM_AUTHORITY__) return;
  window.__XJW_DM_AUTHORITY__=true;

  const VERSION='20260813-dm-trial-display-fix-v1';
  const DM=Object.freeze({
    'guilu-gao':'images/dm-final/01_guilu-gao-100g-dm.jpg',
    'guilu-drink-30':'images/dm-final/02_guilu-drink-30cc-dm.jpg',
    'guilu-drink-180':'images/dm-final/03_guilu-drink-180cc-dm.jpg',
    'guilu-tangkuai':'images/dm-final/05_guilu-tangkuai-75g-dm.jpg',
    'guilu-jiao':'images/dm-final/06_guilu-jiao-600g-dm.jpg',
    'luerong-fen':'images/dm-final/04_luerong-fen-75g-dm.jpg'
  });
  const RETIRED_TRIAL=Object.freeze([
    'images/customer-display-v20260812/trial.webp',
    'images/customer-display-v20260812/trial-clean-v4.svg',
    'images/customer-display-v20260812/trial-small-boss.webp',
    'images/customer-display-v20260812/trial-small-boss.jpg',
    'images/customer-display-v20260812/trial-small-boss.png'
  ]);
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
          return dm?{...product,dmImage:`${dm}?v=${VERSION}`,dmImagePolicy:'separate-current-approved-hd-dm-contain-no-crop'}:product;
        });
      }
      data.runtime={
        ...(data.runtime||{}),
        dmSource:'separate-current-approved-hd-dm',
        dmVersion:VERSION,
        dmRoleRule:'product main image / high-resolution detailed DM / trial component are separate roles',
        trialMediaOwnedBy:'trial-showcase-v20260813',
        retiredTrialBinaries:[...RETIRED_TRIAL]
      };
      delete data.runtime.trialImage;
      delete data.runtime.trialSource;
      return new Response(JSON.stringify(data),{status:response.status,statusText:response.statusText,headers:response.headers});
    }catch(error){
      console.warn('仙加味DM權威套用失敗',error);
      return response;
    }
  };
  window.XJWCurrentDmAuthority=Object.freeze({
    version:VERSION,
    products:DM,
    role:'separate-high-resolution-detailed-dm-only',
    trialMediaOwnedBy:'trial-showcase-v20260813',
    retiredTrialBinaries:RETIRED_TRIAL
  });
})();
