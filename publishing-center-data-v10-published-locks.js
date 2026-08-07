(()=>{
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const FINAL_TRIAL_ID='XJW-TRIAL-001';
  const FINAL_ASSET_ID='guilu-drink-trial-final-20260808';
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const response=await PREV_FETCH(input,init);
    if(!url.includes(TARGET)||!response.ok)return response;
    try{
      const data=await response.clone().json();
      const posts=(data.posts||[]).map(p=>p.id===FINAL_TRIAL_ID?{
        ...p,
        status:'published',
        image_asset_id:FINAL_ASSET_ID,
        image_status:'approved-published-final-locked',
        owner_review_required:false,
        approval_required:false,
        publish_allowed:false,
        schedule_enabled:false,
        scheduled_at:null,
        prevent_republish:true,
        do_not_republish:true,
        do_not_regenerate:true,
        published_confirmed_on:'2026-08-08',
        published_exact_time_known:false,
        published_platforms_known:false,
        final_asset_manifest:'content/final-published-assets-v20260808.json',
        image_review_reason:'使用者已確認此試喝圖為最終版且已發布；鎖定、不重生成、不重發。'
      }:p);
      const merged={...data,version:'2026-08-08-public-posts-v10-final-trial-locked',posts};
      merged.counts={...(data.counts||{}),total:posts.length,published_locked:posts.filter(p=>p.status==='published'||p.prevent_republish===true).length,pending_review:posts.filter(p=>p.status==='pending_review').length,needs_generation:posts.filter(p=>p.image_status==='needs_generation'||(!p.image_url&&p.status!=='published')).length};
      const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');
      return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});
    }catch{return response}
  };
})();
