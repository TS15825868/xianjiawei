"use strict";

/* 公開官網顧客版內容清理：只處理顧客頁，不影響發佈中心／ERP。 */
(function(){
  if(window.__XJW_PUBLIC_CONTENT_CLEANUP__)return;
  window.__XJW_PUBLIC_CONTENT_CLEANUP__=true;
  const VERSION="20260809-public-clean-v1";

  function removeUpdatedNotes(){
    document.querySelectorAll('.page-updated').forEach(el=>el.remove());
  }

  function removeTechnicalCards(){
    document.querySelectorAll('article.card,.card').forEach(card=>{
      const title=[...card.querySelectorAll('.eyebrow,h2,h3,strong')].map(n=>n.textContent.trim()).join(' ');
      const text=(card.textContent||'').replace(/\s+/g,' ').trim();
      const technicalTitle=/圖片規則|版本說明|更新說明|素材規則/.test(title);
      const technicalBody=/products-v\d|GitHub Web|AI重畫|核准原圖|實際尺寸鎖|不可拉寬|不可拉高|不得自行猜測尺寸/.test(text);
      if(technicalTitle&&technicalBody){
        const section=card.closest('section');
        if(section&&section.querySelectorAll('article.card,.card').length===1)section.remove();
        else card.remove();
      }
    });
  }

  function removeImplementationParagraphs(){
    document.querySelectorAll('p,small').forEach(node=>{
      const text=(node.textContent||'').replace(/\s+/g,' ').trim();
      if(/^資料更新[:：]/.test(text)||/GitHub Web版已上線/.test(text)||/products-v\d.*(核准|正式原圖|比例)/.test(text))node.remove();
    });
  }

  function cleanHomeCopy(){
    const row=document.querySelector('.home-trust-row');
    if(row){
      const labels=['六項產品資訊','使用方式整理','LINE 專人協助'];
      row.querySelectorAll('span').forEach((span,i)=>{if(labels[i])span.textContent=labels[i];});
      row.setAttribute('aria-label','官網重點');
    }
    document.querySelectorAll('.section-heading p').forEach(p=>{
      const text=(p.textContent||'').trim();
      if(/各自使用正式產品原圖等比例呈現/.test(text))p.textContent='從產品型態、容量與日常使用方式開始比較，找到比較順手的選擇。';
      if(/圖片只使用與文案情境相符的產品與場景/.test(text))p.textContent='熱飲、燉湯與家常料理分開整理，讓使用情境更容易理解。';
    });
  }

  function cleanProductsCopy(){
    if(document.body?.dataset?.page!=='products')return;
    const hero=document.querySelector('.hero__content > p:not(.eyebrow)');
    if(hero)hero.textContent='六項產品依型態、容量與使用方式整理，方便直接比較。官網以產品資訊為主；價格、活動、付款與配送請由官方 LINE 確認。';
  }

  function run(){
    removeUpdatedNotes();
    removeTechnicalCards();
    removeImplementationParagraphs();
    cleanHomeCopy();
    cleanProductsCopy();
    document.documentElement.dataset.publicContentVersion=VERSION;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
})();
