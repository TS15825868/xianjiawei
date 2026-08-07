(()=>{
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const PLATFORM=['Facebook','Instagram'];
  const MASCOT='官網版Q版小老闆：米白中式上衣、深綠圍裙、紅色直式「仙加味」印章；小老闆出現時小鹿與小烏龜必須一起出現。';
  const PRODUCT_RULE='產品若出現，只能使用仙加味正式原產品照片等比例合成；AI只生成背景、角色、道具與情境。30cc必須裸罐無貼紙無外包裝；180cc鋁袋狹長；龜鹿膏只用新版米白標籤；龜鹿膠紫盒不可拉長。';
  const pending=(p)=>({platforms:PLATFORM,status:'pending_review',owner_review_required:true,approval_required:true,publish_allowed:false,schedule_enabled:false,scheduled_at:null,image_url:'',image_status:'needs_generation',season:'中性',weather:'中性',temperature:'常溫',requires_live_weather:false,...p});
  const extra=[];
  const add=(p)=>extra.push(pending(p));

  const FESTIVALS=[
    ['春節','團聚與送禮情境'],['元宵','節慶日常'],['清明','返鄉與家人'],['母親節','陪伴與感謝'],
    ['端午','家人聚餐'],['父親節','家庭陪伴'],['七夕','日常心意'],['中秋','家庭聚餐'],
    ['重陽','陪伴長輩'],['冬至','暖湯與家人'],['聖誕','年末心意'],['跨年','年度整理']
  ];
  for(let i=0;i<24;i++){
    const f=FESTIVALS[i%FESTIVALS.length],variant=Math.floor(i/FESTIVALS.length)+1;
    add({id:`XJW-FESTIVAL-${String(i+1).padStart(3,'0')}`,title:`${f[0]}｜${f[1]} ${variant}`,copy:`${f[0]}不一定要安排得很複雜，把時間留給重要的人，也替自己的日常留一點空間。\n\n仙加味以日常飲食與生活節奏陪伴每個節氣與節慶；實際活動日期與內容發布前再確認。\n\n仙加味\n補養，是一種節奏。`,category:'節慶',occasion:f[0],image_asset_id:`gen-festival-${String(i+1).padStart(3,'0')}`,image_prompt:`${f[0]}的台灣家庭生活情境，${f[1]}；${MASCOT} 畫面溫暖自然，不做醫療宣稱；${PRODUCT_RULE}`,characters:'官網版Q版小老闆＋小鹿＋小烏龜',special_content:true});
  }

  const LOCATIONS=['居家客廳','居家廚房','餐桌','書房','辦公室','車上休息','公園','河濱','萬華街景','仙加味品牌展示空間','傳統市場','家庭餐廳'];
  for(let i=0;i<24;i++){
    const l=LOCATIONS[i%LOCATIONS.length],v=Math.floor(i/LOCATIONS.length)+1;
    add({id:`XJW-LOCATION-${String(i+1).padStart(3,'0')}`,title:`${l}｜把節奏留在日常 ${v}`,copy:`不同地點有不同的生活速度。到了${l}，不妨把手邊的事情排得剛剛好，留一點時間喝水、吃飯、休息。\n\n仙加味\n補養，是一種節奏。`,category:'地點',location:l,occasion:'日常',image_asset_id:`gen-location-${String(i+1).padStart(3,'0')}`,image_prompt:`明確呈現${l}，自然生活感；${MASCOT} 動作需符合場景；不必強制出現產品，若出現則${PRODUCT_RULE}`,characters:'官網版Q版小老闆＋小鹿＋小烏龜'});
  }

  const WANHUA=[['西昌街日常','老街步調'],['傳統市場','採買日常'],['街區散步','萬華巷弄'],['品牌從萬華開始','四代故事'],['店面外觀','來店走走'],['萬華人情','熟悉的街坊']];
  for(let i=0;i<24;i++){
    const w=WANHUA[i%WANHUA.length],v=Math.floor(i/WANHUA.length)+1;
    add({id:`XJW-WANHUA-${String(i+1).padStart(3,'0')}`,title:`萬華｜${w[0]} ${v}`,copy:`仙加味從萬華的日常一路走到今天。${w[1]}不只是背景，也是品牌生活感的一部分。\n\n我們把產品資料與使用方式整理得更清楚，希望讓每一次認識都簡單一點。\n\n仙加味\n補養，是一種節奏。`,category:'萬華在地',location:'萬華街景',image_asset_id:`gen-wanhua-${String(i+1).padStart(3,'0')}`,image_prompt:`萬華在地生活場景，主題「${w[0]}」；不要誤用其他城市地標；${MASCOT} 品牌只顯示仙加味，不主動顯示公司資料。`,characters:'官網版Q版小老闆＋小鹿＋小烏龜'});
  }

  const CHARACTERS=[
    ['小老闆','整理今天的產品資訊','仙加味官網版Q版小老闆＋小鹿＋小烏龜'],
    ['小鹿','陪小老闆準備出門','官網版Q版小老闆＋小鹿＋小烏龜'],
    ['小烏龜','陪小老闆慢慢整理桌面','官網版Q版小老闆＋小鹿＋小烏龜'],
    ['河馬娃娃','居家休息陪伴','官網版Q版小老闆＋小鹿＋小烏龜＋灰色小河馬娃娃'],
    ['小鹿安撫巾','親子與居家陪伴','官網版Q版小老闆＋小鹿＋小烏龜＋米色小鹿安撫巾'],
    ['三位夥伴','一起準備家庭晚餐','官網版Q版小老闆＋小鹿＋小烏龜']
  ];
  for(let i=0;i<48;i++){
    const c=CHARACTERS[i%CHARACTERS.length],v=Math.floor(i/CHARACTERS.length)+1;
    add({id:`XJW-CHARACTER-${String(i+1).padStart(3,'0')}`,title:`${c[0]}日常｜${c[1]} ${v}`,copy:`今天讓${c[0]}陪小老闆一起${c[1]}。日常不一定要很滿，做一件做得到的小事，就能把節奏慢慢找回來。\n\n仙加味\n補養，是一種節奏。`,category:c[0]==='河馬娃娃'||c[0]==='小鹿安撫巾'?'陪伴角色':'小老闆與夥伴',occasion:c[1],location:c[0]==='河馬娃娃'||c[0]==='小鹿安撫巾'?'居家客廳':'日常生活場景',image_asset_id:`gen-character-${String(i+1).padStart(3,'0')}`,image_prompt:`角色主題「${c[0]}」；${MASCOT} ${c[0]==='河馬娃娃'?'灰色小河馬娃娃只作居家休息陪伴，不喧賓奪主。':''}${c[0]==='小鹿安撫巾'?'米色小鹿安撫巾只作親子／居家陪伴道具。':''}`,characters:c[2]});
  }

  const EDU=[
    ['產品規格怎麼看','先看容量、重量、塊數與包裝形式，再看自己的使用情境。'],
    ['圖片為什麼要照原圖','產品圖維持正式包裝與比例，才不會讓消費者看到與實品不同的外觀。'],
    ['30cc為什麼沒有貼紙','30cc是小玻璃裸罐，正式呈現不加貼紙、外盒或外袋。'],
    ['180cc鋁袋怎麼辨識','180cc是狹長直立鋁袋，圖片不可拉寬或放大成不自然比例。'],
    ['龜鹿膏新版標籤','100g六角罐目前只使用新版米白標籤，舊紅白直式貼紙不再使用。'],
    ['龜鹿膠盒型','600g淡紫盒只做等比例縮放，不把盒身拉得過長。'],
    ['為什麼新圖要審核','新圖需確認產品、情境、角色與文字全部正確後才進入排程。'],
    ['天氣貼文怎麼發','即時天氣、颱風、寒冷與空氣品質內容要在發布前再次確認。']
  ];
  for(let i=0;i<24;i++){
    const e=EDU[i%EDU.length],v=Math.floor(i/EDU.length)+1;
    add({id:`XJW-EDU-${String(i+1).padStart(3,'0')}`,title:`常見問題｜${e[0]} ${v}`,copy:`${e[1]}\n\n仙加味把資訊說清楚，讓選擇更簡單。`,category:'FAQ',occasion:'資訊教育',location:'仙加味品牌展示空間',image_asset_id:`gen-edu-${String(i+1).padStart(3,'0')}`,image_prompt:`乾淨繁體中文FAQ圖卡，主題「${e[0]}」；短文字、大留白；${MASCOT} ${PRODUCT_RULE}`,characters:'官網版Q版小老闆＋小鹿＋小烏龜'});
  }

  const PARTNER=['產品規格圖','產品情境圖','FAQ圖卡','四季素材','料理素材','品牌故事素材','節慶素材','店內展示素材'];
  for(let i=0;i<24;i++){
    const p=PARTNER[i%PARTNER.length],v=Math.floor(i/PARTNER.length)+1;
    add({id:`XJW-PARTNER-${String(i+1).padStart(3,'0')}`,title:`合作夥伴素材｜${p} ${v}`,copy:`這份${p}提供合作店家與診所作為產品介紹與日常內容使用。\n\n合作夥伴版本不強迫導流至仙加味官方LINE，可依合作方式加入店家自己的聯絡資訊；產品規格與包裝不得修改。`,platforms:['Facebook','Instagram'],category:'合作夥伴素材',occasion:'合作通路',location:'合作店家',image_asset_id:`gen-partner-${String(i+1).padStart(3,'0')}`,image_prompt:`可供中藥店／蔘藥店／中醫診所使用的乾淨品牌素材；保留仙加味識別但不強迫放官方LINE CTA；${PRODUCT_RULE}`,characters:'視素材需求，可不出現角色',partner_mode:true});
  }

  const STORE=['開店前整理','產品架整理','包裝檢查','回覆LINE詢問','準備寄件','整理素材','下午工作空檔','下班前盤點','週末前準備'];
  for(let i=0;i<9;i++){
    const s=STORE[i];
    add({id:`XJW-STORE-${String(i+1).padStart(3,'0')}`,title:`門市日常｜${s}`,copy:`今天的門市日常是${s}。把每一件小事整理好，產品資訊、素材與回覆也會更清楚。\n\n仙加味\n補養，是一種節奏。`,category:'門市日常',occasion:s,location:'仙加味品牌展示空間',image_asset_id:`gen-store-${String(i+1).padStart(3,'0')}`,image_prompt:`仙加味品牌展示空間，主題「${s}」；${MASCOT} 畫面乾淨自然，不顯示公司名稱、統編、公司電話或公司地址。`,characters:'官網版Q版小老闆＋小鹿＋小烏龜'});
  }

  window.XJW_POST_BANK_V7={version:'2026-08-07-post-bank-v7-plus177',count:extra.length,posts:extra};
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const response=await PREV_FETCH(input,init);
    if(!url.includes(TARGET)||!response.ok)return response;
    try{
      const data=await response.clone().json();
      const ids=new Set((data.posts||[]).map(p=>p.id));
      const append=extra.filter(p=>!ids.has(p.id));
      const merged={...data,version:'2026-08-07-public-posts-v7-500-review-queue',ai_brand_control:'content/ai-brand-control-v20260807.json',brand_guardian:'content/brand-guardian-rules.json',annual_calendar:'content/annual-content-calendar-v2026.json',asset_usage_ledger:'content/asset-usage-ledger.json',content_performance:'content/content-performance-schema.json',partner_mode:'content/partner-mode-policy.json',posts:[...(data.posts||[]),...append]};
      merged.counts={...(data.counts||{}),total:merged.posts.length,published_locked:merged.posts.filter(p=>p.status==='published'||p.prevent_republish===true).length,pending_review:merged.posts.filter(p=>p.status==='pending_review').length,needs_generation:merged.posts.filter(p=>p.image_status==='needs_generation'||!p.image_url).length};
      const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');
      return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});
    }catch{return response;}
  };
})();
