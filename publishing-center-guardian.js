(()=>{
  const BLOCK=[
    ['公司資訊',['台興山產有限公司','統一編號','公司電話','公司地址']],
    ['30cc名稱',['龜鹿飲30cc玻璃瓶','30cc／瓶','小玻璃瓶','30cc瓶裝','30cc 瓶裝','玻璃瓶裝']],
    ['療效宣稱',['治療','治癒','保證改善','療效','藥到病除']]
  ];
  const LIVE=['颱風','寒流','高溫','空氣品質','午後雷陣雨'];
  const GUARD_BLOCKING=false;
  const PUBLISHING_URL='https://xianjiawei-internal.tung314069.workers.dev/publishing.html';
  const CURRENT='/images/customer-display-v20260812/';
  const TRIAL='trial-small-boss.webp';
  function text(card){return `${card.querySelector('h2')?.textContent||''} ${card.querySelector('.excerpt')?.textContent||''}`}
  function imageUrls(card){
    const urls=[];
    card.querySelectorAll('img[src],source[srcset],a[href]').forEach(node=>{const raw=node.getAttribute('src')||node.getAttribute('srcset')||node.getAttribute('href')||'';if(raw)urls.push(raw);});
    return urls;
  }
  function unauthorizedSoupWeights(value=''){
    const source=String(value||''),labels=['龜鹿湯塊','龜鹿膠','龜鹿膏','鹿茸粉'],errors=[];
    const re=/(?<!\d)(\d+(?:\.\d+)?)\s*g/gi;let match;
    while((match=re.exec(source))){const number=Number(match[1]);if(!Number.isFinite(number)||number<50)continue;const before=source.slice(Math.max(0,match.index-80),match.index);let pos=-1,label='';for(const candidate of labels){const p=before.lastIndexOf(candidate);if(p>pos){pos=p;label=candidate}}if(label==='龜鹿湯塊'&&Math.abs(number-75)>0.001)errors.push(`龜鹿湯塊只能使用75g／盒，目前出現${match[0]}`);}
    return errors;
  }
  function imageErrors(card,t=''){
    const urls=imageUrls(card),errors=[];
    for(const url of urls){
      if(/\/images\/products-v2\//i.test(url))errors.push('圖片：仍引用已退役舊產品圖');
      if(/legacy/i.test(url))errors.push('圖片：仍引用歷史／退役素材');
      if(/products-v4-final/i.test(url))errors.push('圖片：仍引用已退役的簡單顧客產品圖層，顧客端應改用目前正式DM／正式視覺');
    }
    const isTrial=/試喝|3\s*罐.*免費|先試喝/.test(t);
    if(isTrial&&urls.length&&!urls.some(url=>url.includes(`${CURRENT}${TRIAL}`)))errors.push('試喝圖片：必須使用目前核准 trial-small-boss 小老闆正式主圖');
    if(/30\s*cc/i.test(t)){
      const known=urls.filter(url=>/guilu-drink-30|30cc/i.test(url));
      if(known.some(url=>/products-v[234]|dm-final/i.test(url)))errors.push('30cc顧客圖：不可再以簡單原圖／舊DM當主要視覺；請使用目前正式DM主視覺');
    }
    if(/180\s*cc/i.test(t)){
      const known=urls.filter(url=>/guilu-drink-180|180cc/i.test(url));
      if(known.some(url=>/products-v[234]|dm-final/i.test(url)))errors.push('180cc顧客圖：不可再以簡單原圖／舊DM當主要視覺；請使用目前正式DM主視覺');
    }
    return errors;
  }
  function scan(card){
    const t=text(card),errors=[],notes=[];
    for(const [label,terms] of BLOCK){const hit=terms.find(x=>t.includes(x));if(hit)errors.push(`${label}：發現「${hit}」`)}
    errors.push(...unauthorizedSoupWeights(t));errors.push(...imageErrors(card,t));
    const imageState=card.querySelector('.image-state')?.textContent?.trim()||'';
    if(/needs|待生成|需重生成|replace-required/i.test(imageState))errors.push('圖片：此篇已列入重新生成／更換清單');
    if(t.includes('30cc'))notes.push('30cc產品型貼文使用六張正式產品圖；詳細DM只在DM用途使用；試喝文只用trial-small-boss。產品本體必須是小玻璃裸罐、無貼紙、比例不變。');
    if(t.includes('180cc'))notes.push('180cc產品型貼文使用六張正式產品圖；詳細DM只在DM用途使用；試喝圖獨立。產品本體必須維持鋁袋，不改袋型與比例。');
    if(t.includes('龜鹿膏'))notes.push('龜鹿膏100g維持自己的正式DM；產品罐型、標籤與比例不得改。');
    if(t.includes('龜鹿湯塊'))notes.push('龜鹿湯塊只有75g／盒、8塊裝；維持自己的正式DM。');
    if(t.includes('龜鹿膠'))notes.push('龜鹿膠600g／盒、32塊裝；維持自己的正式DM，不可與龜鹿湯塊互換。');
    if(t.includes('鹿茸粉'))notes.push('鹿茸粉75g／罐；維持自己的正式DM。');
    if(LIVE.some(x=>t.includes(x)))notes.push('此貼文含即時天氣／事件字詞，發布前必須重新確認當日資訊。');
    return{errors:[...new Set(errors)],notes};
  }
  function labelPageRole(){
    document.title='仙加味｜貼文候選審核中心';
    const h1=document.querySelector('.topbar h1');if(h1)h1.textContent='貼文候選審核中心';
    const eyebrow=document.querySelector('.topbar .eyebrow');if(eyebrow)eyebrow.textContent='仙加味・內容候選庫';
    const subtitle=document.querySelector('.topbar .subtitle');if(subtitle)subtitle.textContent='查看候選文案與圖片、完成16項檢查；正式審核、排程、立即發布與平台結果統一進獨立貼文發佈系統。';
    document.querySelectorAll('.topbar a').forEach(link=>{if(String(link.href||'').includes('xianjiawei-internal.tung314069.workers.dev')){link.href=PUBLISHING_URL;link.textContent='前往獨立貼文發佈系統'}});
  }
  function enhance(){
    labelPageRole();
    document.querySelectorAll('.post-card').forEach(card=>{
      let box=card.querySelector('[data-brand-guardian]');if(!box){box=document.createElement('div');box.dataset.brandGuardian='1';box.className='review-note';const body=card.querySelector('.card-body');body?.insertBefore(box,body.querySelector('.card-actions'))}
      const result=scan(card),approve=card.querySelector('[data-approve]');
      if(result.errors.length){box.className='review-note warning';box.textContent=`AI規格檢查提醒：${result.errors.join('；')}。目前守門員維持提示模式，請人工檢查或用ChatGPT重生成後再決定是否核准。`;if(approve&&GUARD_BLOCKING){approve.disabled=true;approve.title='先完成修正'}}
      else{box.className='review-note';box.textContent=`AI規格文字／圖源預檢通過。${result.notes.length?' '+result.notes.join(' '):' 圖片仍需完成16項人工檢查。'}`;}
    });
  }
  new MutationObserver(enhance).observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();