(()=>{
  const BLOCK=[
    ['公司資訊',['台興山產有限公司','統一編號','公司電話','公司地址']],
    ['30cc名稱',['龜鹿飲30cc玻璃瓶','30cc／瓶','小玻璃瓶']],
    ['已移除規格',['龜鹿湯塊150g','150g／盒']],
    ['療效宣稱',['治療','治癒','保證改善','療效','藥到病除']]
  ];
  const WARN=[
    ['即時資訊',['颱風','寒流','高溫','空氣品質','午後雷陣雨']],
    ['30cc裸罐',['30cc']],
    ['180cc比例',['180cc']],
    ['龜鹿膏新版標籤',['龜鹿膏']],
    ['龜鹿膠比例',['龜鹿膠']]
  ];
  function text(card){return `${card.querySelector('h2')?.textContent||''} ${card.querySelector('.excerpt')?.textContent||''}`}
  function scan(card){
    const t=text(card);const errors=[];const notes=[];
    for(const [label,terms] of BLOCK){const hit=terms.find(x=>t.includes(x));if(hit)errors.push(`${label}：發現「${hit}」`)}
    if(t.includes('30cc'))notes.push('30cc圖片必須為裸罐、無貼紙、無外盒、無外袋、金色蓋，約42×51mm比例。');
    if(t.includes('180cc'))notes.push('180cc圖片必須為狹長鋁袋，寬高比約0.64，不可拉寬或加高。');
    if(t.includes('龜鹿膏'))notes.push('龜鹿膏只使用目前新版米白標籤，舊紅白直式貼紙禁止。');
    if(t.includes('龜鹿膠'))notes.push('龜鹿膠淡紫盒需照正式原圖等比例，不可橫向拉長。');
    if(WARN[0][1].some(x=>t.includes(x)))notes.push('此貼文含即時天氣／事件字詞，發布前必須重新確認當日資訊。');
    return{errors,notes};
  }
  function enhance(){
    document.querySelectorAll('.post-card').forEach(card=>{
      let box=card.querySelector('[data-brand-guardian]');if(!box){box=document.createElement('div');box.dataset.brandGuardian='1';box.className='review-note';const body=card.querySelector('.card-body');body?.insertBefore(box,body.querySelector('.card-actions'))}
      const result=scan(card);const approve=card.querySelector('[data-approve]');
      if(result.errors.length){box.className='review-note warning';box.textContent=`品牌守門員阻擋：${result.errors.join('；')}`;if(approve){approve.disabled=true;approve.title='先修正品牌守門員錯誤'}}
      else{box.className='review-note';box.textContent=`品牌守門員：文字規格預檢通過。${result.notes.length?' '+result.notes.join(' '):' 圖片仍需完成16項人工檢查。'}`}
    })
  }
  new MutationObserver(enhance).observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();
