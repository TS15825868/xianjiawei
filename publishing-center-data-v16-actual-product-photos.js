(()=>{
  'use strict';
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const VERSION='2026-08-20-v16-current-customer-media-compatibility';
  const SITE='https://ts15825868.github.io/xianjiawei/';
  const CURRENT_PRODUCT_VERSION='20260820-current-authority';
  const MAP=Object.freeze({
    'guilu-gao':`${SITE}images/customer-display-v20260812/guilu-gao.avif?v=${CURRENT_PRODUCT_VERSION}`,
    'guilu-drink-30':`${SITE}images/customer-display-v20260812/guilu-drink-30cc.avif?v=${CURRENT_PRODUCT_VERSION}`,
    'guilu-drink-180':`${SITE}images/customer-display-v20260812/guilu-drink-180cc-product.jpg?v=${CURRENT_PRODUCT_VERSION}`,
    'guilu-tangkuai':`${SITE}images/customer-display-v20260812/guilu-tangkuai.avif?v=${CURRENT_PRODUCT_VERSION}`,
    'guilu-jiao':`${SITE}images/customer-display-v20260812/guilu-jiao.avif?v=${CURRENT_PRODUCT_VERSION}`,
    'luerong-fen':`${SITE}images/customer-display-v20260812/luerong-fen.avif?v=${CURRENT_PRODUCT_VERSION}`
  });
  const IDENTITY_MAP=Object.freeze({
    'guilu-gao':`${SITE}images/products-v3/guilu-gao.jpg`,
    'guilu-drink-30':`${SITE}images/products-v3/guilu-drink-30.jpg`,
    'guilu-drink-180':`${SITE}images/products-v3/guilu-drink-180.jpg`,
    'guilu-tangkuai':`${SITE}images/products-v3/guilu-tangkuai.jpg`,
    'guilu-jiao':`${SITE}images/products-v3/guilu-jiao.jpg`,
    'luerong-fen':`${SITE}images/products-v3/luerong-fen.jpg`
  });
  const LEGACY_SINGLE_SVG=[
    [/generated-v20260808-priority1\/guilu-gao-100g\.svg/i,'guilu-gao'],
    [/generated-v20260808-priority1\/guilu-drink-30cc\.svg/i,'guilu-drink-30'],
    [/generated-v20260808-priority1\/guilu-drink-180cc\.svg/i,'guilu-drink-180'],
    [/generated-v20260808-priority1\/guilu-jiao-600g\.svg/i,'guilu-jiao']
  ];
  const LEGACY_MULTI_SVG=/generated-v20260808-(?:priority1|preflight)\/(?:product-overview|guilu-gao-drink-combo|guide-use|choose-products|choose-by-habit)\.svg/i;

  function refsOf(p){return Array.isArray(p?.product_refs)?[...new Set(p.product_refs.filter(id=>MAP[id]))]:[]}
  function productId(p){
    const refs=refsOf(p);if(refs.length>1)return'';if(refs.length===1)return refs[0];
    const t=`${p?.id||''} ${p?.title||''} ${p?.copy||''}`;
    if(/POST-PRODUCT-OVERVIEW|POST-COMBO|POST-GUIDE|POST-CHOOSE|POST-CHOOSE-BY-HABIT/.test(String(p?.id||'')))return'';
    if(/POST-DRINK-30|龜鹿飲30cc/.test(t))return'guilu-drink-30';
    if(/POST-DRINK-180|龜鹿飲180cc/.test(t))return'guilu-drink-180';
    if(/POST-SOUP-75|龜鹿湯塊/.test(t)&&!/龜鹿膠/.test(t))return'guilu-tangkuai';
    if(/POST-JIAO-600|龜鹿膠/.test(t)&&!/龜鹿湯塊/.test(t))return'guilu-jiao';
    if(/POST-LUERONG|鹿茸粉/.test(t)&&!/龜鹿/.test(t))return'luerong-fen';
    if(/POST-GAO-100|龜鹿膏/.test(t)&&!/龜鹿飲/.test(t))return'guilu-gao';
    return'';
  }
  function normalize(v){return String(v||'').replace(/^https?:\/\/[^/]+\/xianjiawei\//i,'').replace(/^\//,'').split(/[?#]/)[0]}
  function pendingNoImage(p,reason){
    if(p?.status==='published'||p?.status==='archived')return p;
    return{...p,status:'pending_review',image_url:null,image_asset_id:null,image_status:'needs_generation',regeneration_mode:'chatgpt_handoff',candidate_generated:false,publish_allowed:false,schedule_enabled:false,scheduled_at:null,owner_review_required:true,approval_required:true,auto_approve:false,auto_schedule:false,auto_publish:false,image_review_reason:reason||p.image_review_reason||'目前沒有通過正式資料與圖文一致檢查的候選圖；重新生成後回待審核。'};
  }
  function fixPost(p){
    if(!p||p.status==='published'||p.status==='archived'||p.prevent_republish===true||p.do_not_republish===true)return p;
    const url=String(p.image_url||'');
    if(LEGACY_MULTI_SVG.test(url))return pendingNoImage(p,'偵測到內嵌退役產品圖的歷史多產品SVG；不得覆蓋目前七產品文字權威，需重新建立符合目前資料的候選圖。');
    const refs=refsOf(p);
    if(refs.length>1&&!url)return p.image_status==='needs_generation'?p:pendingNoImage(p,'多產品貼文目前沒有可驗證的正式候選圖；保留待生成，不以舊products-v3拼圖代替。');
    const legacySingle=LEGACY_SINGLE_SVG.find(([re])=>re.test(url));
    const id=legacySingle?.[1]||productId(p);
    if(!id||!MAP[id])return p;
    const normalized=normalize(url);
    const current=normalize(MAP[id]);
    const isRetired=/\/images\/products-v2\//i.test(url)||/\/images\/products-v3\//i.test(url)||/\/images\/dm-(?:final|approved-v\d+)\//i.test(url)||!!legacySingle;
    if(isRetired||!url||normalized!==current){
      return{...p,image_url:MAP[id],image_asset_id:`current-customer-product-${id}`,image_source:'customer-display-v20260812-approved-product-image',official_identity_reference:IDENTITY_MAP[id],image_status:'approved-existing-pending-copy-review',candidate_generated:false,publish_allowed:false,schedule_enabled:false,scheduled_at:null,owner_review_required:true,approval_required:true,auto_approve:false,auto_schedule:false,auto_publish:false,image_policy:'current-customer-display-contain-no-crop-no-stretch; products-v3-identity-reference-only',physical_scale_policy:'preserve-approved-original-aspect-and-realistic-scale',image_review_reason:'產品主圖已校正到目前核准customer-display正式實物圖；products-v3只保留產品身份、包裝與比例校正用途。文案或圖片變更後仍須重新完成16項審核。'};
    }
    return{...p,image_source:p.image_source||'customer-display-v20260812-approved-product-image',official_identity_reference:IDENTITY_MAP[id],image_policy:'current-customer-display-contain-no-crop-no-stretch; products-v3-identity-reference-only',physical_scale_policy:'preserve-approved-original-aspect-and-realistic-scale'};
  }
  function patchAuthorityNotices(){
    document.querySelectorAll?.('.published-note,.spec-note,.automation-note').forEach(node=>{
      let html=node.innerHTML;
      html=html.replace(/產品若出現只引用[^<]*(?:<strong>[^<]*<\/strong>)?[^。]*。?/g,'產品若出現，只使用目前核准 customer-display 正式實物圖；products-v3 只作產品身份、包裝與比例校正。');
      node.innerHTML=html;
    });
  }
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');const response=await PREV_FETCH(input,init);if(!url.includes(TARGET)||!response.ok)return response;
    try{const data=await response.clone().json();const posts=(data.posts||[]).map(fixPost);const merged={...data,version:`${data.version||'post-bank'}+v16-current-customer-media`,posts};merged.counts={...(data.counts||{}),total:posts.length,needs_generation:posts.filter(p=>p.image_status==='needs_generation'&&p.status!=='published'&&!p.campaign_hold).length};const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');headers.set('x-xianjiawei-current-product-media',VERSION);return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});}catch{return response}
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patchAuthorityNotices,{once:true});else patchAuthorityNotices();
  window.XJWActualProductPhotoAuthority=Object.freeze({version:VERSION,productImageVersion:CURRENT_PRODUCT_VERSION,map:MAP,identityMap:IDENTITY_MAP,productId,fixPost,patchAuthorityNotices,normalize});
})();