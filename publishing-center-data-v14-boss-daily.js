(()=>{
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const VERSION='2026-08-09-v14-five-approved-reuse-27-exact-prompts';
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
  const B1_DIRECTION=Object.freeze({
    'XJW-CHARACTER-002':'小老闆站在米白書桌前，雙手整理紙本筆記與夾板，桌面有筆與簡單資料夾；正面三分之二身轉全身構圖，表情專注溫和，不放產品。',
    'XJW-CHARACTER-003':'小老闆在玄關整理深綠色小提袋並確認鞋子，身體微側準備出門，門邊只放日常物件；全身完整、神情有精神，不放產品。',
    'XJW-CHARACTER-005':'小老闆把書本、便條紙與杯墊排整齊，一手扶資料夾一手整理桌面；室內柔和光線、全身完整，不放產品。',
    'XJW-CHARACTER-009':'小老闆站在簡潔米白品牌牆前單手比讚，另一手自然垂下，微笑看向畫面；全身完整，背景只做低調仙加味印章元素，不放產品。',
    'XJW-CHARACTER-015':'小老闆在工作桌旁整理一個未封口的牛皮紙寄件箱，手持封箱膠帶但尚未黏貼；箱面只可有小型仙加味字樣，不放產品本體。',
    'XJW-CHARACTER-017':'小老闆坐在桌前查看平板上的「產品原圖檢查」介面，畫面只呈現六個中性空白照片框與勾選符號，不畫任何產品外觀；角色全身與平板完整。',
    'XJW-CHARACTER-018':'小老闆在室內玄關把收起的深色長傘放進傘架，地面保持乾燥，不暗示正在下雨；全身完整、動作自然，不放產品。',
    'XJW-CHARACTER-020':'小老闆站在立式小白板旁，把三張簡單事項卡依序貼好，一手拿筆一手指向最上方卡片；白板不寫長文、不放產品。',
    'XJW-CHARACTER-021':'小老闆在室內穿好外出鞋，一手提簡單帆布袋、一手確認門邊鑰匙盤；略帶側面視角，全身完整，不放產品。',
    'XJW-CHARACTER-023':'小老闆把桌上的筆筒、記事本與小托盤分類歸位，桌面由左至右逐漸整齊；自然生活感、全身完整，不放產品。',
    'XJW-CHARACTER-024':'小老闆站在簡潔入口拱門旁向前招手，另一手自然放在圍裙前，背景有低調圓形窗格與植栽；全身完整，不放產品。',
    'XJW-CHARACTER-026':'小老闆站在米白立式看板旁，一手指向看板上的三個簡單圓點與「今天怎麼選」短標，另一手自然垂下；全身完整，不畫產品。',
    'XJW-CHARACTER-027':'小老闆在木質工作桌旁側身比讚，桌上只有整齊筆記與溫水杯，表情開朗但不誇張；全身完整，不放產品。',
    'XJW-CHARACTER-029':'小老闆雙手端著透明溫水杯站在餐桌旁，杯中無冰塊、無吸管、無冷飲元素；蒸氣極淡即可，全身完整，不放產品。',
    'XJW-CHARACTER-030':'小老闆站在家用料理台前查看有蓋燉鍋，一手拿木勺靠近鍋邊但不誇張攪動；暖色家常廚房、全身完整，不放產品。',
    'XJW-CHARACTER-032':'小老闆站在小桌旁，一手輕托下巴、一手拿便條紙，旁邊浮一個簡單問號圖形；表情思考但親切，全身完整，不放產品。',
    'XJW-CHARACTER-033':'小老闆蹲在較低工作台旁，把一張空白寄件單放到牛皮紙箱上並整理麻繩；不顯示地址電話，不放產品。',
    'XJW-CHARACTER-035':'小老闆站在電腦螢幕旁檢查「正式原圖」資料夾，螢幕只顯示六個空白縮圖卡與檔名占位符，不生成任何產品外觀；全身完整。',
    'XJW-CHARACTER-036':'小老闆把折疊傘收進玄關小籃子並順手整理掛鉤，室內乾爽、中性天氣，不放雨滴特效；全身完整。',
    'XJW-CHARACTER-038':'小老闆站在矮櫃前，把今日待辦卡依序放入三格文件架，視線看向手上的最後一張卡；背景簡潔、全身完整，不放產品。',
    'XJW-CHARACTER-039':'小老闆在玄關鏡前確認圍裙與隨身小袋，腳邊鞋子已穿好，身體微向門口；全身完整、不放產品、不加入特定天氣。',
    'XJW-CHARACTER-041':'小老闆從桌面拿起最後一本記事本放進書架，桌面只留下杯墊與筆筒，呈現整理完成的乾淨感；全身完整，不放產品。',
    'XJW-CHARACTER-042':'小老闆站在室內圓形窗格與米白展示牆前抬手招呼，畫面較寬、保留更多安全空間；背景僅仙加味小印章與植栽，不放產品。',
    'XJW-CHARACTER-044':'小老闆站在深藍邊框小看板旁，指向三個簡單步驟圖示「看需求／看使用／再詢問」，文字短而清楚；全身完整，不畫產品。',
    'XJW-CHARACTER-045':'小老闆在米白與深藍幾何背景前雙腳自然站立，一手比讚、一手扶圍裙，表情自然微笑；全身完整，不放產品。',
    'XJW-CHARACTER-047':'小老闆從飲水區端著一杯溫水走向桌邊，杯中無冰、背景有簡單熱水壺但不顯示品牌；完整全身動作，不放產品。',
    'XJW-CHARACTER-048':'小老闆站在餐桌旁查看剛放上隔熱墊的有蓋燉鍋，一手扶鍋蓋把手、一手自然放在桌邊；家常暖食情境、全身完整，不放產品。'
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
    const exact=B1_DIRECTION[p.id]||'依原文案的動作與生活情境重新構圖，不沿用舊裁切圖。';
    const prompt=`依貼文文案重生成一張完整1:1「仙加味小老闆日常」候選圖。情境：${context}。精準製圖方向：${exact} 小老闆使用官網 approved-v405 同款柔和立體Q版：圓臉、大而圓的深棕眼睛、短黑髮、米白中式上衣、深橄欖綠圍裙、胸前紅色直式仙加味印章。姿勢依文案自然變化；頭、頭髮、雙手、雙腳與持物必須完整，四周至少保留約8%安全空間。不得直接裁切LINE OA專用圖，不得用cover/slice/clipPath做角色聚焦。文案未指定季節／天氣時保持中性，不自行加入雨雪、烈日、節慶或即時天氣。季節、環境、冷熱、表情與動作必須匹配文案。原則不放產品；若畫面需要表達查看產品原圖，只顯示中性照片檢查介面或空白縮圖框，不AI重畫產品。`;
    return{
      ...p,
      status:'pending_review',
      image_url:null,
      image_asset_id:null,
      image_status:'needs_generation',
      candidate_generated:false,
      candidate_generation_mode:'chatgpt-boss-daily-v14-b1-exact-required',
      publish_allowed:false,
      schedule_enabled:false,
      scheduled_at:null,
      owner_review_required:true,
      approval_required:true,
      image_prompt:prompt,
      image_generation_manifest:'content/character-b1-prompt-manifest-v20260809.json',
      image_review_reason:'舊v14使用LINE OA角色圖並以slice／clipPath裁切；此篇沒有精準可重用的官網核准場景，已加入B1逐篇製圖方向，維持依文案重新生成。'
    };
  }
  function fix(p){
    if(!eligible(p))return p;
    if(SAFE_EXISTING[p.id])return approvedReuse(p,SAFE_EXISTING[p.id]);
    return regeneration(p);
  }
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');const response=await PREV_FETCH(input,init);if(!url.includes(TARGET)||!response.ok)return response;
    try{const data=await response.clone().json();const posts=(data.posts||[]).map(fix);const merged={...data,version:'2026-08-09-public-posts-v32-v14-b1-exact-prompts',posts};merged.counts={...(data.counts||{}),v14_needs_generation:posts.filter(p=>p.candidate_generation_mode==='chatgpt-boss-daily-v14-b1-exact-required').length,v14_approved_existing_candidates:posts.filter(p=>p.candidate_generation_mode==='approved-v405-semantic-reuse-v14').length,needs_generation:posts.filter(p=>p.image_status==='needs_generation'||(!p.image_url&&p.status!=='published'&&!p.campaign_hold)).length};const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});}catch{return response}
  };
  window.XJWBossCandidateFactory={version:VERSION,getSvg:()=>'',has:(id)=>!!SAFE_EXISTING[id],getStats:()=>({approvedExistingCandidate:5,regenerationRequired:27,exactPromptCount:Object.keys(B1_DIRECTION).length}),safeExisting:SAFE_EXISTING,b1Directions:B1_DIRECTION};
})();
