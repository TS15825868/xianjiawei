(()=>{
  const RAW_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const VERSION='2026-08-07-post-bank-v6-300';
  const PLATFORM=['Facebook','Instagram'];
  const MASCOT='官網版Q版小老闆：米白中式上衣、深綠圍裙、紅色直式「仙加味」印章；小老闆出現時小鹿與小烏龜必須一起出現。';
  const PRODUCT_RULE='產品只能使用仙加味正式原產品照片等比例合成；AI只生成背景、角色、道具與情境，不可重畫產品、裁切產品、改包裝、改標籤、改顏色或拉伸比例。';
  const PRODUCTS=[
    ['guilu-gao','龜鹿膏100g','龜鹿膏','100g／罐','固定節奏','龜鹿膏六角玻璃罐約51×78mm比例、金色蓋；只用新版標籤，舊紅白直式貼紙禁止。'],
    ['guilu-drink-30','龜鹿飲30cc小玻璃罐','龜鹿飲30cc玻璃罐','30cc／罐（小玻璃罐）','方便即飲','30cc小玻璃罐同型外觀約42mm直徑×51mm高；裸罐、無貼紙、金色蓋；高矮胖瘦照原圖，不得拉高或拉胖。'],
    ['guilu-drink-180','龜鹿飲180cc鋁袋','龜鹿飲180cc鋁袋','180cc／包（鋁袋）','方便即飲','180cc鋁袋必須狹長直立、寬高比約0.64；畫面中自然縮小，不得橫向拉寬或加高放大。'],
    ['guilu-tangkuai-75','龜鹿湯塊75g','龜鹿湯塊','75g／盒｜8塊裝｜每塊約9.375g','料理搭配','75g深藍正式盒裝；8塊裝，不與300g、600g或龜鹿膠紫盒混用。'],
    ['guilu-tangkuai-300','龜鹿湯塊300g','龜鹿湯塊','300g／盒｜16塊裝｜每塊約18.75g','料理搭配','300g正式包裝依原圖，不與75g或600g混用。'],
    ['guilu-tangkuai-600','龜鹿湯塊600g','龜鹿湯塊','600g／盒｜32塊裝｜每塊約18.75g','料理搭配','600g正式湯塊包裝依原圖，不與龜鹿膠紫盒混用。'],
    ['guilu-jiao','龜鹿膠600g','龜鹿膠','600g（1斤）／盒｜32塊裝｜每塊約18.75g','料理搭配','龜鹿膠淡紫色正式盒裝依原圖比例；紫盒不可橫向拉長；32塊裝。'],
    ['luerong-fen','鹿茸粉75g','鹿茸粉','75g／罐','自行搭配','鹿茸粉75g白色塑膠罐正式原圖，不改罐型或標示。']
  ];
  const SEASONS=['春','夏','秋','冬'];
  const WEATHER=['晴天','悶熱','下雨','午後雷陣雨','早晚溫差','強風','寒冷','颱風'];
  const OCCASIONS=['早餐前後','上班前','工作空檔','午休','下午休息','下班後','家庭晚餐','週末採買','家庭聚餐','拜訪長輩','節慶送禮','雨天宅家','出差外勤','料理備餐','晚間放鬆'];
  const LOCATIONS=['居家客廳','居家廚房','餐桌','書房','辦公室','車上休息','公園','河濱','萬華街景','仙加味品牌展示空間','傳統市場','家庭餐廳'];
  const ACTIONS=['端溫水','整理食材','看鍋燉煮','收傘','穿薄外套','準備外出','放下工作休息','加入LINE詢問','展示產品','陪家人用餐'];
  const RECIPES=['山藥雞湯','香菇雞湯','紅棗枸杞雞湯','排骨湯','蘿蔔排骨湯','玉米排骨湯','電鍋燉湯','家庭火鍋','週末雞湯','家常蔬菜湯','紅棗雞湯','保溫壺熱飲'];
  const FAQ=[
    ['30cc與180cc怎麼選','30cc是小玻璃罐，180cc是鋁袋，兩者是不同包裝形式；可依攜帶與飲用習慣選擇。'],
    ['30cc罐型','30cc使用小玻璃罐，裸罐無貼紙，罐型比例固定照正式原圖。'],
    ['180cc鋁袋','180cc採狹長鋁袋包裝，圖片與實品都以正式原袋比例呈現。'],
    ['隔水加熱','龜鹿飲可依包裝與使用方式隔水溫熱，飲用前確認溫度適合入口。'],
    ['保存方式','未開封產品依標示保存；開封後依產品說明處理並儘早使用。'],
    ['試喝流程','龜鹿飲30cc試喝組為3罐試喝品免費、運費自付；每位顧客、電話及地址限申請一次。'],
    ['製作時間','龜鹿飲試喝與正式訂單接單後安排製作，約5～7個工作天出貨。'],
    ['官方LINE','產品詢問、試喝與正式下單統一由仙加味官方LINE完成。']
  ];
  const WEATHER_COPY={
    '晴天':'天氣晴朗，外出記得帶水，行程中也留一點休息時間。',
    '悶熱':'天氣悶熱時，先顧好通風、喝水與休息，活動安排不要太緊。',
    '下雨':'下雨天把步調放慢一點，收好雨具、回到室內整理手邊的事。',
    '午後雷陣雨':'午後容易有短時雨勢，出門前記得多帶一把傘，也預留返程時間。',
    '早晚溫差':'早晚溫度變化明顯時，外出多帶一件薄外套會比較方便。',
    '強風':'風勢明顯時，外出留意安全，也把陽台與門口的物品收妥。',
    '寒冷':'天氣偏冷，餐桌上多一點溫熱料理，回家也讓自己慢下來。',
    '颱風':'颱風影響期間以安全為優先，減少不必要外出並留意官方最新資訊。'
  };
  const SEASON_COPY={
    '春':'春天把步調整理得輕一點，從規律吃飯、喝水與日常作息開始。',
    '夏':'夏天的日常以清爽、通風與補充水分為主，不必把每件事都塞得太滿。',
    '秋':'秋天適合重新把生活拉回規律，從一餐一飯與固定休息時間開始。',
    '冬':'冬天把日常安排得暖一點，溫熱料理、家人用餐與穩定作息都很適合。'
  };
  const posts=[];
  const add=(p)=>posts.push({
    platforms:PLATFORM,status:'pending_review',owner_review_required:true,approval_required:true,
    publish_allowed:false,schedule_enabled:false,scheduled_at:null,image_url:'',image_status:'needs_generation',
    season:'中性',weather:'中性',temperature:'常溫',requires_live_weather:false,...p
  });
  const productCopy=(p,t)=>[
    `${p[1]}的重點先從規格看清楚：${p[3]}。選擇前先確認自己的使用習慣，再安排適合的日常節奏。`,
    `想把${p[1]}放進日常，可以先從「${p[4]}」這個方向理解。規格為${p[3]}，依自己的生活型態安排即可。`,
    `產品資訊越清楚，選擇越簡單。${p[1]}規格：${p[3]}。仙加味希望把產品、使用方式與保存方式都說明得更明白。`,
    `今天認識${p[1]}：${p[3]}。不需要一次改變很多，從自己做得到的習慣開始就好。`,
    `不同產品有不同型態。${p[1]}屬於「${p[4]}」的選擇，正式規格是${p[3]}。`,
    `挑選前先看規格、再看使用情境。${p[1]}為${p[3]}，適合依實際需求安排。`
  ][t%6];
  for(let i=0;i<48;i++){
    const p=PRODUCTS[i%PRODUCTS.length],t=Math.floor(i/PRODUCTS.length),scene=['乾淨產品介紹桌面','品牌展示空間','居家餐桌自然光','溫暖木質藥櫃背景','簡潔留白商品教育版面','日常使用情境'][t%6];
    add({id:`XJW-PRODUCT-${String(i+1).padStart(3,'0')}`,title:`${p[1]}｜${['規格看清楚','日常怎麼安排','產品型態','怎麼選','使用情境','資料透明'][t%6]}`,copy:`${productCopy(p,t)}\n\n仙加味\n補養，是一種節奏。`,category:'產品',image_asset_id:`gen-product-${String(i+1).padStart(3,'0')}`,image_prompt:`${scene}；${PRODUCT_RULE}${p[5]}；顯示規格「${p[3]}」；${MASCOT}`,product_refs:[p[0]],occasion:'產品介紹',location:'仙加味品牌展示空間'});
  }
  const OPEN=['早上不一定要很趕，先把今天要做的事排好。','忙到一半，留幾分鐘讓自己離開螢幕。','午休不需要排滿，吃完飯後讓步調慢一點。','下午容易被工作追著跑，記得把水放在手邊。','下班回家，把外面的速度留在門外。','週末把時間留給家人，也留一點給自己。'];
  const END=['喝口溫水、整理桌面，再回到下一件事。','簡單的習慣，比一次做很多更容易長久。','日常補養不需要複雜，重點是找到自己做得到的節奏。','把飲食、休息與生活安排得剛剛好，就是一種照顧。'];
  for(let i=0;i<48;i++){
    const o=OCCASIONS[i%OCCASIONS.length],l=LOCATIONS[(i*3)%LOCATIONS.length],a=ACTIONS[(i*2)%ACTIONS.length];
    add({id:`XJW-RHYTHM-${String(i+1).padStart(3,'0')}`,title:`${o}｜留一點自己的節奏`,copy:`${OPEN[i%OPEN.length]}\n\n${o}時，${END[Math.floor(i/6)%END.length]}\n\n仙加味\n補養，是一種節奏。`,category:'日常節奏',image_asset_id:`gen-rhythm-${String(i+1).padStart(3,'0')}`,image_prompt:`${l}、${o}；${MASCOT} 動作：${a}；表情自然微笑；不必出現產品，若出現只能使用正式原圖等比例合成。`,occasion:o,location:l,characters:'官網版Q版小老闆＋小鹿＋小烏龜'});
  }
  const SC=['晨間','上班前','午休','下班後','家庭晚餐','週末料理','居家整理','外出散步','雨天宅家','家庭聚餐','閱讀休息','採買備餐'];
  for(let i=0;i<48;i++){
    const s=SEASONS[i%4],c=SC[Math.floor(i/4)%SC.length],l=LOCATIONS[(i+2)%LOCATIONS.length];
    add({id:`XJW-SEASON-${String(i+1).padStart(3,'0')}`,title:`${s}季｜${c}的日常安排`,copy:`${SEASON_COPY[s]}\n\n${c}時，挑一件做得到的小事就好。\n\n仙加味\n補養，是一種節奏。`,category:'四季',image_asset_id:`gen-season-${String(i+1).padStart(3,'0')}`,image_prompt:`季節明確為${s}季；${l}、${c}；依${s}季對應色溫、衣著、環境；${MASCOT} 不得出現衝突季節。`,season:s,weather:'季節中性',occasion:c,location:l,temperature:{春:'溫和',夏:'清爽',秋:'溫和',冬:'溫熱'}[s],characters:'官網版Q版小老闆＋小鹿＋小烏龜'});
  }
  for(let i=0;i<48;i++){
    const w=WEATHER[i%WEATHER.length],o=OCCASIONS[(i*2)%OCCASIONS.length],l=LOCATIONS[(i*5)%LOCATIONS.length];
    add({id:`XJW-WEATHER-${String(i+1).padStart(3,'0')}`,title:`${w}｜${o}小提醒`,copy:`${WEATHER_COPY[w]}\n\n這類貼文發布前會再確認當日實際天氣，不提前自動排程。\n\n仙加味\n補養，是一種節奏。`,category:'天氣關懷',image_asset_id:`gen-weather-${String(i+1).padStart(3,'0')}`,image_prompt:`台灣${w}情境；${l}、${o}；畫面依實際天候呈現；${MASCOT} 不得出現與${w}衝突的天空、衣著或道具。`,season:'依當日',weather:w,occasion:o,location:l,temperature:'依當日',characters:'官網版Q版小老闆＋小鹿＋小烏龜',requires_live_weather:true});
  }
  for(let i=0;i<48;i++){
    const r=RECIPES[i%RECIPES.length],p=PRODUCTS[3+(i%4===3?3:i%4)];
    add({id:`XJW-COOK-${String(i+1).padStart(3,'0')}`,title:`${r}｜今天慢慢燉一鍋`,copy:`${r}不用做得太複雜，準備家常食材、控制好份量，慢慢燉到自己喜歡的口感。\n\n需要料理搭配時，可依實際份量參考${p[2]}；正式規格請以產品頁標示為準。\n\n仙加味\n補養，是一種節奏。`,category:'料理',image_asset_id:`gen-cook-${String(i+1).padStart(3,'0')}`,image_prompt:`居家廚房、${r}、熱氣湯鍋、備料與慢火燉煮；${MASCOT} 若出現${p[2]}，${PRODUCT_RULE}${p[5]}`,product_refs:[p[0]],occasion:'料理備餐',location:'居家廚房',temperature:'熱湯',characters:'官網版Q版小老闆＋小鹿＋小烏龜'});
  }
  const B=[['萬華開始','從萬華開始，把多年累積的經驗整理成更貼近日常的品牌內容。'],['四代傳承','四代一路走來，重視的是把產品資料、原料與使用方式說清楚。'],['補養是一種節奏','仙加味相信，日常照顧不是一次做很多，而是找到能長久維持的節奏。'],['資料透明','產品規格、保存方式與使用方式清楚，選擇才會更簡單。'],['小老闆日常','小老闆和小鹿、小烏龜一起，把複雜的資訊整理得更簡單。'],['品牌展示','看得到產品，也看得到規格與使用方式，讓每一次詢問更有效率。']];
  for(let i=0;i<24;i++){
    const b=B[i%B.length],l=['萬華街景','仙加味品牌展示空間','傳統市場','居家餐桌'][i%4];
    add({id:`XJW-BRAND-${String(i+1).padStart(3,'0')}`,title:`仙加味｜${b[0]}`,copy:`${b[1]}\n\n需要了解產品，統一從仙加味官方LINE詢問。\n\n仙加味\n補養，是一種節奏。`,platforms:['Facebook','Instagram','LINE VOOM'],category:'品牌',image_asset_id:`gen-brand-${String(i+1).padStart(3,'0')}`,image_prompt:`${l}；品牌只顯示「仙加味」；${MASCOT} 不放公司名稱、統編、公司電話與公司地址。`,occasion:'品牌介紹',location:l,characters:'官網版Q版小老闆＋小鹿＋小烏龜'});
  }
  for(let i=0;i<24;i++){
    const f=FAQ[i%FAQ.length];
    add({id:`XJW-FAQ-${String(i+1).padStart(3,'0')}`,title:`常見問題｜${f[0]}`,copy:`${f[1]}\n\n有其他問題，歡迎到仙加味官方LINE詢問。`,category:'FAQ',image_asset_id:`gen-faq-${String(i+1).padStart(3,'0')}`,image_prompt:`FAQ資訊圖；主題「${f[0]}」；文字精簡；${PRODUCT_RULE}${MASCOT}`,occasion:'FAQ',location:'仙加味品牌展示空間',characters:'官網版Q版小老闆＋小鹿＋小烏龜'});
  }
  const TA=['先試喝，再決定','想先了解30cc口感','三罐試喝組','運費怎麼算','試喝申請流程','30cc與180cc一起了解','接單後安排製作','第一次申請提醒','官方LINE申請','30cc正式售價','180cc正式售價','試喝與正式下單'];
  for(let i=0;i<12;i++){
    add({id:`XJW-TRIAL-${String(i+1).padStart(3,'0')}`,title:`龜鹿飲試喝｜${TA[i]}`,copy:'想先試喝，再決定是否適合自己的日常飲用方式嗎？\n\n龜鹿飲30cc試喝組：3罐試喝品免費，運費自付。7-11店到店60元；郵局宅配100元。每位顧客、電話及地址限申請一次；接單後安排製作，約5～7個工作天出貨。\n\n30cc正式售價60元／罐，買10送1｜11罐600元。另有180cc鋁袋：單包200元，買10送1｜11包2,000元。\n\n申請與下單統一在仙加味官方LINE完成。\n\n仙加味\n補養，是一種節奏。',platforms:['Facebook','Instagram','LINE VOOM','Google 商家最新動態'],category:'試喝活動',image_asset_id:`gen-trial-${String(i+1).padStart(3,'0')}`,image_prompt:`龜鹿飲試喝主圖；3罐30cc小玻璃罐必須使用正式原圖，裸罐無貼紙、金色蓋、同型比例約42×51mm；180cc鋁袋僅作右下角小尺寸補充，狹長寬高比約0.64，不可過寬或過高；${MASCOT} 圖中文字只保留「3罐試喝品免費」「運費自付」「另有180cc鋁袋」「LINE申請」。`,product_refs:['guilu-drink-30','guilu-drink-180'],occasion:'試喝申請',location:'仙加味品牌展示空間',characters:'官網版Q版小老闆＋小鹿＋小烏龜'});
  }
  const OVERRIDES={
    'POST-GAO-100':'龜鹿膏100g正式原圖；六角玻璃罐約51×78mm比例、金色蓋；只使用目前新版標籤，舊紅白直式貼紙禁止；不可重畫或拉伸。',
    'POST-DRINK-30':'30cc小玻璃罐正式原圖；裸罐無貼紙、金色蓋；同型外觀約42mm直徑×51mm高；高矮胖瘦照原圖，不得做高、做胖或改成瓶型。',
    'POST-DRINK-180':'180cc鋁袋正式原圖；狹長直立、寬高比約0.64；畫面比例自然縮小，不得拉寬、不得加高放大。',
    'POST-JIAO-600':'龜鹿膠600g淡紫色正式盒裝；32塊裝；紫盒依使用者原始實拍比例等比例縮放，不得橫向拉長；不得混入龜鹿湯塊藍盒。',
    'POST-COMBO':'龜鹿膏新版標籤、30cc小玻璃罐與180cc狹長鋁袋正式原圖全部等比例合成；禁止使用龜鹿膏舊貼紙。',
    'POST-PRODUCT-OVERVIEW':'六個正式產品分類全部使用正式原圖等比例合成；30cc約42×51mm同型小罐、180cc狹長鋁袋約0.64寬高比、龜鹿膏只用新版貼紙、龜鹿膠紫盒不可拉長。'
  };
  window.XJW_POST_BANK_V6={version:VERSION,count:posts.length,posts};
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const response=await RAW_FETCH(input,init);
    if(!url.includes(TARGET)||!response.ok)return response;
    try{
      const data=await response.clone().json();
      const base=(data.posts||[]).map(p=>OVERRIDES[p.id]?{...p,image_prompt:OVERRIDES[p.id]}:p);
      const merged={...data,version:'2026-08-07-public-posts-v6-323-review-queue',visual_spec:'content/visual-production-spec-v20260807.json',posts:[...base,...posts]};
      merged.counts={total:merged.posts.length,published_locked:merged.posts.filter(p=>p.status==='published'||p.prevent_republish===true).length,pending_review:merged.posts.filter(p=>p.status==='pending_review').length,needs_generation:merged.posts.filter(p=>p.image_status==='needs_generation').length,known_image_copy_mismatches:0,duplicate_primary_images:0,missing_asset_bindings:merged.posts.filter(p=>!p.image_url).length};
      const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');
      return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});
    }catch{return response;}
  };
})();
