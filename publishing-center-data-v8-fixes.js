(()=>{
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const REGEN_IDS=new Set(['POST-PRODUCT-OVERVIEW','POST-GAO-100','POST-DRINK-30','POST-DRINK-180','POST-JIAO-600','POST-COMBO']);
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const response=await PREV_FETCH(input,init);
    if(!url.includes(TARGET)||!response.ok)return response;
    try{
      const data=await response.clone().json();
      const posts=(data.posts||[]).map(p=>REGEN_IDS.has(p.id)?{...p,image_status:'needs_generation',image_review_reason:'依2026-08-07最新產品實拍與比例規格重新生成後再審核'}:p);
      const merged={...data,version:'2026-08-07-public-posts-v8-500-guarded',posts};
      merged.counts={...(data.counts||{}),total:posts.length,needs_generation:posts.filter(p=>p.image_status==='needs_generation'||!p.image_url).length};
      const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');
      return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});
    }catch{return response}
  };
})();
