(()=>{
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const VERSION='2026-08-09-v14-five-approved-reuse-27-regeneration';
  const SAFE_EXISTING=Object.freeze({
    'XJW-CHARACTER-006':'images/brand/approved-v405/home-brand.webp',
    'XJW-CHARACTER-008':'images/brand/approved-v405/choose.webp',
    'XJW-CHARACTER-011':'images/brand/approved-v405/guide-how-to-use.webp',
    'XJW-CHARACTER-012':'images/brand/approved-v405/recipes.webp',
    'XJW-CHARACTER-014':'images/brand/approved-v405/faq.webp'
  });
  const SAFE_ACTIONS=Object.freeze({
    'XJW-CHARACTER-006':'招手歡迎',
    'XJW-CHARACTER-008':'指向看板',
    'XJW-CHARACTER-011':'端溫水',
    'XJW-CHARACTER-012':'看鍋燉煮',
    'XJW-CHARACTER-014':'思考問題'
  });
  function eligible(p){return p&&p.status!=='published'&&!p.campaign_hold&&p.category==='小老闆與夥伴'&&(p.image_status==='needs_generation'||!p.image_url||String(p.candidate_generation_mode||'').includes('website-boss-daily-v14')||String(p.candidate_generation_mode||'').includes('chatgpt-boss-daily-v14-required'))}
  function approvedReuse(p,path){
    return{
      ...p,
      status:'pending_review',
      image_url:path,
      image_asset_id:`approved-v405-semantic-${p.id}`,
      image_status:'candidate-review-required',
      candidate_generated:true,
      candidate_generation_mode:'approved-v405-semantic-reuse-v14',
      publish_allowed:false,
      schedule_enabled:false,
      scheduled_at:null,
      owner_review_required:true,
      approval_required:true,
      image_policy:'website-approved-v405-full-frame-semantic-reuse',
      image_review_reason:`現有官網專用核准小老闆圖與此篇動作「${SAFE_ACTIONS[p.id]}」精準對應；使用完整原圖、不裁切、不混用LINE OA素材。此圖只轉待審核，仍需16項人工確認並檢查近期主圖重複。`
    };
  }
  function regeneration(p){
    const context=[p.season,p.weather,p.occasion,p.location].filter(Boolean).join('／')||'依文案判斷';
    const prompt=`依貼文文案重生成一張完整1:1「仙加味小老闆日常」候選圖。情境：${context}。小老闆使用官網 approved-v405 同款柔和立體Q版：圓臉、大而圓的深棕眼睛、短黑髮、米白中式上衣、深橄欖綠圍裙、胸前紅色直式仙加味印章。姿勢依文案自然變化；頭、頭髮、雙手、雙腳與持物必須完整，四周至少保留約8%安全空間。不得直接裁切LINE OA專用圖，不得用cover/slice/clipPath做角色聚焦。季節、環境、冷熱、表情與動作必須匹配文案。沒有必要就不要放產品；需要產品時只合成products-v3正式原圖並遵守實際尺寸比例。`;
    return{
      ...p,
      status:'pending_review',
      image_url:null,
      image_asset_id:null,
      image_status:'needs_generation',
      candidate_generated:false,
      candidate_generation_mode:'chatgpt-boss-daily-v14-required',
      publish_allowed:false,
      schedule_enabled:false,
      scheduled_at:null,
      owner_review_required:true,
      approval_required:true,
      image_prompt:prompt,
      image_review_reason:'舊v14使用LINE OA角色圖並以slice／clipPath裁切，違反官網角色完整顯示與素材分流規則；此篇沒有精準可重用的官網核准場景，維持依文案重新生成。'
    };
  }
  function fix(p){
    if(!eligible(p))return p;
    if(SAFE_EXISTING[p.id])return approvedReuse(p,SAFE_EXISTING[p.id]);
    return regeneration(p);
  }
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');const response=await PREV_FETCH(input,init);if(!url.includes(TARGET)||!response.ok)return response;
    try{const data=await response.clone().json();const posts=(data.posts||[]).map(fix);const merged={...data,version:'2026-08-09-public-posts-v31-v14-five-approved-reuse',posts};merged.counts={...(data.counts||{}),v14_needs_generation:posts.filter(p=>p.candidate_generation_mode==='chatgpt-boss-daily-v14-required').length,v14_approved_existing_candidates:posts.filter(p=>p.candidate_generation_mode==='approved-v405-semantic-reuse-v14').length,needs_generation:posts.filter(p=>p.image_status==='needs_generation'||(!p.image_url&&p.status!=='published'&&!p.campaign_hold)).length};const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers})}catch{return response}
  };
  window.XJWBossCandidateFactory={version:VERSION,getSvg:()=>'',has:(id)=>!!SAFE_EXISTING[id],getStats:()=>({approvedExistingCandidate:5,regenerationRequired:27}),safeExisting:SAFE_EXISTING};
})();