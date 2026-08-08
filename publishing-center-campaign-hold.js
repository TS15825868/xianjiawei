(()=>{
  const HOLD_IDS=new Set(Array.from({length:11},(_,i)=>`XJW-TRIAL-${String(i+2).padStart(3,'0')}`));
  function enhance(){
    document.querySelectorAll('.post-card').forEach(card=>{
      const id=card.dataset.id||'';if(!HOLD_IDS.has(id))return;
      const body=card.querySelector('.card-body');if(!body)return;
      let note=card.querySelector('[data-campaign-hold-note]');
      if(!note){note=document.createElement('div');note.dataset.campaignHoldNote='1';note.className='review-note warning';const actions=card.querySelector('.card-actions');body.insertBefore(note,actions||null)}
      note.textContent='試喝活動發布暫緩至 2026-11-06；圖片與文案仍可現在重新生成、換圖並留在待審核，不必等到期才製作。';
      const badge=card.querySelector('.image-state');if(badge&&/活動暫緩/.test(badge.textContent||''))badge.textContent='可重生成｜發布暫緩';
      card.querySelectorAll('[data-approve],[data-now],[data-published]').forEach(b=>{b.disabled=true;b.title='可先完成圖文製作；發布暫緩至2026-11-06'});
      card.querySelectorAll('[data-chatgpt]').forEach(b=>{b.disabled=false;b.removeAttribute('title')});
    });
  }
  new MutationObserver(enhance).observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();
