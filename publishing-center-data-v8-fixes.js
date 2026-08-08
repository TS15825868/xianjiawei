(()=>{
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const SITE='https://ts15825868.github.io/xianjiawei/';
  const VERSION='2026-08-09-v8-products-v3-scale-safe';
  const SINGLE_PRODUCT={
    'POST-GAO-100':`${SITE}images/products-v3/guilu-gao.jpg?v=20260809-25`,
    'POST-DRINK-30':`${SITE}images/products-v3/guilu-drink-30.jpg?v=20260809-25`,
    'POST-DRINK-180':`${SITE}images/products-v3/guilu-drink-180.jpg?v=20260809-25`,
    'POST-JIAO-600':`${SITE}images/products-v3/guilu-jiao.jpg?v=20260809-25`
  };
  const MULTI_PRODUCT_HOLD=new Set(['POST-PRODUCT-OVERVIEW','POST-COMBO']);
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const response=await PREV_FETCH(input,init);
    if(!url.includes(TARGET)||!response.ok)return response;
    try{
      const data=await response.clone().json();
      const posts=(data.posts||[]).map((p)=>{
        if(p.status==='published')return p;
        if(SINGLE_PRODUCT[p.id]){
          return{
            ...p,
            status:'pending_review',
            image_url:SINGLE_PRODUCT[p.id],
            image_source:'products-v3-user-approved-original-product-photo',
            image_status:'candidate-review-required',
            candidate_generated:true,
            candidate_generation_mode:'official-single-product-photo-products-v3',
            candidate_generated_at:'2026-08-09T02:30:00+08:00',
            image_policy:'approved-original-uniform-scale-contain-no-crop-no-stretch',
            physical_scale_policy:'preserve-real-product-size-and-original-aspect',
            publish_allowed:false,
            schedule_enabled:false,
            scheduled_at:null,
            owner_review_required:true,
            approval_required:true,
            image_review_reason:'已淘汰舊priority1 SVG。此單品貼文改用products-v3使用者核准正式產品原圖；只允許等比例縮放，不裁切、不拉寬、不拉高、不重畫產品。仍須完成16項人工審核。'
          };
        }
        if(MULTI_PRODUCT_HOLD.has(p.id)){
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
            image_review_reason:'舊多產品SVG已停用。多產品同框不得把不同產品強制等高或等寬；沒有完整可信相對實物尺寸時不可猜測。請用「圖不符合｜ChatGPT生成」依文案重做，產品本體只合成products-v3正式原圖，完成後回待審核。'
          };
        }
        return p;
      });
      const merged={...data,version:'2026-08-09-public-posts-v24-priority1-products-v3-scale-safe',posts};
      merged.counts={...(data.counts||{}),total:posts.length,priority1_single_product:posts.filter((p)=>p.candidate_generation_mode==='official-single-product-photo-products-v3').length,multi_product_needs_generation:posts.filter((p)=>p.candidate_generation_mode==='multi-product-real-scale-regeneration-required').length,pending_review:posts.filter((p)=>p.status==='pending_review').length,needs_generation:posts.filter((p)=>p.image_status==='needs_generation'||(!p.image_url&&p.status!=='published'&&!p.campaign_hold)).length};
      const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');
      return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});
    }catch{return response;}
  };
  window.XJWPriority1ScaleSafe=Object.freeze({version:VERSION,singleProduct:SINGLE_PRODUCT,multiProductHold:[...MULTI_PRODUCT_HOLD]});
})();
