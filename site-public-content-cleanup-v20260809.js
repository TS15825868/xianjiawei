"use strict";

/* 公開官網顧客版內容清理：只處理顧客頁，不影響貼文審核中心／ERP。 */
(function(){
  if(window.__XJW_PUBLIC_CONTENT_CLEANUP__)return;
  window.__XJW_PUBLIC_CONTENT_CLEANUP__=true;
  const VERSION="20260809-public-clean-v3-no-redesign-dialogue";

  function removeUpdatedNotes(){
    document.querySelectorAll('.page-updated').forEach(el=>el.remove());
  }

  function removeTechnicalCards(){
    document.querySelectorAll('article.card,.card').forEach(card=>{
      const title=[...card.querySelectorAll('.eyebrow,h2,h3,strong')].map(n=>n.textContent.trim()).join(' ');
      const text=(card.textContent||'').replace(/\s+/g,' ').trim();
      const technicalTitle=/圖片規則|版本說明|更新說明|素材規則|開發說明|部署說明|機器可讀/.test(title);
      const technicalBody=/products-v\d|GitHub Web|AI重畫|核准原圖|實際尺寸鎖|不可拉寬|不可拉高|不得自行猜測尺寸|runtime|快取版本|catalog-public\.json|geo-data\.json|llms-full\.txt/.test(text);
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
      if(
        /^資料更新[:：]/.test(text)||
        /^內容版本[:：]?/.test(text)||
        /GitHub Web版已上線/.test(text)||
        /products-v\d.*(核准|正式原圖|比例)/.test(text)||
        /(catalog-public\.json|geo-data\.json|llms-full\.txt).*(為準|查閱|引用)/.test(text)
      )node.remove();
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

  function cleanKnowledgeCopy(){
    if(document.body?.dataset?.page!=='knowledge')return;
    const hero=document.querySelector('.hero__content > p:not(.eyebrow)');
    if(hero)hero.textContent='想了解產品、食材、使用方式、知識影音或資料來源，都可以從這裡開始。依主題切換閱讀，查找會更快。';
    document.querySelectorAll('[data-knowledge-panel="videos"] .section-heading p').forEach(p=>{
      if(/已改為|不自動播放|手機單欄|分類篩選/.test(p.textContent||''))p.textContent='依產品與主題分類查看公開影音；點擊內容後前往原平台觀看。';
    });
    const sourcePanel=document.querySelector('[data-knowledge-panel="sources"]');
    if(sourcePanel){
      const heading=sourcePanel.querySelector('.section-heading h2');
      const intro=sourcePanel.querySelector('.section-heading p:not(.eyebrow)');
      if(heading)heading.textContent='資料來源與引用方式';
      if(intro)intro.textContent='產品資訊以實際標示與現行規格為準；古籍與藥典資料用於理解名稱、文化背景與品質規範。';
    }
    document.querySelectorAll('a').forEach(a=>{
      if((a.textContent||'').trim()==='查看原食材百科資料')a.textContent='查看食材百科';
    });
  }

  function cleanVideoCopy(){
    if(document.body?.dataset?.page!=='video')return;
    const hero=document.querySelector('.hero__content > p:not(.eyebrow)');
    if(hero&&/改為精選大卡|手機使用單欄|不自動播放|分類篩選/.test(hero.textContent||'')){
      hero.textContent='依龜鹿系列、鹿茸系列與中醫師公開內容分類瀏覽，也可以用關鍵字快速找到想看的主題。';
    }
  }

  function run(){
    removeUpdatedNotes();
    removeTechnicalCards();
    removeImplementationParagraphs();
    cleanHomeCopy();
    cleanProductsCopy();
    cleanKnowledgeCopy();
    cleanVideoCopy();
    document.documentElement.dataset.publicContentVersion=VERSION;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
})();
