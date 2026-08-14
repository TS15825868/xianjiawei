(()=>{
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const VERSION='2026-08-08-post-bank-v12-extension-177';
  const PLATFORM=['Facebook','Instagram'];
  const MASCOT='人物若出現，只使用官網 images/brand/approved-v405/ 同款柔和立體Q版小老闆：圓臉、大眼、短黑髮、米白中式上衣、深綠圍裙、胸前紅色直式「仙加味」印章。姿勢依情境自由變化。小鹿與小烏龜不是每張強制出現；需要夥伴時才加入，且必須是分開的獨立角色、同一Q版質感。';
  const PRODUCT_RULE='產品若出現，只使用六項正式產品原圖等比例合成：龜鹿膏100g、龜鹿飲30cc玻璃罐、龜鹿飲180cc鋁袋、龜鹿湯塊75g深藍盒、龜鹿膠600g淡紫盒、鹿茸粉75g白色塑膠罐。不可重畫、改包裝、改標籤、改容量或拉伸比例。';
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
    add({id:`XJW-FESTIVAL-${String(i+1).padStart(3,'0')}`,title:`${f[0]}｜${f[1]} ${variant}`,copy:`${f[0]}不一定要安排得很複雜，把時間留給重要的人，也替自己的日常留一點空間。\n\n仙加味以日常飲食與生活節奏陪伴每個節氣與節慶；實際活動日期與內容發布前再確認。\n\n仙加味\n補養，是一種節奏。`,category:'節慶',occasion:f[0],image_asset_id:`gen-festival-${String(i+1).padStart(3,'0')}`,image_prompt:`${f[0]}的台灣家庭生活情境，${f[1]}。${MASCOT} 不做醫療宣稱；產品不必強制出現，若出現則遵守：${PRODUCT_RULE}`,characters:'官網版Q版小老闆；夥伴依情境加入',special_content:true});
  }

  const LOCATIONS=['居家客廳','居家廚房','餐桌','書房','辦公室','車上休息','公園','河濱','萬華街景','仙加味品牌展示空間','傳統市場','家庭餐廳'];
  const LOCATION_ACTIONS=['招手','端溫水','整理桌面','準備外出','放下工作休息','陪家人用餐','看街景','整理食材'];
  for(let i=0;i<24;i++){
    const l=LOCATIONS[i%LOCATIONS.length],v=Math.floor(i/LOCATIONS.length)+1,a=LOCATION_ACTIONS[i%LOCATION_ACTIONS.length];
    add({id:`XJW-LOCATION-${String(i+1).padStart(3,'0')}`,title:`${l}｜把節奏留在日常 ${v}`,copy:`不同地點有不同的生活速度。到了${l}，不妨把手邊的事情排得剛剛好，留一點時間喝水、吃飯、休息。\n\n仙加味\n補養，是一種節奏。`,category:'地點',location:l,occasion:'日常',image_asset_id:`gen-location-${String(i+1).padStart(3,'0')}`,image_prompt:`明確呈現${l}，自然生活感。${MASCOT} 動作：${a}。不必強制出現產品；若出現則${PRODUCT_RULE}`,characters:'官網版Q版小老闆；夥伴依情境加入'});
  }

  const WANHUA=[['西昌街日常','老街步調'],['傳統市場','採買日常'],['街區散步','萬華巷弄'],['品牌從萬華開始','四代故事'],['店面外觀','來店走走'],['萬華人情','熟悉的街坊']];
  for(let i=0;i<24;i++){
    const w=WANHUA[i%WANHUA.length],v=Math.floor(i/WANHUA.length)+1;
    add({id:`XJW-WANHUA-${String(i+1).padStart(3,'0')}`,title:`萬華｜${w[0]} ${v}`,copy:`仙加味從萬華的日常一路走到今天。${w[1]}不只是背景，也是品牌生活感的一部分。\n\n我們把產品資料與使用方式整理得更清楚，希望讓每一次認識都簡單一點。\n\n仙加味\n補養，是一種節奏。`,category:'萬華在地',location:'萬華街景',image_asset_id:`gen-wanhua-${String(i+1).padStart(3,'0')}`,image_prompt:`萬華在地生活場景，主題「${w[0]}」；不要誤用其他城市地標。${MASCOT} 品牌只顯示仙加味，不主動顯示公司資料；產品不必出現。`,characters:'官網版Q版小老闆；夥伴依情境加入'});
  }

  const BOSS_ACTIONS=['整理今天的資訊','準備出門','整理桌面','招手歡迎','指向看板','比讚','端溫水','看鍋燉煮','思考問題','準備寄件','查看產品原圖','收好雨傘'];
  const COMPANIONS=[
    ['小鹿','陪小老闆散步','公園','小鹿是獨立Q版角色，與小老闆分開呈現。'],
    ['小烏龜','陪小老闆整理桌面','書房','小烏龜是獨立Q版角色，與小老闆分開呈現。'],
    ['灰色小河馬娃娃','居家休息陪伴','居家客廳','灰色小河馬只作居家休息陪伴道具，不喧賓奪主。'],
    ['米色小鹿安撫巾','親子與居家陪伴','居家客廳','米色小鹿安撫巾只作親子／居家陪伴道具。']
  ];
  let bossCount=0,companionCount=0;
  for(let i=0;i<48;i++){
    const companionPost=i%3===0;
    if(companionPost){
      const c=COMPANIONS[companionCount%COMPANIONS.length],v=Math.floor(companionCount/COMPANIONS.length)+1;
      companionCount+=1;
      add({id:`XJW-CHARACTER-${String(i+1).padStart(3,'0')}`,title:`陪伴角色｜${c[0]} ${v}`,copy:`今天讓${c[0]}陪著小老闆，把日常步調放慢一點。陪伴不需要很多安排，簡單待在一起就很好。\n\n仙加味\n補養，是一種節奏。`,category:'陪伴角色',occasion:c[1],location:c[2],image_asset_id:`gen-character-${String(i+1).padStart(3,'0')}`,image_prompt:`${c[2]}，主題「${c[0]}」。${MASCOT} ${c[3]} 不出現產品。`,characters:`官網版Q版小老闆＋${c[0]}`});
    }else{
      const action=BOSS_ACTIONS[bossCount%BOSS_ACTIONS.length],v=Math.floor(bossCount/BOSS_ACTIONS.length)+1;
      bossCount+=1;
      add({id:`XJW-CHARACTER-${String(i+1).padStart(3,'0')}`,title:`小老闆日常｜${action} ${v}`,copy:`今天的小老闆正在${action}。日常不一定要很滿，做一件做得到的小事，就能把節奏慢慢找回來。\n\n仙加味\n補養，是一種節奏。`,category:'小老闆與夥伴',occasion:action,location:'日常生活場景',image_asset_id:`gen-character-${String(i+1).padStart(3,'0')}`,image_prompt:`仙加味日常生活場景，小老闆動作「${action}」。${MASCOT} 這張不強制加入夥伴，也不強制出現產品。`,characters:'官網版Q版小老闆'});
    }
  }

  const EDU=[
    ['產品規格怎麼看','先看容量、重量、塊數與包裝形式，再看自己的使用情境。'],
    ['圖片為什麼要照原圖','產品圖維持正式包裝與比例，才不會讓消費者看到與實品不同的外觀。'],
    ['30cc為什麼沒有貼紙','30cc是小玻璃裸罐，正式呈現維持原罐型、原比例與無貼紙外觀；名稱與單位固定使用「玻璃罐／罐」。'],
    ['180cc鋁袋怎麼辨識','180cc是狹長直立鋁袋，圖片不可拉寬或放大成不自然比例。'],
    ['龜鹿膏新版標籤','100g六角罐目前只使用現行米白標籤，舊版標籤不再作正式依據。'],
    ['龜鹿湯塊正式規格','龜鹿湯塊只有75g／盒深藍盒，8塊裝，每塊約9.375g。'],
    ['龜鹿膠盒型','龜鹿膠600g（1斤）使用淡紫盒，32塊裝，每塊約18.75g；不可和龜鹿湯塊混用。'],
    ['鹿茸粉規格','鹿茸粉正式規格為75g／罐，使用白色塑膠罐正式原圖。'],
    ['龜鹿膏一般使用','一般使用為每日早上及下午各一小匙；初次可先半匙，避免接近睡前。'],
    ['龜鹿飲一般使用','30cc每日一罐，180cc每日一包；可溫熱飲用並避免冰飲。'],
    ['龜鹿飲製作時間','只有龜鹿飲屬接單後安排製作，約5～7個工作天完成後安排出貨。'],
    ['其他產品出貨','龜鹿膏、龜鹿湯塊、龜鹿膠與鹿茸粉為預先製作備貨商品，依現貨狀況安排出貨。'],
    ['為什麼新圖要審核','新圖需確認產品、情境、角色與文字全部正確後才進入排程。'],
    ['天氣貼文怎麼發','即時天氣、颱風、寒冷與空氣品質內容要在發布前再次確認。'],
    ['小老闆畫風怎麼統一','小老闆只用官網 approved-v405 同款柔和立體Q版，姿勢可變但臉型、髮型、服裝與畫風不變。'],
    ['夥伴一定每張出現嗎','不用。小鹿與小烏龜依情境加入；出現時保持分開的獨立角色。']
  ];
  for(let i=0;i<24;i++){
    const e=EDU[i%EDU.length],v=Math.floor(i/EDU.length)+1;
    add({id:`XJW-EDU-${String(i+1).padStart(3,'0')}`,title:`常見問題｜${e[0]} ${v}`,copy:`${e[1]}\n\n仙加味把資訊說清楚，讓選擇更簡單。`,category:'FAQ',occasion:'資訊教育',location:'仙加味品牌展示空間',image_asset_id:`gen-edu-${String(i+1).padStart(3,'0')}`,image_prompt:`乾淨繁體中文FAQ圖卡，主題「${e[0]}」；短文字、大留白。${MASCOT} 若產品出現則${PRODUCT_RULE}`,characters:'官網版Q版小老闆；夥伴依情境加入'});
  }

  const PARTNER=['產品規格圖','產品情境圖','FAQ圖卡','四季素材','料理素材','品牌故事素材','節慶素材','店內展示素材'];
  for(let i=0;i<24;i++){
    const p=PARTNER[i%PARTNER.length],v=Math.floor(i/PARTNER.length)+1;
    add({id:`XJW-PARTNER-${String(i+1).padStart(3,'0')}`,title:`合作夥伴素材｜${p} ${v}`,copy:`這份${p}提供合作店家與診所作為產品介紹與日常內容使用。\n\n合作夥伴版本不強迫導流至仙加味官方LINE，可依合作方式加入店家自己的聯絡資訊；正式產品規格與包裝不得修改。`,platforms:['Facebook','Instagram'],category:'合作夥伴素材',occasion:'合作通路',location:'合作店家',image_asset_id:`gen-partner-${String(i+1).padStart(3,'0')}`,image_prompt:`可供中藥店／蔘藥店／中醫診所使用的乾淨品牌素材；保留仙加味識別但不強迫放官方LINE CTA。${PRODUCT_RULE} 人物可不出現；若出現遵守：${MASCOT}`,characters:'視素材需求，可不出現角色',partner_mode:true});
  }

  const STORE=['開店前整理','產品架整理','包裝檢查','回覆LINE詢問','準備寄件','整理素材','下午工作空檔','下班前盤點','週末前準備'];
  for(let i=0;i<9;i++){
    const s=STORE[i];
    add({id:`XJW-STORE-${String(i+1).padStart(3,'0')}`,title:`門市日常｜${s}`,copy:`今天的門市日常是${s}。把每一件小事整理好，產品資訊、素材與回覆也會更清楚。\n\n仙加味\n補養，是一種節奏。`,category:'門市日常',occasion:s,location:'仙加味品牌展示空間',image_asset_id:`gen-store-${String(i+1).padStart(3,'0')}`,image_prompt:`仙加味品牌展示空間，主題「${s}」。${MASCOT} 畫面乾淨自然，不顯示公司名稱、統編、公司電話或公司地址。若有產品則${PRODUCT_RULE}`,characters:'官網版Q版小老闆；夥伴依情境加入'});
  }

  if(extra.length!==177)console.warn('仙加味 v12 177篇擴充數異常：',extra.length);
  if(bossCount!==32||companionCount!==16)console.warn('仙加味角色內容數異常：',bossCount,companionCount);

  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const response=await PREV_FETCH(input,init);
    if(!url.includes(TARGET)||!response.ok)return response;
    try{
      const data=await response.clone().json();
      const existing=new Set((data.posts||[]).map((p)=>p.id));
      const generated=extra.filter((p)=>!existing.has(p.id));
      const mergedPosts=[...(data.posts||[]),...generated];
      const merged={...data,version:VERSION,posts:mergedPosts};
      merged.counts={...(data.counts||{}),total:mergedPosts.length,generated_v7:generated.length,pending_review:mergedPosts.filter((p)=>p.status==='pending_review').length,needs_generation:mergedPosts.filter((p)=>p.image_status==='needs_generation'||(!p.image_url&&p.status!=='published')).length};
      const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');
      return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});
    }catch{return response;}
  };
})();
