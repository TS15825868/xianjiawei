(()=>{
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const HOLD_IDS=new Set(Array.from({length:11},(_,i)=>`XJW-TRIAL-${String(i+2).padStart(3,'0')}`));
  const HOLD_UNTIL='2026-11-06';
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const response=await PREV_FETCH(input,init);
    if(!url.includes(TARGET)||!response.ok)return response;
    try{
      const data=await response.clone().json();
      const posts=(data.posts||[]).map(p=>HOLD_IDS.has(p.id)?{
        ...p,
        status:'pending_review',
        image_status:'campaign_hold',
        campaign_hold:true,
        campaign_hold_until:HOLD_UNTIL,
        publish_allowed:false,
        schedule_enabled:false,
        scheduled_at:null,
        owner_review_required:true,
        approval_required:true,
        image_review_reason:'試喝最終主圖已於2026-08-08確認發布。為避免短期重複，這篇試喝變體暫緩至2026-11-06，屆時仍需重新審核後才可生圖或發布。'
      }:p);
      const merged={...data,version:'2026-08-08-public-posts-v11-campaign-holds',posts};
      merged.counts={...(data.counts||{}),total:posts.length,campaign_hold:posts.filter(p=>p.campaign_hold).length,pending_review:posts.filter(p=>p.status==='pending_review'&&!p.campaign_hold).length,needs_generation:posts.filter(p=>p.image_status==='needs_generation'||(!p.image_url&&p.status!=='published'&&!p.campaign_hold)).length};
      const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');
      return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});
    }catch{return response}
  };
})();
