(()=>{
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const PRIORITY1={
    'POST-PRODUCT-OVERVIEW':'images/posts/generated-v20260808-priority1/product-overview.svg',
    'POST-GAO-100':'images/posts/generated-v20260808-priority1/guilu-gao-100g.svg',
    'POST-DRINK-30':'images/posts/generated-v20260808-priority1/guilu-drink-30cc.svg',
    'POST-DRINK-180':'images/posts/generated-v20260808-priority1/guilu-drink-180cc.svg',
    'POST-JIAO-600':'images/posts/generated-v20260808-priority1/guilu-jiao-600g.svg',
    'POST-COMBO':'images/posts/generated-v20260808-priority1/guilu-gao-drink-combo.svg'
  };
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const response=await PREV_FETCH(input,init);
    if(!url.includes(TARGET)||!response.ok)return response;
    try{
      const data=await response.clone().json();
      const posts=(data.posts||[]).map((p)=>{
        const candidate=PRIORITY1[p.id];
        if(!candidate||p.status==='published')return p;
        return{
          ...p,
          status:'pending_review',
          image_url:candidate,
          image_status:'candidate-review-required',
          candidate_generated:true,
          candidate_generation_mode:'exact-official-original-composite',
          candidate_generated_at:'2026-08-08T15:47:00+08:00',
          publish_allowed:false,
          schedule_enabled:false,
          scheduled_at:null,
          owner_review_required:true,
          approval_required:true,
          image_review_reason:'第一優先批次已使用官網正式產品原圖等比例合成候選圖；產品本體未重畫、未裁切、未改包裝。仍須完成16項檢查後才可核准。'
        };
      });
      const merged={...data,version:'2026-08-08-public-posts-v13-priority1-resilient',posts};
      merged.counts={...(data.counts||{}),total:posts.length,priority1_candidate:posts.filter((p)=>p.candidate_generated).length,pending_review:posts.filter((p)=>p.status==='pending_review').length,needs_generation:posts.filter((p)=>p.image_status==='needs_generation'||(!p.image_url&&p.status!=='published')).length};
      const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');
      return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});
    }catch{return response;}
  };
})();
