"use strict";

/* 仙加味顧客端產品主視覺｜2026-09-27 DM-style formal main product set v15
 * 官網六項產品文字知識以 public-product-master.json 為最高權威。
 * 一般展示統一使用 images/dm-v3 六張正式主產品圖；完整介紹頁另使用 dm-final 正式詳細圖。
 * 原始實物照片只保留作產品身份／包裝比例參考，不再作一般展示主圖。
 */
(function(){
  if(window.__XJW_CUSTOMER_DISPLAY_20260812__) return;
  window.__XJW_CUSTOMER_DISPLAY_20260812__=true;

  const VERSION='20260927-dm-showcase-v34';
  const CURRENT_30_USAGE='每日 1–2 罐';
  const CURRENT_GAO_TIMING='食用時間可依個人使用習慣與作息時間安排';
  const PUBLIC_IDS=Object.freeze(['guilu-gao','guilu-drink-30','guilu-drink-180','guilu-tangkuai','guilu-jiao','luerong-fen']);
  const DISPLAY=Object.freeze({
  "guilu-gao": "images/dm-v3/guilu-gao.jpg",
  "guilu-drink-30": "images/dm-v3/guilu-drink-30.jpg",
  "guilu-drink-180": "images/dm-v3/guilu-drink-180.jpg",
  "guilu-tangkuai": "images/dm-v3/guilu-tangkuai.jpg",
  "guilu-jiao": "images/dm-v3/guilu-jiao.jpg",
  "luerong-fen": "images/dm-v3/luerong-fen.jpg"
});
  const DM=Object.freeze({
  "guilu-gao": "images/dm-final/01_guilu-gao-100g-dm.jpg",
  "guilu-drink-30": "images/dm-final/02_guilu-drink-30cc-dm-official-v20260814.jpg",
  "guilu-drink-180": "images/dm-final/03_guilu-drink-180cc-dm.jpg",
  "luerong-fen": "images/dm-final/04_luerong-fen-75g-dm.jpg",
  "guilu-tangkuai": "images/dm-final/05_guilu-tangkuai-75g-dm.jpg",
  "guilu-jiao": "images/dm-final/06_guilu-jiao-600g-dm.jpg"
});
  const IDENTITY=Object.freeze({
  "guilu-gao": "images/guilu-gao.jpg",
  "guilu-drink-30": "images/guilu-drink-30cc-glass.jpg",
  "guilu-drink-180": "images/guilu-drink-180cc.jpg",
  "guilu-tangkuai": "images/products-v2/guilu-tangkuai-open-new.jpg",
  "guilu-jiao": "images/products-v2/guilu-jiao-open-new.jpg",
  "luerong-fen": "images/products-v2/luerong-fen.jpeg"
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

  function isDataUrl(value=''){
    try{return /(?:^|\/)data\.json(?:[?#]|$)/i.test(new URL(String(value||''),location.href).pathname)}catch{return false}
  }
  function normalize(data){
    if(!data||!Array.isArray(data.products)) return data;
    data.products=data.products.filter(product=>PUBLIC_IDS.includes(product?.id)).map(product=>{
      const display=DISPLAY[product?.id],dm=DM[product?.id],identity=IDENTITY[product?.id];
      if(!display) return product;
      const displayUrl=`${display}?v=${VERSION}`;
      const dmUrl=`${dm}?v=${VERSION}`;
      const normalized={...product};
      if(product.id==='guilu-gao'){
        normalized.usagePrimary=CURRENT_GAO_TIMING;
        if(Array.isArray(normalized.usage)&&normalized.usage.length)normalized.usage=[CURRENT_GAO_TIMING,...normalized.usage.slice(1)];
      }
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
        image:displayUrl,imageUrl:displayUrl,image_url:displayUrl,
        detailImages:[dmUrl],dmImage:dmUrl,
        officialOriginalImage:identity?`${identity}?v=${VERSION}`:(product.officialOriginalImage||''),
        imagePolicy:'approved-unified-formal-main-product-visual-no-package-redesign-no-crop-no-stretch',
        officialImagePolicy:'verified-original-product-photo-kept-as-identity-reference',
        physicalScalePolicy:'depicted-product-must-match-real-approved-product-shape-package-and-proportion'
      };
    });
    data.officialProductIds=[...PUBLIC_IDS];
    data.officialProductCount=6;
    data.knowledgeProductIds=[...PUBLIC_IDS];
    data.knowledgeProductCount=6;
    data.approvedMediaProductCount=6;
    data.runtime={
      ...(data.runtime||{}),
      productTextAuthority:'public-product-master.json',
      knowledgeProductCount:6,
      approvedMediaProductCount:6,
      productMainImageSource:'images/dm-v3/',
      productIdentityReference:'verified-original-product-photo-paths',
      dmSource:'images/dm-final/',
      detailImagesRole:'complete-product-pages-only',
      trialMode:TRIAL.mode,
      trialPoster:`${TRIAL.image}?v=${VERSION}`,
      trialProductImage:`${TRIAL.product}?v=${VERSION}`,
      retiredTrialBinaries:TRIAL.retired,
      guiluGaoUsageTiming:CURRENT_GAO_TIMING,
      drink30Usage:CURRENT_30_USAGE,
      drink180Usage:'每日一包',
      displayVersion:VERSION,
      displayRule:'首頁、產品總覽、怎麼選、試喝與推薦等一般展示統一使用 dm-v3 六項 DM 風正式主圖；完整介紹頁主圖相同，詳細區才使用 dm-final；產品包裝與比例不得重畫、拉伸或裁切。'
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
    }catch(error){console.warn('仙加味顧客端正式產品圖套用失敗',error);return response;}
  };

  window.XJWCustomerDisplayAuthority=Object.freeze({version:VERSION,current30Usage:CURRENT_30_USAGE,currentGaoTiming:CURRENT_GAO_TIMING,products:DISPLAY,dm:DM,trial:TRIAL,identity:IDENTITY,normalize});
})();
