(()=>{
  const HOLD_IDS=new Set(Array.from({length:11},(_,i)=>`XJW-TRIAL-${String(i+2).padStart(3,'0')}`));
  function enhance(){
    document.querySelectorAll('.post-card').forEach(card=>{
      const id=card.dataset.id||'';if(!HOLD_IDS.has(id))return;
      const body=card.querySelector('.card-body');if(!body)return;
      let note=card.querySelector('[data-campaign-hold-note]');
      if(!note){note=document.createElement('div');note.dataset.campaignHoldNote='1';note.className='review-note warning';const actions=card.querySelector('.card-actions');body.insertBefore(note,actions||null)}
      note.textContent='試喝活動暫緩：最終主圖已發布，為避免重複，此變體暫緩至 2026-11-06；到期後仍需人工重審。';
      const badge=card.querySelector('.image-state');if(badge)badge.textContent='活動暫緩';
      card.querySelectorAll('[data-approve],[data-now],[data-published],[data-chatgpt]').forEach(b=>{b.disabled=true;b.title='試喝活動暫緩至2026-11-06'});
    });
  }
  new MutationObserver(enhance).observe(document.documentElement,{subtree:true,childList:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
})();
