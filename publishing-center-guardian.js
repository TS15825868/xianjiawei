(()=>{
  const BLOCK=[
    ['公司資訊',['台興山產有限公司','統一編號','公司電話','公司地址']],
    ['30cc名稱',['龜鹿飲30cc玻璃瓶','30cc／瓶','小玻璃瓶','30cc瓶裝','30cc 瓶裝','玻璃瓶裝']],
    ['療效宣稱',['治療','治癒','保證改善','療效','藥到病除']]
  ];
  const LIVE=['颱風','寒流','高溫','空氣品質','午後雷陣雨'];
  const GUARD_BLOCKING=false;
  const PUBLISHING_URL='https://xianjiawei-internal.tung314069.workers.dev/publishing.html';
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
    }
    return errors;
  }
  function imageErrors(card,t=''){
    const urls=imageUrls(card),errors=[];
    for(const url of urls){
      if(/\/images\/products-v2\//i.test(url))errors.push('圖片：仍引用舊產品圖，產品本體必須切到目前正式產品原圖');
      if(/\/images\/dm-final\//i.test(url)||/legacy/i.test(url))errors.push('圖片：仍引用舊DM／歷史產品圖，不可作正式產品本體');
    }
    if(/30\s*cc/i.test(t)){
      const productImages=urls.filter(url=>/guilu-drink-30|30cc/i.test(url));
      if(productImages.some(url=>!/\/images\/products-v3\/guilu-drink-30\.jpg/i.test(url)))errors.push('30cc圖片：產品本體必須使用目前正式小玻璃罐原圖');
    }
    if(/180\s*cc/i.test(t)){
      const productImages=urls.filter(url=>/guilu-drink-180|180cc/i.test(url));
      if(productImages.some(url=>!/\/images\/products-v3\/guilu-drink-180\.jpg/i.test(url)))errors.push('180cc圖片：產品本體必須使用目前正式鋁袋原圖');
    }
    return errors;
  }
  function scan(card){
    const t=text(card),errors=[],notes=[];
    for(const [label,terms] of BLOCK){const hit=terms.find(x=>t.includes(x));if(hit)errors.push(`${label}：發現「${hit}」`)}
    errors.push(...unauthorizedSoupWeights(t));
    errors.push(...imageErrors(card,t));
    const imageState=card.querySelector('.image-state')?.textContent?.trim()||'';
    if(/needs|待生成|需重生成|replace-required/i.test(imageState))errors.push('圖片：此篇已列入重新生成／更換清單');
    if(t.includes('30cc'))notes.push('30cc必須為小玻璃裸罐、無貼紙、金色蓋，約Ø42×H51mm；與100g罐同框時必須明顯更小，不得稱瓶。');
    if(t.includes('180cc'))notes.push('180cc必須為狹長直立鋁袋，寬高比約0.64，不可拉寬或誇張放大。');
    if(t.includes('龜鹿膏'))notes.push('龜鹿膏100g罐約51×78mm，只用目前正式原圖，標籤與罐型比例固定。');
    if(t.includes('龜鹿湯塊'))notes.push('龜鹿湯塊只有75g／盒深藍盒、8塊裝、每塊約9.375g；毫米尺寸未知時不得猜測。');
    if(t.includes('龜鹿膠'))notes.push('龜鹿膠600g淡紫盒需照正式原圖等比例，不可與龜鹿湯塊互換；毫米尺寸未知時不得猜測。');
    if(t.includes('鹿茸粉'))notes.push('鹿茸粉只使用75g白色正式罐原圖；毫米尺寸未知時不得猜測。');
    if(LIVE.some(x=>t.includes(x)))notes.push('此貼文含即時天氣／事件字詞，發布前必須重新確認當日資訊。');
    return{errors:[...new Set(errors)],notes};
  }
  function labelPageRole(){
    document.title='仙加味｜貼文候選審核中心';
    const h1=document.querySelector('.topbar h1');
    if(h1)h1.textContent='貼文候選審核中心';
    const eyebrow=document.querySelector('.topbar .eyebrow');
    if(eyebrow)eyebrow.textContent='仙加味・內容候選庫';
    const subtitle=document.querySelector('.topbar .subtitle');
    if(subtitle)subtitle.textContent='查看候選文案與圖片、完成16項檢查；正式審核、排程、立即發布與平台結果統一進獨立貼文發佈系統。';
    document.querySelectorAll('.topbar a').forEach(link=>{
      if(String(link.href||'').includes('xianjiawei-internal.tung314069.workers.dev')){link.href=PUBLISHING_URL;link.textContent='前往獨立貼文發佈系統'}
    });
  }
  function enhance(){
    labelPageRole();
    document.querySelectorAll('.post-card').forEach(card=>{
      let box=card.querySelector('[data-brand-guardian]');
      if(!box){box=document.createElement('div');box.dataset.brandGuardian='1';box.className='review-note';const body=card.querySelector('.card-body');body?.insertBefore(box,body.querySelector('.card-actions'))}
      const result=scan(card),approve=card.querySelector('[data-approve]');
      if(result.errors.length){
        box.className='review-note warning';
        box.textContent=`AI規格檢查提醒：${result.errors.join('；')}。目前守門員維持提示模式，請人工檢查或用ChatGPT重生成後再決定是否核准。`;
        if(approve&&GUARD_BLOCKING){approve.disabled=true;approve.title='先完成修正'}
      }else{
        box.className='review-note';
        box.textContent=`AI規格文字／圖源預檢通過。${result.notes.length?' '+result.notes.join(' '):' 圖片仍需完成16項人工檢查。'}`;
      }
    })
  }
  new MutationObserver(enhance).observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();
