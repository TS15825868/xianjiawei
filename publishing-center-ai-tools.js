(()=>{
  const DATA_URL='content/public-post-library.json?v=20260809-04';
  const SITE='https://ts15825868.github.io/xianjiawei/';
  const OFFICIAL_IMAGES=Object.freeze({
    'guilu-gao':`${SITE}images/products-v3/guilu-gao.jpg?v=20260809-25`,
    'guilu-drink-30':`${SITE}images/products-v3/guilu-drink-30.jpg?v=20260809-25`,
    'guilu-drink-180':`${SITE}images/products-v3/guilu-drink-180.jpg?v=20260809-25`,
    'guilu-tangkuai':`${SITE}images/products-v3/guilu-tangkuai.jpg?v=20260809-25`,
    'guilu-jiao':`${SITE}images/products-v3/guilu-jiao.jpg?v=20260809-25`,
    'luerong-fen':`${SITE}images/products-v3/luerong-fen.jpg?v=20260809-25`
  });
  const PRODUCT_IMAGE_BLOCK=Object.entries(OFFICIAL_IMAGES).map(([id,url])=>`${id}: ${url}`).join('\n');
  const BASE_RULES=`品牌只顯示「仙加味」，不可出現台興山產有限公司、統編、公司電話或公司地址。文案以日常飲食、生活節奏、料理搭配為主，不談療效、不強迫推銷。固定標語可使用「補養，是一種節奏。」。

公開產品與規格以最新 public-product-master.json 為權威；下方提供目前清單，不限制品牌未來新增正式品項。
不得自行新增產品規格、縮寫成錯誤規格或把不同產品互換。

正式產品名稱、規格、成分、使用方式與時段全部依下方最新母資料；不自行補寫未知資料。沒有需要寫成分或用量時不要硬塞，但一旦寫到必須使用正式版本。

產品圖片唯一正式來源是官網 images/products-v3/ 使用者核准實拍，舊 products-v2、舊DM、舊海報、AI重畫產品都禁止當產品本體。正式圖片網址：
${PRODUCT_IMAGE_BLOCK}

實際尺寸與比例硬規則：龜鹿膏100g罐體約寬51mm、高78mm；龜鹿飲30cc小玻璃罐約直徑42mm、高51mm，因此30cc與100g同框時，30cc必須明顯更小，不能為了版面排成差不多高。30cc必須是小玻璃裸罐、金色蓋、無貼紙、無外盒、無外袋，任何「30cc玻璃瓶／小玻璃瓶／30cc／瓶」都視為錯誤，必須改成「30cc玻璃罐／30cc／罐（小玻璃罐）」。龜鹿飲180cc必須是狹長直立鋁袋，寬高比目標約0.64，可接受約0.60～0.68，不得橫向拉胖或誇張放大。龜鹿湯塊75g、龜鹿膠600g、鹿茸粉75g目前沒有可信毫米尺寸，不得自行猜測；只保持正式原圖的盒型／罐型與長寬比。多產品同框若缺少可靠的真實相對尺度依據，不要自行猜比例，優先改成單一產品構圖，或標記為待人工審核。

產品本體只能使用上述正式原產品照片「整體等比例」合成；禁止AI重畫、改包裝、改標籤、拉寬、拉高、裁切產品，禁止把不同產品強制等高或等寬。AI只生成背景、小老闆、夥伴、道具與情境。如果目前無法直接讀取或合成正式產品照片，就先生成不含產品本體的完整情境圖並保留乾淨產品合成區，絕對不要虛構一個產品代替。

小老闆只使用官網 images/brand/approved-v405/ 同款柔和立體Q版造型：圓臉、大而圓的深棕色眼睛、短黑髮、米白中式上衣、深綠圍裙、胸前紅色直式「仙加味」印章；姿勢可依情境自由變化，但臉型、髮型、服裝與畫風不可改。人物頭、頭髮、雙手、雙腳與手持物都必須完整，不可裁切，四周至少保留約8%安全空間。小鹿與小烏龜不是每張強制出現；需要夥伴時才加入，且必須是分開的獨立角色、同一Q版質感。河馬娃娃與小鹿安撫巾只在適合的居家陪伴情境使用。

生成順序固定：先鎖定文案主題與產品 → 判斷季節／天氣／場合／地點／環境／冷熱／表情／動作 → 生成背景與角色 → 必要時合成正式產品原圖 → 做16項圖文一致性檢查 → 只作候選、回待審核。季節、天氣、場合、地點、情境、環境、冷熱、表情、動作必須互相一致。`;

  async function currentRules(){
    const response=await fetch('public-product-master.json?t='+Date.now(),{cache:'no-store'});
    if(!response.ok)throw new Error('無法取得目前公開產品母資料');
    const master=await response.json();
    const products=master.products||[],ids=products.map(product=>product.id);
    if(master.authority!=='user-confirmed-current'||!ids.length||master.productCount!==ids.length||ids.some(id=>!id)||new Set(ids).size!==ids.length||ids.includes('qixuan-guilu-drink-powder'))throw new Error('目前公開產品母資料不一致');
    const facts=products.map(product=>`${product.id}：${product.name}｜${product.specification}；${(product.usage||[]).join('；')}${product.usageAdjustment?'；'+product.usageAdjustment:''}${product.usageTiming?'；'+product.usageTiming:''}${product.ingredients?.length?'；成分：'+product.ingredients.join('、'):''}`).join('\n');
    return `${BASE_RULES}\n\n最新正式公開產品清單（${products.length}項）：\n${facts}`;
  }
  function openCurrentPrompt(build){
    const popup=window.open('about:blank','_blank');
    if(popup)popup.opener=null;
    return currentRules().then(async rules=>{
      const prompt=await build(rules),url='https://chatgpt.com/?q='+encodeURIComponent(prompt);
      if(popup)popup.location.replace(url);else location.assign(url);
    }).catch(error=>{if(popup)popup.close();alert(error.message+'，請稍後重試。');});
  }
  let runtimePostsPromise=null;
  const escText=(node)=>node?.textContent?.trim()||'';
  const postInfo=(card)=>({id:card?.dataset?.id||'',title:escText(card?.querySelector('h2')),copy:escText(card?.querySelector('.excerpt'))});
  async function runtimePosts(){
    if(runtimePostsPromise)return runtimePostsPromise;
    runtimePostsPromise=fetch(DATA_URL+'&t='+Date.now(),{cache:'no-store'}).then(async(response)=>{
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const data=await response.json();
      return Array.isArray(data?.posts)?data.posts:[];
    }).catch((error)=>{runtimePostsPromise=null;throw error;});
    return runtimePostsPromise;
  }
  async function findPost(id,button){
    try{
      const posts=await runtimePosts();
      const found=posts.find((post)=>post.id===id);
      if(found)return found;
    }catch{}
    const card=button?.closest('.post-card');
    if(card)return postInfo(card);
    const dialog=document.getElementById('postDialog');
    return{id,title:escText(dialog?.querySelector('h2')),copy:escText(dialog?.querySelector('.copy-box'))};
  }
  function copyPrompt(p,rules){return `請重新撰寫一篇仙加味社群貼文文案。\n\n原貼文ID：${p.id||''}\n原標題：${p.title||''}\n原文案：${p.copy||''}\n\n${rules}\n\n要求：保留原本主題與產品事實，但重新組織文字，繁體中文、自然、不誇張；不要虛構即時天氣或活動日期；若屬天氣／節慶即時內容，標示發布前需再確認。遇到30cc「瓶／瓶裝」舊字樣要自動校正成正式的「玻璃罐／罐」。只輸出：新標題、新正文、建議分類、圖片情境摘要。`}
  function imagePrompt(p,rules){return `請直接使用圖像生成能力，為這篇仙加味社群貼文產出一張「待審核候選主圖」，不要只回覆提示詞或製圖說明。\n\n貼文ID：${p.id||''}\n貼文標題：${p.title||''}\n貼文文案：${p.copy||''}\n分類：${p.category||''}\n季節：${p.season||'依文案判斷'}\n天氣：${p.weather||'依文案判斷'}\n場合：${p.occasion||'依文案判斷'}\n地點：${p.location||'依文案判斷'}\n既有圖片需求：${p.image_prompt||'依文案建立完全匹配的生活情境'}\n既有產品參照：${Array.isArray(p.product_refs)?p.product_refs.join('、'):(p.product_refs||'依文案判斷')}\n\n${rules}\n\n執行要求：\n1. 先判斷這篇是否真的需要產品出現在畫面；不需要就不要硬塞產品。\n2. 若需要產品，先明確辨識唯一產品ID與上方對應的products-v3正式原圖網址；若無法安全合成正式實拍，改做「不含產品本體、預留乾淨合成區」的完整情境候選圖，不得AI重畫產品。\n3. 若是「外出攜帶」且文案同時提到30cc與180cc，優先以30cc小玻璃罐作主產品情境；若兩產品同框，必須保留30cc明顯小罐感且不得猜測無依據的相對尺度。\n4. 任何30cc舊字樣「玻璃瓶／瓶裝／30cc／瓶」都要在圖中文字改為「30cc玻璃罐／30cc／罐（小玻璃罐）」。\n5. 只產出一張獨立1:1社群主圖，不要網站截圖、ERP畫面或儀表板。繁體中文短標題即可，不塞長文。\n6. 小老闆若出現必須完整不裁切，四周保留安全空間；表情、動作、季節、冷熱與環境要和文案一致。\n7. 生成結果只標記為 candidate／待審核，不視為已核准或已發布。`}
  function fullPrompt(p,rules){return `請把這篇仙加味貼文「文案＋圖片」整套重新生成，舊圖與舊文案都不要沿用。圖片部分請直接使用圖像生成能力產出一張待審核候選主圖，不要只回製圖指令。\n\n原貼文ID：${p.id||''}\n原標題：${p.title||''}\n原文案：${p.copy||''}\n分類：${p.category||''}\n季節：${p.season||'依文案判斷'}\n天氣：${p.weather||'依文案判斷'}\n場合：${p.occasion||'依文案判斷'}\n地點：${p.location||'依文案判斷'}\n\n${rules}\n\n文案要求：繁體中文、自然、保留原主題但重新組織；不要療效宣稱；不要虛構即時天氣／日期；30cc一律使用玻璃罐／罐，不得稱瓶。\n圖片要求：1:1社群主圖、繁體中文短標題；先判斷是否需要產品。產品需要出現時只能使用products-v3正式實拍等比例合成；無法安全合成就做產品留白版情境圖，AI不得重畫產品。小老闆完整不裁切，姿勢依文案；完成後只進待審核，不直接發布。\n\n文字回覆請附：新標題、新正文、16項圖文一致性自檢結果、使用的產品ID／正式圖片網址（若有）、候選圖狀態。`}
  function enhance(){
    document.querySelectorAll('.post-card').forEach(card=>{
      const actions=card.querySelector('.card-actions');
      if(!actions||actions.dataset.aiEnhanced==='1')return;
      actions.dataset.aiEnhanced='1';
      const copyBtn=document.createElement('button');copyBtn.type='button';copyBtn.className='button secondary small';copyBtn.textContent='文案不符合｜ChatGPT重生成';
      const allBtn=document.createElement('button');allBtn.type='button';allBtn.className='button orange small';allBtn.textContent='全部重新生成';
      copyBtn.addEventListener('click',()=>openCurrentPrompt(rules=>copyPrompt(postInfo(card),rules)));
      allBtn.addEventListener('click',()=>openCurrentPrompt(async rules=>fullPrompt(await findPost(card.dataset.id,allBtn),rules)));
      actions.append(copyBtn,allBtn);
    });
  }
  document.addEventListener('click',async(event)=>{
    const button=event.target.closest?.('[data-chatgpt]');
    if(!button)return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const id=button.dataset.chatgpt||button.closest('.post-card')?.dataset?.id||'';
    openCurrentPrompt(async rules=>imagePrompt(await findPost(id,button),rules));
  },true);
  new MutationObserver(enhance).observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();


