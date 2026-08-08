(()=>{
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const ALLOWED=new Set(['節慶','地點','萬華在地']);
  const VERSION='2026-08-09-v13-chatgpt-full-character-required';
  function eligible(p){return p&&p.status!=='published'&&!p.campaign_hold&&ALLOWED.has(String(p.category||''))&&(p.image_status==='needs_generation'||!p.image_url||String(p.candidate_generation_mode||'').includes('website-mascot-scene-v13'))}
  function fix(p){
    if(!eligible(p))return p;
    const context=[p.season,p.weather,p.occasion,p.location].filter(Boolean).join('／')||'依文案判斷';
    const prompt=`依貼文文案重生成完整1:1情境圖。分類：${p.category||''}；情境資料：${context}。小老闆必須使用官網 approved-v405 同款柔和立體Q版外觀，頭、頭髮、雙手、雙腳與持物完整，四周保留安全空間，不得裁切，不得使用LINE OA專用圖直接裁切拼貼。季節、地點、天氣、表情、動作與文案一致。除非文案明確需要產品，否則不放產品；若需產品，只合成products-v3正式原圖並遵守實際尺寸比例。`;
    return{
      ...p,
      status:'pending_review',
      image_url:null,
      image_asset_id:null,
      image_status:'needs_generation',
      candidate_generated:false,
      candidate_generation_mode:'chatgpt-character-scene-v13-required',
      publish_allowed:false,
      schedule_enabled:false,
      scheduled_at:null,
      owner_review_required:true,
      approval_required:true,
      image_prompt:prompt,
      image_review_reason:'舊v13使用LINE OA角色圖並以slice／clipPath裁切，違反小老闆完整顯示與官網／LINE素材分流規則；已退回依文案重新生成。'
    };
  }
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');const response=await PREV_FETCH(input,init);if(!url.includes(TARGET)||!response.ok)return response;
    try{const data=await response.clone().json();const posts=(data.posts||[]).map(fix);const merged={...data,version:'2026-08-09-public-posts-v28-v13-regeneration-required',posts};merged.counts={...(data.counts||{}),v13_needs_generation:posts.filter(p=>p.candidate_generation_mode==='chatgpt-character-scene-v13-required').length,needs_generation:posts.filter(p=>p.image_status==='needs_generation'||(!p.image_url&&p.status!=='published'&&!p.campaign_hold)).length};const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers})}catch{return response}
  };
  window.XJWCharacterCandidateFactory={version:VERSION,getSvg:()=>'',has:()=>false,getStats:()=>({generated:0,regenerationRequired:true})};
})();