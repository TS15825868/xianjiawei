(()=>{
  const BASE_RULES=`品牌只顯示「仙加味」，不可出現台興山產有限公司、統編、公司電話或公司地址。文案以日常飲食、生活節奏、料理搭配為主，不談療效、不強迫推銷。固定標語可使用「補養，是一種節奏。」。正式產品只有六項、六個規格：龜鹿膏100g／罐；龜鹿飲30cc玻璃罐30cc／罐；龜鹿飲180cc鋁袋180cc／包；龜鹿湯塊75g／盒深藍盒、8塊裝、每塊約9.375g；龜鹿膠600g（1斤）／盒淡紫盒、32塊裝、每塊約18.75g；鹿茸粉75g／罐白色塑膠罐。不得自行新增產品規格。正式產品事實：龜鹿膏成分依序為鹿角萃取物、龜板萃取物、枸杞、紅棗、黃耆、粉光蔘；一般使用為每日早上及下午各一小匙，初次可先半匙，可直接取用或以約100～300mL熱水化開，避免接近睡前。龜鹿飲30cc與180cc成分依序為水、龜板萃取物、鹿角萃取物、粉光蔘、枸杞、紅棗、黃耆；30cc每日一罐、180cc每日一包，可溫熱飲用、避免冰飲。龜鹿湯塊與龜鹿膠成分依序為龜板萃取物、鹿角萃取物；鹿茸粉成分為鹿茸。沒有需要寫成分或用量時不要硬塞，但一旦寫到必須使用正式版本。龜鹿飲30cc為小玻璃裸罐、金色蓋、無貼紙、無外盒、無外袋；龜鹿飲180cc為狹長直立鋁袋，寬高比約0.64；龜鹿膏100g只使用目前新版米白標籤；龜鹿湯塊只使用75g深藍盒正式原圖；龜鹿膠600g淡紫盒不可橫向拉長且不可與湯塊互換；鹿茸粉只用75g白色塑膠罐正式原圖。產品本體只能使用正式原產品照片等比例合成，AI只生成背景、角色、道具與情境。小老闆固定官網Q版造型，小老闆出現時小鹿與小烏龜必須同時出現；河馬娃娃與小鹿安撫巾只在適合的居家陪伴情境使用。季節、天氣、場合、地點、情境、環境、冷熱、表情、動作必須互相一致。`;
  const escText=(node)=>node?.textContent?.trim()||'';
  const postInfo=(card)=>({id:card?.dataset?.id||'',title:escText(card?.querySelector('h2')),copy:escText(card?.querySelector('.excerpt'))});
  const open=(prompt)=>window.open('https://chatgpt.com/?q='+encodeURIComponent(prompt),'_blank','noopener');
  function copyPrompt(p){return `請重新撰寫一篇仙加味社群貼文文案。\n\n原貼文ID：${p.id}\n原標題：${p.title}\n原文案：${p.copy}\n\n${BASE_RULES}\n\n要求：保留原本主題與產品事實，但重新組織文字，繁體中文、自然、不誇張；不要虛構即時天氣或活動日期；若屬天氣／節慶即時內容，標示發布前需再確認。只輸出：新標題、新正文、建議分類、圖片情境摘要。`}
  function fullPrompt(p){return `請把這篇仙加味貼文「文案＋圖片」整套重新生成，舊圖與舊文案都不要沿用。\n\n原貼文ID：${p.id}\n原標題：${p.title}\n原文案：${p.copy}\n\n${BASE_RULES}\n\n圖片要求：1:1社群主圖、繁體中文短標題；產品只能使用正式原產品照片等比例合成，AI只生成背景、角色、道具與情境，不得重畫產品包裝；完成後先進待審核，不直接發布。\n\n請輸出：新標題、新正文、16項圖文一致性自檢結果、完整圖片生成指令。`}
  function enhance(){
    document.querySelectorAll('.post-card').forEach(card=>{
      const actions=card.querySelector('.card-actions');
      if(!actions||actions.dataset.aiEnhanced==='1')return;
      actions.dataset.aiEnhanced='1';
      const copyBtn=document.createElement('button');copyBtn.type='button';copyBtn.className='button secondary small';copyBtn.textContent='文案不符合｜ChatGPT重生成';
      const allBtn=document.createElement('button');allBtn.type='button';allBtn.className='button orange small';allBtn.textContent='全部重新生成';
      copyBtn.addEventListener('click',()=>open(copyPrompt(postInfo(card))));
      allBtn.addEventListener('click',()=>open(fullPrompt(postInfo(card))));
      actions.append(copyBtn,allBtn);
    });
  }
  new MutationObserver(enhance).observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();
