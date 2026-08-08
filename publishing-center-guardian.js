(()=>{
  const BLOCK=[
    ['公司資訊',['台興山產有限公司','統一編號','公司電話','公司地址']],
    ['30cc名稱',['龜鹿飲30cc玻璃瓶','30cc／瓶','小玻璃瓶']],
    ['療效宣稱',['治療','治癒','保證改善','療效','藥到病除']]
  ];
  const LIVE=['颱風','寒流','高溫','空氣品質','午後雷陣雨'];
  const GUARD_BLOCKING=false;
  function text(card){return `${card.querySelector('h2')?.textContent||''} ${card.querySelector('.excerpt')?.textContent||''}`}
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
  function scan(card){
    const t=text(card),errors=[],notes=[];
    for(const [label,terms] of BLOCK){const hit=terms.find(x=>t.includes(x));if(hit)errors.push(`${label}：發現「${hit}」`)}
    errors.push(...unauthorizedSoupWeights(t));
    const imageState=card.querySelector('.image-state')?.textContent?.trim()||'';
    if(/needs|待生成|需重生成|replace-required/i.test(imageState))errors.push('圖片：此篇已列入重新生成／更換清單');
    if(t.includes('30cc'))notes.push('30cc圖片必須為裸罐、無貼紙、無外盒、無外袋、金色蓋，約42×51mm比例。');
    if(t.includes('180cc'))notes.push('180cc圖片必須為狹長鋁袋，寬高比約0.64，不可拉寬或加高。');
    if(t.includes('龜鹿膏'))notes.push('龜鹿膏只使用目前新版米白標籤，舊紅白直式貼紙禁止。');
    if(t.includes('龜鹿湯塊'))notes.push('龜鹿湯塊只有75g／盒深藍盒、8塊裝、每塊約9.375g。');
    if(t.includes('龜鹿膠'))notes.push('龜鹿膠600g淡紫盒需照正式原圖等比例，不可與龜鹿湯塊互換。');
    if(t.includes('鹿茸粉'))notes.push('鹿茸粉只使用75g白色塑膠罐正式原圖。');
    if(LIVE.some(x=>t.includes(x)))notes.push('此貼文含即時天氣／事件字詞，發布前必須重新確認當日資訊。');
    return{errors:[...new Set(errors)],notes};
  }
  function enhance(){
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
        box.textContent=`AI規格文字預檢通過。${result.notes.length?' '+result.notes.join(' '):' 圖片仍需完成16項人工檢查。'}`;
      }
    })
  }
  new MutationObserver(enhance).observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();
