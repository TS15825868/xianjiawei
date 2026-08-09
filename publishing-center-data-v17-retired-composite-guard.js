(()=>{
  'use strict';
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const VERSION='2026-08-09-v17-retired-home-brand-composite-guard';
  const LEGACY='images/brand/approved-v405/home-brand.webp';
  function fix(post){
    if(!post||post.status==='published'||post.status==='archived')return post;
    const image=String(post.image_url||'');
    if(post.id!=='XJW-CHARACTER-006'&&!image.includes(LEGACY))return post;
    return{
      ...post,
      status:'pending_review',
      image_url:null,
      image_asset_id:null,
      image_status:'needs_generation',
      candidate_generated:false,
      candidate_generation_mode:'chatgpt-boss-daily-v17-retired-composite-required',
      publish_allowed:false,
      schedule_enabled:false,
      scheduled_at:null,
      owner_review_required:true,
      approval_required:true,
      image_prompt:'依原貼文「招手歡迎」主題重新生成1:1完整單一場景。使用仙加味官網同款Q版小老闆：圓臉、大而圓深棕眼、短黑髮、米白中式上衣、深橄欖綠圍裙、胸前紅色直式仙加味印章；完整頭手腳、不裁切，四周保留安全空間。此篇不放產品本體；不得沿用舊home-brand多產品情境合成圖，不得拼貼。完成後只作待審核候選。',
      image_review_reason:'舊home-brand.webp已退出官網正式品牌主視覺，因含多產品情境合成，不再視為可安全重用的小老闆單一場景；此篇改回ChatGPT重生成。'
    };
  }
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const response=await PREV_FETCH(input,init);
    if(!url.includes(TARGET)||!response.ok)return response;
    try{
      const data=await response.clone().json();
      const posts=(data.posts||[]).map(fix);
      const merged={...data,version:'2026-08-09-public-posts-v33-v17-retired-composite-guard',posts};
      merged.counts={...(data.counts||{}),needs_generation:posts.filter(p=>p.image_status==='needs_generation'||(!p.image_url&&p.status!=='published')).length,retired_home_brand_candidates:posts.filter(p=>p.candidate_generation_mode==='chatgpt-boss-daily-v17-retired-composite-required').length};
      return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-xianjiawei-post-bank-guard':VERSION}});
    }catch{return response;}
  };
  window.XJWPostBankV17=Object.freeze({version:VERSION,legacy:LEGACY});
})();
