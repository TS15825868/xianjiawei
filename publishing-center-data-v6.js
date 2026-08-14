(()=>{
  const RAW_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const VERSION='2026-08-08-post-bank-v12-300-six-current-products';
  const PLATFORM=['Facebook','Instagram'];
  const MASCOT='人物若出現，只使用官網 images/brand/approved-v405/ 同款柔和立體Q版小老闆：圓臉、大眼、短黑髮、米白中式上衣、深綠圍裙、胸前紅色直式「仙加味」印章。姿勢依情境自由變化。小鹿與小烏龜不是每張強制出現；需要夥伴時才加入，且必須是分開的獨立角色、同一Q版質感。';
  const PRODUCT_RULE='產品若出現，只能直接使用仙加味正式原產品照片等比例合成；AI只生成背景、角色、道具與情境，不可重畫產品、改包裝、改標籤、裁切產品或拉伸比例。';
  const PRODUCTS=[
    {id:'guilu-gao',short:'龜鹿膏100g',name:'龜鹿膏',spec:'100g／罐',mode:'固定日常',image:'images/products-v3/guilu-gao.jpg',visual:'六角玻璃罐約51×78mm、金色蓋，只用現行米白標籤。'},
    {id:'guilu-drink-30',short:'龜鹿飲30cc小玻璃罐',name:'龜鹿飲30cc玻璃罐',spec:'30cc／罐（小玻璃罐）',mode:'方便即飲',image:'images/products-v3/guilu-drink-30.jpg',visual:'小玻璃裸罐、無貼紙、無外盒、無外袋、金色蓋，約42mm直徑×51mm高，不得稱瓶。'},
    {id:'guilu-drink-180',short:'龜鹿飲180cc鋁袋',name:'龜鹿飲180cc鋁袋',spec:'180cc／包（鋁袋）',mode:'方便即飲',image:'images/products-v3/guilu-drink-180.jpg',visual:'狹長直立鋁袋，寬高比約0.64，不拉寬、不放大失真。'},
    {id:'guilu-tangkuai',short:'龜鹿湯塊75g',name:'龜鹿湯塊',spec:'75g （2兩）／盒｜8塊裝｜每塊約9.375g',mode:'料理搭配',image:'images/products-v3/guilu-tangkuai.jpg',visual:'只有75g深藍正式盒裝，8塊裝，只用正式原圖。'},
    {id:'guilu-jiao',short:'龜鹿膠600g',name:'龜鹿膠',spec:'600g （1斤）／盒｜32塊裝｜每塊約18.75g',mode:'家庭料理',image:'images/products-v3/guilu-jiao.jpg',visual:'淡紫色正式盒裝，32塊裝，等比例呈現，不與龜鹿湯塊混用。'},
    {id:'luerong-fen',short:'鹿茸粉75g',name:'鹿茸粉',spec:'75g／罐',mode:'自行搭配',image:'images/products-v3/luerong-fen.jpg',visual:'75g白色塑膠罐正式原圖，不改罐型或標示。'}
  ];
  const SEASONS=['春','夏','秋','冬'];
  const WEATHER=['晴天','悶熱','下雨','午後雷陣雨','早晚溫差','強風','寒冷','颱風'];
  const OCCASIONS=['早餐前後','上班前','工作空檔','午休','下午休息','下班後','家庭晚餐','週末採買','家庭聚餐','拜訪長輩','雨天宅家','出差外勤'];
  const LOCATIONS=['居家客廳','居家廚房','餐桌','書房','辦公室','車上休息','公園','河濱','萬華街景','仙加味品牌展示空間','傳統市場','家庭餐廳'];
  const ACTIONS=['招手','端溫水','整理食材','看鍋燉煮','收傘','穿薄外套','準備外出','放下工作休息','展示產品','陪家人用餐','思考','比讚'];
  const RECIPES=['山藥雞湯','香菇雞湯','紅棗枸杞雞湯','排骨湯','蘿蔔排骨湯','玉米排骨湯','電鍋燉湯','家庭火鍋','週末雞湯','家常蔬菜湯','紅棗雞湯','溫熱家常湯'];
  const FAQ=[
    ['30cc與180cc怎麼選','30cc是小玻璃罐，180cc是鋁袋，兩者是不同包裝形式；可依攜帶與飲用習慣選擇。'],
    ['30cc罐型','30cc使用小玻璃裸罐，正式呈現不加貼紙、外盒或外袋。'],
    ['180cc鋁袋','180cc採狹長直立鋁袋包裝，圖片與實品都以正式原袋比例呈現。'],
    ['龜鹿湯塊規格','龜鹿湯塊正式規格為75g／盒，8塊裝，每塊約9.375g，使用深藍正式盒裝。'],
    ['龜鹿膠規格','龜鹿膠為600g（1斤）／盒，32塊裝，每塊約18.75g，使用淡紫正式盒裝。'],
    ['龜鹿膏怎麼使用','龜鹿膏一般使用為每日早上及下午各一小匙；初次可先從半匙開始，可直接取用或以約100～300mL熱水化開。'],
    ['龜鹿飲怎麼喝','30cc每日一罐、180cc每日一包，可溫熱飲用並避免冰飲。'],
    ['保存方式','未開封依產品標示保存；開封後依產品說明處理並儘早使用。'],
    ['試喝流程','龜鹿飲30cc試喝組為3罐試喝品免費、運費自付；每位顧客、電話及地址限申請一次。'],
    ['龜鹿飲製作時間','龜鹿飲接單後安排製作，約5～7個工作天完成後安排出貨。'],
    ['官方LINE','產品詢問、試喝與正式下單統一由仙加味官方LINE確認。'],
    ['為什麼產品圖要用原圖','產品圖維持正式包裝與比例，才能避免圖片與實品外觀不一致。']
  ];
  const WEATHER_COPY={
    '晴天':'天氣晴朗，外出記得帶水，行程中也留一點休息時間。',
    '悶熱':'天氣悶熱時，先顧好通風、喝水與休息，活動安排不要太緊。',
    '下雨':'下雨天把步調放慢一點，收好雨具，回到室內整理手邊的事。',
    '午後雷陣雨':'午後可能有短時雨勢；這類貼文發布前仍要依當日官方天氣資訊確認。',
    '早晚溫差':'早晚溫度變化明顯時，外出多帶一件薄外套會比較方便。',
    '強風':'風勢明顯時，外出留意安全，也把陽台與門口的物品收妥。',
    '寒冷':'天氣偏冷，餐桌上多一點溫熱料理，回家也讓自己慢下來。',
    '颱風':'颱風內容只建立候選；發布前必須再次確認官方資訊，以安全提醒為優先。'
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

  const productAngles=['規格看清楚','日常怎麼安排','產品型態','怎麼選','使用情境','資料透明','包裝辨識','原圖比例'];
  for(let i=0;i<48;i++){
    const p=PRODUCTS[i%PRODUCTS.length],angle=productAngles[Math.floor(i/PRODUCTS.length)%productAngles.length];
    const location=LOCATIONS[(i*5)%LOCATIONS.length];
    add({
      id:`XJW-PRODUCT-${String(i+1).padStart(3,'0')}`,
      title:`${p.short}｜${angle}`,
      copy:`先把產品資訊看清楚，再決定怎麼放進自己的日常。${p.name}正式規格為${p.spec}，產品型態屬於${p.mode}。\n\n選擇不需要複雜，先確認包裝、規格與自己的使用習慣。\n\n仙加味\n補養，是一種節奏。`,
      category:'產品',image_asset_id:`gen-product-${String(i+1).padStart(3,'0')}`,
      image_prompt:`${location}的乾淨商品教育版面。正式產品檔案：${p.image}。${PRODUCT_RULE}${p.visual}${MASCOT} 圖片短標只用「${p.name}｜${p.spec}」。`,
      product_refs:[p.id],occasion:'產品介紹',location
    });
  }

  const OPEN=['早上不一定要很趕，先把今天要做的事排好。','忙到一半，留幾分鐘讓自己離開螢幕。','午休不需要排滿，吃完飯後讓步調慢一點。','下午容易被工作追著跑，記得把水放在手邊。','下班回家，把外面的速度留在門外。','週末把時間留給家人，也留一點給自己。'];
  const END=['喝口溫水、整理桌面，再回到下一件事。','簡單的習慣，比一次做很多更容易長久。','日常補養不需要複雜，重點是找到自己做得到的節奏。','把飲食、休息與生活安排得剛剛好，就是一種照顧。'];
  for(let i=0;i<48;i++){
    const o=OCCASIONS[i%OCCASIONS.length],l=LOCATIONS[(i*3)%LOCATIONS.length],a=ACTIONS[(i*2)%ACTIONS.length];
    add({id:`XJW-RHYTHM-${String(i+1).padStart(3,'0')}`,title:`${o}｜留一點自己的節奏 ${Math.floor(i/12)+1}`,copy:`${OPEN[i%OPEN.length]}\n\n${o}時，${END[Math.floor(i/6)%END.length]}\n\n仙加味\n補養，是一種節奏。`,category:'日常節奏',image_asset_id:`gen-rhythm-${String(i+1).padStart(3,'0')}`,image_prompt:`${l}、${o}的自然生活情境。${MASCOT} 動作：${a}。不必出現產品；若出現產品必須遵守：${PRODUCT_RULE}`,occasion:o,location:l});
  }

  for(let i=0;i<48;i++){
    const season=SEASONS[i%4],o=OCCASIONS[(i*2)%OCCASIONS.length],l=LOCATIONS[(i*5)%LOCATIONS.length];
    add({id:`XJW-SEASON-${String(i+1).padStart(3,'0')}`,title:`${season}日常｜${o} ${Math.floor(i/4)+1}`,copy:`${SEASON_COPY[season]}\n\n${o}不需要特別安排得很複雜，從做得到的小習慣開始。\n\n仙加味\n補養，是一種節奏。`,category:'四季',season,occasion:o,location:l,image_asset_id:`gen-season-${String(i+1).padStart(3,'0')}`,image_prompt:`台灣${season}季的${l}，${o}；衣著、光線、環境與季節一致。${MASCOT} 不必強制出現產品。`});
  }

  for(let i=0;i<48;i++){
    const w=WEATHER[i%WEATHER.length],o=OCCASIONS[(i*3)%OCCASIONS.length],l=LOCATIONS[(i*4)%LOCATIONS.length];
    add({id:`XJW-WEATHER-${String(i+1).padStart(3,'0')}`,title:`${w}｜日常提醒 ${Math.floor(i/WEATHER.length)+1}`,copy:`${WEATHER_COPY[w]}\n\n先照顧好當下的環境與行程，再安排自己的日常節奏。\n\n仙加味`,category:'天氣關懷',weather:w,occasion:o,location:l,requires_live_weather:true,image_asset_id:`gen-weather-${String(i+1).padStart(3,'0')}`,image_prompt:`${w}的${l}生活情境，${o}；${MASCOT} 天氣視覺與動作要合理。此圖只做候選，發布前重新核對當日天氣。`});
  }

  for(let i=0;i<48;i++){
    const recipe=RECIPES[i%RECIPES.length],product=i%3===0?PRODUCTS[4]:PRODUCTS[3],l='居家廚房';
    add({id:`XJW-RECIPE-${String(i+1).padStart(3,'0')}`,title:`料理搭配｜${recipe} ${Math.floor(i/12)+1}`,copy:`一鍋家常${recipe}，先從家裡本來就會煮的方式開始。料理不需要堆很多步驟，食材、火候與家人的口味才是重點。\n\n若搭配${product.name}，請依正式包裝與一般使用方式安排。\n\n仙加味\n補養，是一種節奏。`,category:'料理',occasion:'料理備餐',location:l,temperature:'熱湯',image_asset_id:`gen-recipe-${String(i+1).padStart(3,'0')}`,image_prompt:`溫暖家常${recipe}餐桌與燉煮情境。${MASCOT} 可專注料理。若畫面出現${product.name}，正式產品檔案：${product.image}；${PRODUCT_RULE}${product.visual}`,product_refs:[product.id]});
  }

  const BRAND_TOPICS=['從萬華開始','四代生活經驗','把資料說清楚','熬製與整理的日常','補養是一種節奏','從傳統走向日常','產品原圖與透明資訊','一家人的工作日常'];
  for(let i=0;i<24;i++){
    const topic=BRAND_TOPICS[i%BRAND_TOPICS.length],v=Math.floor(i/BRAND_TOPICS.length)+1;
    add({id:`XJW-BRAND-${String(i+1).padStart(3,'0')}`,title:`仙加味｜${topic} ${v}`,copy:`仙加味從萬華的日常一路整理到今天。${topic}，不是把傳統說得很遠，而是把產品、料理與生活方式說得更清楚。\n\n我們希望每一次認識仙加味，都能回到簡單、穩定的日常。\n\n仙加味\n補養，是一種節奏。`,category:'品牌',location:'萬華',image_asset_id:`gen-brand-${String(i+1).padStart(3,'0')}`,image_prompt:`萬華與溫暖木質品牌情境，主題「${topic}」。${MASCOT} 不放公司名稱、統編、電話或公司地址；不必出現產品。`});
  }

  for(let i=0;i<24;i++){
    const f=FAQ[i%FAQ.length],v=Math.floor(i/FAQ.length)+1;
    add({id:`XJW-FAQ-${String(i+1).padStart(3,'0')}`,title:`常見問題｜${f[0]} ${v}`,copy:`${f[1]}\n\n如果還不確定怎麼選，可直接到仙加味官方LINE詢問。`,category:'FAQ',occasion:'資訊整理',location:'仙加味品牌展示空間',image_asset_id:`gen-faq-${String(i+1).padStart(3,'0')}`,image_prompt:`繁體中文FAQ圖卡，主題「${f[0]}」；大留白、短文字。${MASCOT} 若涉及產品，只使用正式產品原圖並遵守：${PRODUCT_RULE}`});
  }

  const TRIAL_SCENES=['第一次認識','先試喝再決定','工作日方便攜帶','白天溫熱飲用','寄送前準備','收到試喝組','三罐試喝組','官方LINE申請','運費說明','製作等待','30cc小玻璃罐','試喝後再選擇'];
  for(let i=0;i<12;i++){
    const n=i+1,scene=TRIAL_SCENES[i];
    add({id:`XJW-TRIAL-${String(n).padStart(3,'0')}`,title:`龜鹿飲試喝組｜${scene}`,copy:`想先認識龜鹿飲，可以從30cc試喝組開始。\n\n試喝內容：30cc小玻璃罐×3罐，試喝品免費、運費自付；每位顧客、電話及地址限申請一次。龜鹿飲接單後安排製作，約5～7個工作天完成後安排出貨。\n\n正式售價：30cc 60元／罐，買10送1（共11罐600元）；180cc鋁袋200元／包，買10送1（共11包2,000元）。\n\n申請與下單請由仙加味官方LINE確認。`,category:'試喝活動',occasion:'試喝申請',location:'仙加味品牌展示空間',image_asset_id:`gen-trial-${String(n).padStart(3,'0')}`,image_prompt:`龜鹿飲30cc試喝組，正式產品檔案 images/products-v3/guilu-drink-30.jpg；畫面只呈現3個30cc小玻璃裸罐，金色蓋、無貼紙、無外盒、無外袋，產品比例照正式原圖。${PRODUCT_RULE}${MASCOT} 右下短字可寫「另有販售180cc鋁袋」。`,product_refs:['guilu-drink-30'],special_content:true});
  }

  if(posts.length!==300)console.warn('仙加味 v12 300篇生成數異常：',posts.length);

  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const response=await RAW_FETCH(input,init);
    if(!url.includes(TARGET)||!response.ok)return response;
    try{
      const data=await response.clone().json();
      const existing=new Set((data.posts||[]).map((p)=>p.id));
      const generated=posts.filter((p)=>!existing.has(p.id));
      const mergedPosts=[...(data.posts||[]),...generated];
      const merged={...data,version:VERSION,posts:mergedPosts};
      merged.counts={...(data.counts||{}),total:mergedPosts.length,generated_v6:generated.length,pending_review:mergedPosts.filter((p)=>p.status==='pending_review').length,needs_generation:mergedPosts.filter((p)=>p.image_status==='needs_generation'||(!p.image_url&&p.status!=='published')).length};
      const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');
      return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});
    }catch{return response;}
  };
})();
