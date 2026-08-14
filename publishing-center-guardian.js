(()=>{
  const BLOCK=[
    {label:'品牌名稱',terms:['台興山產・仙加味','台興山產有限公司','台興山產'],message:'品牌名稱：發現已停用舊稱，對外內容只使用「仙加味」'},
    {label:'公司資訊',terms:['統一編號','公司電話','公司地址'],message:'公司資訊：一般消費者內容不主動顯示公司／商號資料'},
    {label:'30cc名稱',terms:['龜鹿飲30cc玻璃瓶','30cc／瓶','小玻璃瓶','30cc瓶裝','30cc 瓶裝','玻璃瓶裝'],message:'30cc名稱：正式名稱為龜鹿飲30cc玻璃罐，單位使用30cc／罐'},
    {label:'療效宣稱',terms:['治療','治癒','療效','改善疾病','預防疾病','保證功效','保證改善','藥到病除','關節','卡卡','疲勞','精神不濟','補氣','生津','膠原蛋白','鈣質'],message:'對外文案：發現不適合食品公開內容的功效／健康宣稱，請改回飲食文化、產品型態、原料、工序、料理或一般使用情境'},
    {label:'已停用文案',terms:['不是每個人都一定需要'],message:'文案方向：此定位句已停用，請改用正向的生活方式、文化或產品型態敘事'}
  ];
  const LIVE=['颱風','寒流','高溫','空氣品質','午後雷陣雨'];
  const GUARD_BLOCKING=false;
  const PUBLISHING_URL='https://xianjiawei-internal.tung314069.workers.dev/publishing.html';
  const PRODUCT=Object.freeze({
    drink30:'images/customer-display-v20260812/guilu-drink-30cc.avif',
    drink180:'images/customer-display-v20260812/guilu-drink-180cc-product.jpg'
  });
  const DM=Object.freeze({
    drink30:'images/dm-final/02_guilu-drink-30cc-dm-official-v20260814.jpg',
    drink180:'images/dm-approved-v20260810/guilu-drink-180cc.webp'
  });
  const RETIRED_TRIAL=[
    'trial.webp','trial-clean-v4.svg','trial-small-boss.webp','trial-small-boss.jpg','trial-small-boss.png','guilu-drink-trial.webp','guilu-drink-trial.png'
  ];
  const TRIAL_POSTER='images/trial/trial-poster-small-boss-official-v20260814.jpg';

  function text(card){return `${card.querySelector('h2')?.textContent||''} ${card.querySelector('.excerpt')?.textContent||''}`}
  function imageUrls(card){
    const urls=[];
    card.querySelectorAll('img[src],source[srcset],a[href]').forEach(node=>{
      const raw=node.getAttribute('src')||node.getAttribute('srcset')||node.getAttribute('href')||'';
      if(raw)urls.push(raw);
    });
    return urls;
  }
  function unauthorizedSoupWeights(value=''){
    const source=String(value||''),labels=['龜鹿湯塊','龜鹿膠','龜鹿膏','鹿茸粉'],errors=[];
    const re=/(?<!\d)(\d+(?:\.\d+)?)\s*g/gi;let match;
    while((match=re.exec(source))){
      const number=Number(match[1]);if(!Number.isFinite(number)||number<50)continue;
      const before=source.slice(Math.max(0,match.index-80),match.index);let pos=-1,label='';
      for(const candidate of labels){const p=before.lastIndexOf(candidate);if(p>pos){pos=p;label=candidate}}
      if(label==='龜鹿湯塊'&&Math.abs(number-75)>0.001)errors.push(`龜鹿湯塊只能使用75g／盒，目前出現${match[0]}`);
      if(label==='龜鹿膠'&&Math.abs(number-600)>0.001)errors.push(`龜鹿膠主規格只能使用600g（1斤）／盒，目前出現${match[0]}`);
    }
    return errors;
  }
  function isDmIntent(t=''){return /\bDM\b|詳細DM|產品DM|DM版位|DM貼文/i.test(String(t||''));}
  function includesPath(urls,path){return urls.some(url=>String(url||'').includes(path));}
  function imageErrors(card,t=''){
    const urls=imageUrls(card),errors=[],dmIntent=isDmIntent(t);
    for(const url of urls){
      if(/legacy/i.test(url))errors.push('圖片：仍引用歷史／退役素材');
      if(/products-v4-final/i.test(url))errors.push('圖片：仍引用已退役產品圖層');
      if(RETIRED_TRIAL.some(name=>String(url).includes(name)))errors.push('試喝圖片：引用已退役或已知花圖素材，禁止再使用');
      if(/customer-display-v20260812\/guilu-drink-180cc\.jpg/i.test(url))errors.push('180cc圖片：這是錯誤角色的DM海報別名，禁止當產品主圖');
    }

    const isTrial=/試喝|3\s*罐.*免費|先試喝/.test(t);
    if(isTrial&&urls.some(url=>RETIRED_TRIAL.some(name=>String(url).includes(name))))errors.push('試喝內容：不得恢復舊trial-small-boss或trial別名');

    if(/30\s*cc/i.test(t)){
      if(dmIntent){
        if(urls.length&&!includesPath(urls,DM.drink30))errors.push('30cc DM用途：應使用目前核准30cc詳細DM，不可拿產品主圖替代DM');
      }else if(urls.some(url=>/guilu-drink-30|30cc/i.test(String(url)))&&!includesPath(urls,PRODUCT.drink30)){
        errors.push('30cc產品用途：應使用正式30cc產品主圖；詳細DM只供DM用途');
      }
    }
    if(/180\s*cc/i.test(t)){
      if(dmIntent){
        if(urls.length&&!includesPath(urls,DM.drink180))errors.push('180cc DM用途：應使用目前核准180cc詳細DM');
      }else if(urls.some(url=>/guilu-drink-180|180cc/i.test(String(url)))&&!includesPath(urls,PRODUCT.drink180)){
        errors.push('180cc產品用途：必須使用正式高清鋁袋產品圖，不得拿DM海報替代');
      }
    }
    return errors;
  }
  function isGuiluKnowledgeTopic(t=''){
    return /龜鹿入門|龜鹿文化|為什麼.*龜鹿|為何.*龜鹿|認識龜鹿|龜鹿.*日常/.test(String(t||''));
  }
  function scan(card){
    const t=text(card),errors=[],notes=[];
    for(const rule of BLOCK){if(rule.terms.some(term=>t.includes(term)))errors.push(rule.message)}
    errors.push(...unauthorizedSoupWeights(t));
    errors.push(...imageErrors(card,t));
    const imageState=card.querySelector('.image-state')?.textContent?.trim()||'';
    if(/needs|待生成|需重生成|replace-required/i.test(imageState))errors.push('圖片：此篇已列入重新生成／更換清單');

    if(isGuiluKnowledgeTopic(t))notes.push('龜鹿入門主題可使用：飲食文化、產品型態、生活情境、原料與工序、料理搭配、一般使用方式；避免把疾病、症狀或健康結果當成食用理由。');
    if(t.includes('30cc'))notes.push('30cc產品用途使用正式小玻璃裸罐主圖；詳細DM只在明確DM用途使用。');
    if(t.includes('180cc'))notes.push('180cc產品用途使用正式高清鋁袋主圖；詳細DM只在明確DM用途使用，兩者不可互換。');
    if(/試喝|先試喝/.test(t))notes.push(`官網試喝頁目前固定使用最新核准正式試喝海報 ${TRIAL_POSTER}；退役trial素材不得再使用，正式貼文圖仍需完成圖文一致檢查。`);
    if(t.includes('龜鹿膏'))notes.push('龜鹿膏100g維持正式產品圖與獨立詳細DM，產品罐型、標籤與比例不得改。');
    if(t.includes('龜鹿湯塊'))notes.push('龜鹿湯塊主規格75g／盒｜8塊裝；每塊約9.375g只屬詳細資料。');
    if(t.includes('龜鹿膠'))notes.push('龜鹿膠主規格600g（1斤）／盒｜32塊裝；每塊約18.75g只屬詳細資料。');
    if(t.includes('鹿茸粉'))notes.push('鹿茸粉75g／罐；維持正式產品圖與獨立詳細DM。');
    if(LIVE.some(x=>t.includes(x)))notes.push('此貼文含即時天氣／事件字詞，發布前必須重新確認當日資訊。');
    return{errors:[...new Set(errors)],notes:[...new Set(notes)]};
  }
  function labelPageRole(){
    document.title='仙加味｜貼文候選審核中心';
    const h1=document.querySelector('.topbar h1');if(h1)h1.textContent='貼文候選審核中心';
    const eyebrow=document.querySelector('.topbar .eyebrow');if(eyebrow)eyebrow.textContent='仙加味・內容候選庫';
    const subtitle=document.querySelector('.topbar .subtitle');if(subtitle)subtitle.textContent='查看候選文案與圖片、完成圖文與品牌檢查；正式審核、排程、立即發布與平台結果統一進獨立貼文發佈系統。';
    document.querySelectorAll('.topbar a').forEach(link=>{if(String(link.href||'').includes('xianjiawei-internal.tung314069.workers.dev')){link.href=PUBLISHING_URL;link.textContent='前往獨立貼文發佈系統'}});
  }
  function enhance(){
    labelPageRole();
    document.querySelectorAll('.post-card').forEach(card=>{
      let box=card.querySelector('[data-brand-guardian]');
      if(!box){box=document.createElement('div');box.dataset.brandGuardian='1';box.className='review-note';const body=card.querySelector('.card-body');body?.insertBefore(box,body.querySelector('.card-actions'))}
      const result=scan(card),approve=card.querySelector('[data-approve]');
      if(result.errors.length){
        box.className='review-note warning';
        box.textContent=`AI規格檢查提醒：${result.errors.join('；')}。目前守門員維持提示模式，請人工檢查或重新生成後再決定是否核准。`;
        if(approve&&GUARD_BLOCKING){approve.disabled=true;approve.title='先完成修正'}
      }else{
        box.className='review-note';
        box.textContent=`AI規格文字／圖源預檢通過。${result.notes.length?' '+result.notes.join(' '):' 圖片仍需完成人工圖文一致檢查。'}`;
      }
    });
  }
  window.XJWPublishingGuardian=Object.freeze({version:'20260814-v11-content-upgrade',blocking:GUARD_BLOCKING,product:PRODUCT,dm:DM,trialPoster:TRIAL_POSTER,retiredTrial:RETIRED_TRIAL,scan});
  new MutationObserver(enhance).observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();