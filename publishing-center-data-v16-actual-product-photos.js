(()=>{
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const PRODUCT_IMAGE_VERSION='20260810-products-v3-true-originals-v2';
  const VERSION='2026-08-10-v18-products-v3-true-originals-retired-assets-removed';
  const MAP={
    'guilu-gao':`https://ts15825868.github.io/xianjiawei/images/products-v3/guilu-gao.jpg?v=${PRODUCT_IMAGE_VERSION}`,
    'guilu-drink-30':`https://ts15825868.github.io/xianjiawei/images/products-v3/guilu-drink-30.jpg?v=${PRODUCT_IMAGE_VERSION}`,
    'guilu-drink-180':`https://ts15825868.github.io/xianjiawei/images/products-v3/guilu-drink-180.jpg?v=${PRODUCT_IMAGE_VERSION}`,
    'guilu-tangkuai':`https://ts15825868.github.io/xianjiawei/images/products-v3/guilu-tangkuai.jpg?v=${PRODUCT_IMAGE_VERSION}`,
    'guilu-jiao':`https://ts15825868.github.io/xianjiawei/images/products-v3/guilu-jiao.jpg?v=${PRODUCT_IMAGE_VERSION}`,
    'luerong-fen':`https://ts15825868.github.io/xianjiawei/images/products-v3/luerong-fen.jpg?v=${PRODUCT_IMAGE_VERSION}`
  };
  const SAFE_PREFLIGHT=Object.freeze({
    'XJW-WORK-REST-001':'images/posts/generated-v20260808-preflight/work-rest.svg',
    'POST-STORAGE':'images/posts/generated-v20260808-preflight/storage.svg',
    'POST-SEASONS-RHYTHM':'images/posts/generated-v20260808-preflight/four-seasons.svg',
    'POST-INGREDIENT-PRINCIPLE':'images/posts/generated-v20260808-preflight/ingredient-principle.svg',
    'POST-DAILY-SOUP':'images/posts/generated-v20260808-preflight/daily-soup.svg',
    'POST-WEATHER-HOT':'images/posts/generated-v20260808-preflight/weather-hot.svg',
    'POST-WEATHER-TEMP':'images/posts/generated-v20260808-preflight/weather-temp.svg',
    'POST-WEATHER-RAIN':'images/posts/generated-v20260808-preflight/weather-rain.svg',
    'POST-STORE':'images/posts/generated-v20260808-preflight/contact-line.svg',
    'POST-RECIPES':'images/posts/generated-v20260808-preflight/recipes.svg'
  });
  const FORCE_REGEN_IDS=new Set([
    'POST-PRODUCT-OVERVIEW',
    'POST-COMBO',
    'POST-GUIDE',
    'POST-CHOOSE',
    'POST-CHOOSE-BY-HABIT'
  ]);
  const LEGACY_SINGLE_SVG=[
    [/generated-v20260808-priority1\/guilu-gao-100g\.svg/i,'guilu-gao'],
    [/generated-v20260808-priority1\/guilu-drink-30cc\.svg/i,'guilu-drink-30'],
    [/generated-v20260808-priority1\/guilu-drink-180cc\.svg/i,'guilu-drink-180'],
    [/generated-v20260808-priority1\/guilu-jiao-600g\.svg/i,'guilu-jiao']
  ];
  const LEGACY_MULTI_SVG=/generated-v20260808-(?:priority1|preflight)\/(?:product-overview|guilu-gao-drink-combo|guide-use|choose-products|choose-by-habit)\.svg/i;
  function refsOf(p){return Array.isArray(p?.product_refs)?[...new Set(p.product_refs.filter(id=>MAP[id]))]:[]}
  function productId(p){
    const refs=refsOf(p);
    if(refs.length>1)return'';
    if(refs.length===1)return refs[0];
    const t=`${p?.id||''} ${p?.title||''} ${p?.copy||''}`;
    if(FORCE_REGEN_IDS.has(p?.id)||/POST-PRODUCT-OVERVIEW|POST-COMBO/.test(t))return'';
    if(/POST-DRINK-30|龜鹿飲30cc/.test(t))return'guilu-drink-30';
    if(/POST-DRINK-180|龜鹿飲180cc/.test(t))return'guilu-drink-180';
    if(/POST-SOUP-75|龜鹿湯塊/.test(t)&&!/龜鹿膠/.test(t))return'guilu-tangkuai';
    if(/POST-JIAO-600|龜鹿膠/.test(t)&&!/龜鹿湯塊/.test(t))return'guilu-jiao';
    if(/POST-LUERONG|鹿茸粉/.test(t)&&!/龜鹿/.test(t))return'luerong-fen';
    if(/POST-GAO-100|龜鹿膏/.test(t)&&!/龜鹿飲/.test(t))return'guilu-gao';
    return'';
  }
  function quarantine(p,reason){
    return{
      ...p,
      status:'pending_review',
      image_url:null,
      image_asset_id:null,
      image_status:'needs_generation',
      candidate_generated:false,
      candidate_generation_mode:'copy-matched-regeneration-required',
      publish_allowed:false,
      schedule_enabled:false,
      scheduled_at:null,
      owner_review_required:true,
      approval_required:true,
      image_policy:'products-v3-true-originals-only-single-scene-no-collage',
      physical_scale_policy:'multi-product-relative-scale-must-be-evidenced',
      image_review_reason:`${reason}｜舊卡片／海報候選已退役，不可直接送審。請用「圖不符合｜ChatGPT重生成」依原文案重做單一完整場景；產品本體只能使用${PRODUCT_IMAGE_VERSION}真正products-v3實拍原圖，無可靠相對尺寸時不要多產品同框。完成後回待審核並重做16項檢查。`
    };
  }
  function safeReplacement(p,path){
    return{
      ...p,
      status:'pending_review',
      image_asset_id:`preflight-safe-${p.id}`,
      image_url:path,
      image_status:'candidate-review-required',
      candidate_generated:true,
      candidate_generation_mode:'preflight-product-free-safe-replacement',
      publish_allowed:false,
      schedule_enabled:false,
      scheduled_at:null,
      owner_review_required:true,
      approval_required:true,
      image_policy:'copy-matched-product-free-candidate',
      image_review_reason:'舊圖文綁定已隔離，改用不重畫產品的嚴格預檢替代候選；仍須完成16項人工審核，若文案／季節／環境／冷熱／表情／動作不符就再用ChatGPT重生成。'
    };
  }
  function fixPost(p){
    const url=String(p?.image_url||'');
    if(p.status!=='published'&&FORCE_REGEN_IDS.has(p.id))return quarantine(p,'此篇原本的batch5獨立卡片／產品海報候選不符合目前單一完整場景規則');
    if(p.status!=='published'&&SAFE_PREFLIGHT[p.id])return safeReplacement(p,SAFE_PREFLIGHT[p.id]);
    const refs=refsOf(p);
    if(LEGACY_MULTI_SVG.test(url))return quarantine(p,'偵測到內嵌舊產品圖的多產品歷史SVG');
    if(refs.length>1&&!url&&p.status!=='published')return quarantine(p,'多產品貼文目前沒有可驗證的正式候選圖');
    const legacySingle=LEGACY_SINGLE_SVG.find(([re])=>re.test(url));
    const id=legacySingle?.[1]||productId(p);
    if(!id||!MAP[id])return p;
    const isLegacy=/\/images\/products-v2\//i.test(url)||/\/images\/dm-final\//i.test(url)||!!legacySingle;
    const isWrongV3=/\/images\/products-v3\//i.test(url)&&url!==MAP[id];
    if(isLegacy||isWrongV3||!url){
      return{
        ...p,
        image_url:MAP[id],
        image_asset_id:`official-v3-true-original-${id}`,
        image_source:'products-v3-true-original-product-photo',
        image_status:'candidate-review-required',
        image_policy:'approved-original-uniform-scale-contain-no-crop-no-stretch',
        physical_scale_policy:'preserve-original-aspect-and-realistic-relative-scale',
        publish_allowed:false,
        schedule_enabled:false,
        scheduled_at:null,
        owner_review_required:true,
        approval_required:true,
        image_review_reason:`${String(p.image_review_reason||'').replace(/products-v2|products-v3|正式原圖/g,'正式產品原圖')}｜2026-08-10校正：舊產品圖／舊SVG／舊海報已淘汰；產品本體只用${PRODUCT_IMAGE_VERSION}真正products-v3實拍，禁止拉寬、拉高、裁切、AI重畫。`
      };
    }
    return{
      ...p,
      image_source:p.image_source||'products-v3-true-original-product-photo',
      image_policy:'approved-original-uniform-scale-contain-no-crop-no-stretch',
      physical_scale_policy:'preserve-original-aspect-and-realistic-relative-scale'
    };
  }
  function patchAuthorityNotices(){
    document.querySelectorAll('.published-note,.spec-note,.automation-note').forEach(node=>{
      let html=node.innerHTML;
      html=html.replace('v16再攔截任何漏網 products-v3／舊DM產品主圖','產品圖守門會攔截任何舊 products-v2／舊DM／舊SVG／舊海報產品主圖');
      html=html.replace('產品若出現只引用 <strong>products-v2 實際產品照片</strong>，不再把 products-v3 宣傳版面當產品主圖',`產品若出現只引用 <strong>${PRODUCT_IMAGE_VERSION} products-v3 真正產品實拍原圖</strong>；舊 products-v2、舊DM、舊海報與內嵌舊產品圖的SVG不得作產品主圖`);
      html=html.replace('產品主圖只用 products-v2 實際產品照片等比例合成',`產品主圖只用 ${PRODUCT_IMAGE_VERSION} products-v3 真正產品實拍原圖等比例呈現`);
      node.innerHTML=html;
    });
  }
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const response=await PREV_FETCH(input,init);
    if(!url.includes(TARGET)||!response.ok)return response;
    try{
      const data=await response.clone().json();
      const posts=(data.posts||[]).map(fixPost);
      const merged={...data,version:'2026-08-10-public-posts-v30-true-originals-retired-assets-removed',posts};
      merged.counts={...(data.counts||{}),total:posts.length,needs_generation:posts.filter(p=>p.image_status==='needs_generation'||(!p.image_url&&p.status!=='published'&&!p.campaign_hold)).length,candidate_review:posts.filter(p=>p.image_status==='candidate-review-required'&&!p.campaign_hold).length,preflight_safe_replacements:posts.filter(p=>p.candidate_generation_mode==='preflight-product-free-safe-replacement').length,retired_batch5_forced_regeneration:posts.filter(p=>FORCE_REGEN_IDS.has(p.id)&&p.image_status==='needs_generation').length,forced_regeneration:posts.filter(p=>p.candidate_generation_mode==='copy-matched-regeneration-required').length};
      const headers=new Headers(response.headers);
      headers.set('content-type','application/json; charset=utf-8');
      headers.set('cache-control','no-store');
      return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});
    }catch{return response}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patchAuthorityNotices,{once:true});else patchAuthorityNotices();
  window.XJWActualProductPhotoAuthority=Object.freeze({version:VERSION,productImageVersion:PRODUCT_IMAGE_VERSION,map:MAP,productId,fixPost,patchAuthorityNotices,safePreflight:SAFE_PREFLIGHT,retiredProductCardIds:[...FORCE_REGEN_IDS],forceRegeneration:[...FORCE_REGEN_IDS]});
})();