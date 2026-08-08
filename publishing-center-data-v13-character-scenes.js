(()=>{
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const ALLOWED=new Set(['節慶','地點','萬華在地']);
  const VERSION='2026-08-09-v13-b3-context-preserving-prompts';
  const VARIANTS=Object.freeze({
    1:'較近的生活互動畫面；角色仍完整入鏡，背景保留足夠環境線索。',
    2:'中景構圖；角色與主要場景物件並列，畫面左右平衡，不裁切人物。',
    3:'較寬的環境構圖；讓地點或節慶場景更明確，角色仍完整且不縮成過小。',
    4:'動作導向構圖；讓原文案中的主要動作成為視覺焦點，但仍保留完整人物與場景。'
  });
  function eligible(p){return p&&p.status!=='published'&&!p.campaign_hold&&ALLOWED.has(String(p.category||''))&&(p.image_status==='needs_generation'||!p.image_url||String(p.candidate_generation_mode||'').includes('website-mascot-scene-v13')||String(p.candidate_generation_mode||'').includes('chatgpt-character-scene-v13-required'))}
  function postNumber(p){const m=String(p.id||'').match(/-(\d{3})$/);return m?Number(m[1]):1}
  function variant(p){const n=postNumber(p);if(p.category==='節慶'||p.category==='地點')return n>12?2:1;if(p.category==='萬華在地')return Math.floor((n-1)/6)+1;return((n-1)%4)+1}
  function categoryRule(p){
    if(p.category==='節慶')return'保留原貼文節慶名稱與家庭／聚餐／陪伴等原始情境；節慶日期與即時活動發布前另行確認，不自行加入未提及的促銷、價格或產品。';
    if(p.category==='地點')return`地點必須維持「${p.location||'原文案地點'}」，車上休息、辦公室、公園、河濱、餐桌等不得互換。`;
    return'萬華場景不得誤用其他城市地標；保留西昌街、傳統市場、街區散步、品牌故事等原始主題。沒有可驗證的店面實拍依據時，採插畫式萬華生活氛圍，不偽裝成特定真實店面照片。';
  }
  function fix(p){
    if(!eligible(p))return p;
    const context=[p.season,p.weather,p.occasion,p.location].filter(Boolean).join('／')||'依文案判斷';
    const original=String(p.image_prompt||'').trim()||'依原貼文文案建立對應生活場景。';
    const layout=VARIANTS[variant(p)]||VARIANTS[1];
    const prompt=`依貼文文案重生成完整1:1情境候選圖。分類：${p.category||''}；情境資料：${context}。原始圖片需求必須保留：${original} 構圖變化：${layout} ${categoryRule(p)} 小老闆必須使用官網 approved-v405 同款柔和立體Q版外觀，頭、頭髮、雙手、雙腳與持物完整，四周至少保留約8%安全空間，不得裁切，不得使用LINE OA專用圖直接裁切拼貼，不得用cover、slice或clipPath聚焦人物。文案未指定天氣時保持中性，不虛構即時天氣；季節、地點、環境、冷熱、表情、動作都必須與原文案一致。除非原文案明確需要產品，否則不放產品；若真的需要產品，只合成products-v3正式原圖並遵守實際尺寸比例，AI不得重畫產品。`;
    return{
      ...p,
      status:'pending_review',
      image_url:null,
      image_asset_id:null,
      image_status:'needs_generation',
      candidate_generated:false,
      candidate_generation_mode:'chatgpt-character-scene-v13-b3-context-required',
      publish_allowed:false,
      schedule_enabled:false,
      scheduled_at:null,
      owner_review_required:true,
      approval_required:true,
      image_prompt:prompt,
      image_generation_manifest:'content/character-b3-prompt-manifest-v20260809.json',
      image_review_reason:'舊v13使用LINE OA角色圖並以slice／clipPath裁切；此篇已改為保留原image_prompt與分類／地點／節慶情境的B3重生成規格，生成後只回待審核。'
    };
  }
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');const response=await PREV_FETCH(input,init);if(!url.includes(TARGET)||!response.ok)return response;
    try{const data=await response.clone().json();const posts=(data.posts||[]).map(fix);const merged={...data,version:'2026-08-09-public-posts-v34-v13-b3-context-prompts',posts};merged.counts={...(data.counts||{}),v13_needs_generation:posts.filter(p=>p.candidate_generation_mode==='chatgpt-character-scene-v13-b3-context-required').length,needs_generation:posts.filter(p=>p.image_status==='needs_generation'||(!p.image_url&&p.status!=='published'&&!p.campaign_hold)).length};const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});}catch{return response}
  };
  window.XJWCharacterCandidateFactory={version:VERSION,getSvg:()=>'',has:()=>false,getStats:()=>({generated:0,regenerationRequired:72,compositionVariants:4}),variants:VARIANTS};
})();
