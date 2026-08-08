(()=>{
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const VERSION='2026-08-09-v16-products-v3-size-lock-legacy-svg-quarantine';
  const MAP={
    'guilu-gao':'https://ts15825868.github.io/xianjiawei/images/products-v3/guilu-gao.jpg?v=20260809-25',
    'guilu-drink-30':'https://ts15825868.github.io/xianjiawei/images/products-v3/guilu-drink-30.jpg?v=20260809-25',
    'guilu-drink-180':'https://ts15825868.github.io/xianjiawei/images/products-v3/guilu-drink-180.jpg?v=20260809-25',
    'guilu-tangkuai':'https://ts15825868.github.io/xianjiawei/images/products-v3/guilu-tangkuai.jpg?v=20260809-25',
    'guilu-jiao':'https://ts15825868.github.io/xianjiawei/images/products-v3/guilu-jiao.jpg?v=20260809-25',
    'luerong-fen':'https://ts15825868.github.io/xianjiawei/images/products-v3/luerong-fen.jpg?v=20260809-25'
  };
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
    if(/POST-PRODUCT-OVERVIEW|POST-COMBO/.test(t))return'';
    if(/POST-DRINK-30|龜鹿飲30cc/.test(t))return'guilu-drink-30';
    if(/POST-DRINK-180|龜鹿飲180cc/.test(t))return'guilu-drink-180';
    if(/POST-SOUP-75|龜鹿湯塊/.test(t)&&!/龜鹿膠/.test(t))return'guilu-tangkuai';
    if(/POST-JIAO-600|龜鹿膠/.test(t)&&!/龜鹿湯塊/.test(t))return'guilu-jiao';
    if(/POST-LUERONG|鹿茸粉/.test(t)&&!/龜鹿/.test(t))return'luerong-fen';
    if(/POST-GAO-100|龜鹿膏/.test(t)&&!/龜鹿飲/.test(t))return'guilu-gao';
    return'';
  }
  function quarantineMulti(p,reason){
    return{
      ...p,
      status:'pending_review',
      image_url:null,
      image_asset_id:null,
      image_status:'needs_generation',
      candidate_generated:false,
      candidate_generation_mode:'multi-product-real-scale-regeneration-required',
      publish_allowed:false,
      schedule_enabled:false,
      scheduled_at:null,
      owner_review_required:true,
      approval_required:true,
      image_policy:'products-v3-only-real-scale-no-guessing',
      physical_scale_policy:'multi-product-relative-scale-must-be-evidenced',
      image_review_reason:`${reason}｜多產品同框不得把產品強制等高／等寬，也不得沿用內嵌products-v2的舊SVG。請依原文案用ChatGPT重生成，產品本體只使用products-v3正式原圖，完成後回待審核。`
    };
  }
  function fixPost(p){
    const url=String(p?.image_url||'');
    const refs=refsOf(p);
    if(LEGACY_MULTI_SVG.test(url))return quarantineMulti(p,'偵測到內嵌舊產品圖的多產品歷史SVG');
    if(refs.length>1&&!url&&p.status!=='published')return quarantineMulti(p,'多產品貼文目前沒有可驗證的正式候選圖');
    const legacySingle=LEGACY_SINGLE_SVG.find(([re])=>re.test(url));
    const id=legacySingle?.[1]||productId(p);
    if(!id||!MAP[id])return p;
    const isLegacy=/\/images\/products-v2\//i.test(url)||/\/images\/dm-final\//i.test(url)||!!legacySingle;
    const isWrongV3=/\/images\/products-v3\//i.test(url)&&url!==MAP[id];
    if(isLegacy||isWrongV3||!url){
      return{
        ...p,
        image_url:MAP[id],
        image_asset_id:`official-v3-${id}`,
        image_source:'products-v3-user-approved-original-product-photo',
        image_status:'candidate-review-required',
        image_policy:'approved-original-uniform-scale-contain-no-crop-no-stretch',
        physical_scale_policy:'preserve-original-aspect-and-realistic-relative-scale',
        publish_allowed:false,
        schedule_enabled:false,
        scheduled_at:null,
        owner_review_required:true,
        approval_required:true,
        image_review_reason:`${String(p.image_review_reason||'').replace(/products-v2|products-v3|正式原圖/g,'正式產品原圖')}｜2026-08-09校正：舊產品圖／舊SVG已淘汰；產品本體只用products-v3核准實拍，禁止拉寬、拉高、裁切、AI重畫。`
      };
    }
    return{
      ...p,
      image_source:p.image_source||'products-v3-user-approved-original-product-photo',
      image_policy:'approved-original-uniform-scale-contain-no-crop-no-stretch',
      physical_scale_policy:'preserve-original-aspect-and-realistic-relative-scale'
    };
  }
  function patchAuthorityNotices(){
    document.querySelectorAll('.published-note,.spec-note,.automation-note').forEach(node=>{
      let html=node.innerHTML;
      html=html.replace('v16再攔截任何漏網 products-v3／舊DM產品主圖','v16再攔截任何漏網 products-v2／舊DM／舊SVG產品主圖');
      html=html.replace('產品若出現只引用 <strong>products-v2 實際產品照片</strong>，不再把 products-v3 宣傳版面當產品主圖','產品若出現只引用 <strong>products-v3 使用者確認的正式產品原圖</strong>；舊 products-v2、舊DM與內嵌舊產品圖的SVG不得作產品主圖');
      html=html.replace('產品主圖只用 products-v2 實際產品照片等比例合成','產品主圖只用 products-v3 使用者確認的正式產品原圖等比例合成');
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
      const merged={...data,version:'2026-08-09-public-posts-v26-products-v3-legacy-svg-quarantine',posts};
      merged.counts={...(data.counts||{}),total:posts.length,needs_generation:posts.filter(p=>p.image_status==='needs_generation'||(!p.image_url&&p.status!=='published'&&!p.campaign_hold)).length,candidate_review:posts.filter(p=>p.image_status==='candidate-review-required'&&!p.campaign_hold).length};
      const headers=new Headers(response.headers);
      headers.set('content-type','application/json; charset=utf-8');
      headers.set('cache-control','no-store');
      return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});
    }catch{return response}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patchAuthorityNotices,{once:true});else patchAuthorityNotices();
  window.XJWActualProductPhotoAuthority=Object.freeze({version:VERSION,map:MAP,productId,fixPost,patchAuthorityNotices,legacyMultiSvg:LEGACY_MULTI_SVG});
})();