(()=>{
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const VERSION='2026-08-09-v15-chatgpt-companion-required';
  function eligible(p){return p&&p.status!=='published'&&!p.campaign_hold&&p.category==='陪伴角色'&&(p.image_status==='needs_generation'||!p.image_url||String(p.candidate_generation_mode||'').includes('companion-vector-v15-review'))}
  function kind(p){const t=`${p.title||''} ${p.characters||''} ${p.copy||''}`;if(/小烏龜/.test(t))return'小烏龜';if(/河馬/.test(t))return'灰色小河馬娃娃';if(/安撫巾/.test(t))return'米色小鹿安撫巾';return'小鹿'}
  function fix(p){
    if(!eligible(p))return p;
    const companion=kind(p);
    const context=[p.season,p.weather,p.occasion,p.location].filter(Boolean).join('／')||'依文案判斷';
    const prompt=`依貼文文案重生成一張1:1仙加味陪伴角色候選圖。情境：${context}。小老闆使用官網 approved-v405 同款柔和立體Q版，頭、頭髮、雙手、雙腳與持物完整，四周保留安全空間，不得裁切LINE OA專用圖。指定陪伴角色：${companion}。若是小鹿或小烏龜，必須是與小老闆分開的獨立Q版角色；灰色小河馬娃娃與米色小鹿安撫巾只作適合的居家陪伴道具。不得用簡單向量替代核准造型。季節、環境、冷熱、表情、動作與文案一致。這類貼文原則上不放產品；若文案真的需要產品，只合成products-v3正式原圖並遵守實際尺寸比例。`;
    return{
      ...p,
      status:'pending_review',
      image_url:null,
      image_asset_id:null,
      image_status:'needs_generation',
      candidate_generated:false,
      candidate_generation_mode:'chatgpt-companion-v15-required',
      publish_allowed:false,
      schedule_enabled:false,
      scheduled_at:null,
      owner_review_required:true,
      approval_required:true,
      image_prompt:prompt,
      image_review_reason:`舊v15使用LINE OA裁切角色並以簡單SVG重畫${companion}，畫風與正式角色未驗證；已退回依文案重新生成。`
    };
  }
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');const response=await PREV_FETCH(input,init);if(!url.includes(TARGET)||!response.ok)return response;
    try{const data=await response.clone().json();const posts=(data.posts||[]).map(fix);const merged={...data,version:'2026-08-09-public-posts-v30-v15-regeneration-required',posts};merged.counts={...(data.counts||{}),v15_needs_generation:posts.filter(p=>p.candidate_generation_mode==='chatgpt-companion-v15-required').length,needs_generation:posts.filter(p=>p.image_status==='needs_generation'||(!p.image_url&&p.status!=='published'&&!p.campaign_hold)).length};const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers})}catch{return response}
  };
  window.XJWCompanionCandidateFactory={version:VERSION,getSvg:()=>'',has:()=>false,getStats:()=>({generated:0,regenerationRequired:true})};
})();