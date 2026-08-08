(()=>{
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const VERSION='2026-08-09-v15-b2-exact-companion-prompts';
  const B2_DIRECTION=Object.freeze({
    'XJW-CHARACTER-001':'公園草地邊的小步道，小老闆放慢腳步散步，小鹿在旁邊保持獨立位置一起前進；兩者不重疊、不牽繩，氣氛安靜自然。',
    'XJW-CHARACTER-004':'書房木桌旁，小老闆整理一本記事本，小烏龜作為獨立Q版角色在桌邊矮凳上安靜陪伴；不可畫成玩具或貼在圍裙上。',
    'XJW-CHARACTER-007':'居家客廳，小老闆坐在地毯邊整理靠枕，灰色小河馬娃娃放在沙發角落作陪伴道具；娃娃材質柔軟、有縫線感，不是活體河馬。',
    'XJW-CHARACTER-010':'居家客廳，小老闆坐在矮桌旁閱讀卡片，米色小鹿安撫巾整齊放在旁邊坐墊上；必須明顯是柔軟布巾＋小鹿頭造型的安撫物。',
    'XJW-CHARACTER-013':'公園樹蔭下，小老闆站著看前方，小鹿在稍後方停下看向小老闆；保持彼此獨立完整，背景不加產品或節慶元素。',
    'XJW-CHARACTER-016':'書房矮櫃前，小老闆把資料夾放回櫃子，小烏龜在地面小坐墊旁陪伴；角色分開、不裁切，畫面有安靜整理感。',
    'XJW-CHARACTER-019':'居家休息角落，小老闆替椅子鋪好小毯子，灰色小河馬娃娃靠在抱枕旁；娃娃只作道具，比例不要大到像真人角色。',
    'XJW-CHARACTER-022':'居家窗邊，小老闆整理一個小收納籃，米色小鹿安撫巾從籃緣自然露出；安撫巾保持布料形態，不畫成獨立鹿角色。',
    'XJW-CHARACTER-025':'公園長椅旁，小老闆站著伸展一下肩膀，小鹿在長椅另一側安靜站立；兩者完整分離，畫面留足邊界安全空間。',
    'XJW-CHARACTER-028':'書房地毯旁，小老闆把散落的筆收進筆筒，小烏龜在矮桌另一側抬頭陪伴；不要放產品，不做卡通貼紙式合成。',
    'XJW-CHARACTER-031':'居家沙發旁，小老闆把灰色小河馬娃娃輕放到靠枕中間，再整理一旁小毯子；娃娃保持玩偶尺寸與布偶質感。',
    'XJW-CHARACTER-034':'居家閱讀角，小老闆坐在地毯上整理書本，米色小鹿安撫巾平放在旁邊小墊子；色調柔和、明確是布巾道具。',
    'XJW-CHARACTER-037':'公園小徑入口，小老闆微笑向旁邊的小鹿示意一起往前走，小鹿保持獨立完整Q版造型；不牽手、不疊在角色身上。',
    'XJW-CHARACTER-040':'書房窗邊，小老闆整理桌上的小卡片，小烏龜在窗下低矮平台上陪伴；兩個角色視線可以互相呼應，但身體分開完整。',
    'XJW-CHARACTER-043':'居家休息場景，小老闆坐在小凳子上喝溫水，灰色小河馬娃娃放在旁邊沙發上；杯中無冰，娃娃不是活體角色。',
    'XJW-CHARACTER-046':'居家收納場景，小老闆把米色小鹿安撫巾折好放入開放式小籃，保留小鹿頭造型可辨識；角色全身完整，不放產品。'
  });
  function eligible(p){return p&&p.status!=='published'&&!p.campaign_hold&&p.category==='陪伴角色'&&(p.image_status==='needs_generation'||!p.image_url||String(p.candidate_generation_mode||'').includes('companion-vector-v15-review')||String(p.candidate_generation_mode||'').includes('chatgpt-companion-v15-required'))}
  function kind(p){const t=`${p.title||''} ${p.characters||''} ${p.copy||''}`;if(/小烏龜/.test(t))return'小烏龜';if(/河馬/.test(t))return'灰色小河馬娃娃';if(/安撫巾/.test(t))return'米色小鹿安撫巾';return'小鹿'}
  function fix(p){
    if(!eligible(p))return p;
    const companion=kind(p);
    const context=[p.season,p.weather,p.occasion,p.location].filter(Boolean).join('／')||'依文案判斷';
    const exact=B2_DIRECTION[p.id]||'依原文案重新建立完整陪伴生活場景，不沿用舊向量或裁切角色。';
    const prompt=`依貼文文案重生成一張1:1仙加味陪伴角色候選圖。情境：${context}。精準製圖方向：${exact} 小老闆使用官網 approved-v405 同款柔和立體Q版，頭、頭髮、雙手、雙腳與持物完整，四周至少保留約8%安全空間，不得裁切LINE OA專用圖。指定陪伴角色：${companion}。若是小鹿或小烏龜，必須是與小老闆分開的獨立Q版角色；灰色小河馬必須明確是娃娃，不得畫成活體角色；米色小鹿安撫巾必須保持布巾＋小鹿頭造型，不得畫成活鹿。不得用簡單向量替代核准造型。文案未指定季節／天氣時保持中性；季節、環境、冷熱、表情、動作與文案一致。這批原則不放任何產品。`;
    return{
      ...p,
      status:'pending_review',
      image_url:null,
      image_asset_id:null,
      image_status:'needs_generation',
      candidate_generated:false,
      candidate_generation_mode:'chatgpt-companion-v15-b2-exact-required',
      publish_allowed:false,
      schedule_enabled:false,
      scheduled_at:null,
      owner_review_required:true,
      approval_required:true,
      image_prompt:prompt,
      image_generation_manifest:'content/character-b2-prompt-manifest-v20260809.json',
      image_review_reason:`舊v15使用LINE OA裁切角色並以簡單SVG重畫${companion}；此篇已加入B2逐篇精準場景，維持重新生成後回待審核。`
    };
  }
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');const response=await PREV_FETCH(input,init);if(!url.includes(TARGET)||!response.ok)return response;
    try{const data=await response.clone().json();const posts=(data.posts||[]).map(fix);const merged={...data,version:'2026-08-09-public-posts-v33-v15-b2-exact-prompts',posts};merged.counts={...(data.counts||{}),v15_needs_generation:posts.filter(p=>p.candidate_generation_mode==='chatgpt-companion-v15-b2-exact-required').length,needs_generation:posts.filter(p=>p.image_status==='needs_generation'||(!p.image_url&&p.status!=='published'&&!p.campaign_hold)).length};const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});}catch{return response}
  };
  window.XJWCompanionCandidateFactory={version:VERSION,getSvg:()=>'',has:()=>false,getStats:()=>({generated:0,regenerationRequired:16,exactPromptCount:Object.keys(B2_DIRECTION).length}),b2Directions:B2_DIRECTION};
})();
