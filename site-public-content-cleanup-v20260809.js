"use strict";

/* 仙加味公開官網顧客內容守門｜2026-08-10
 * 只在公開官網執行，不影響 Cloudflare 內部貼文審核系統。
 * 原則：顧客只看到品牌、產品、使用、料理、知識、試喝與聯絡資訊；
 * repo、部署、runtime、快取、母庫、候選、審核等實作資訊不得出現在公開頁。
 */
(function(){
  if(window.__XJW_PUBLIC_CONTENT_CLEANUP__)return;
  window.__XJW_PUBLIC_CONTENT_CLEANUP__=true;
  const VERSION="20260810-public-clean-v7-customer-only";

  const HARD_INTERNAL=/(?:products-v\d|catalog-public\.json|geo-data\.json|llms(?:-full)?\.txt|\.github\/|github\b|cloudflare\b|workers?\b|wrangler\b|\bd1\b|render\b|supabase\b|\berp\b|runtime\b|cache(?:-?bust|\s*version)?|post-bank|母庫|候選圖?|候選狀態|核准原圖|部署(?:說明|版本|流程)?|開發說明|實作說明|機器可讀|內部系統版本)/i;
  const REVIEW_INTERNAL=/(?:待審核|已核准|16項審核|審核流程|重新生成流程|generation[_ -]?mode|image[_ -]?status|publish[_ -]?allowed|schedule[_ -]?enabled)/i;

  function removeUpdatedNotes(){
    document.querySelectorAll('.page-updated').forEach(el=>el.remove());
  }

  function textOf(node){return String(node?.textContent||'').replace(/\s+/g,' ').trim()}

  function removeWholeBlock(node){
    const card=node.closest('article.card,.card,.panel,.source-panel,.final-cta');
    if(card){
      const section=card.closest('section');
      if(section&&section.querySelectorAll('article.card,.card,.panel,.source-panel,.final-cta').length===1)section.remove();
      else card.remove();
      return;
    }
    node.remove();
  }

  function removeTechnicalCards(){
    document.querySelectorAll('article.card,.card,.panel,.source-panel').forEach(card=>{
      const title=[...card.querySelectorAll('.eyebrow,h2,h3,strong')].map(textOf).join(' ');
      const text=textOf(card);
      const technicalTitle=/圖片規則|版本說明|更新說明|素材規則|開發說明|部署說明|機器可讀|系統狀態|同步說明|審核說明/.test(title);
      if((technicalTitle&&(HARD_INTERNAL.test(text)||REVIEW_INTERNAL.test(text))) || (HARD_INTERNAL.test(title)&&HARD_INTERNAL.test(text))){
        removeWholeBlock(card);
      }
    });
  }

  function removeImplementationParagraphs(){
    document.querySelectorAll('p,small,li,code,pre,.eyebrow').forEach(node=>{
      const text=textOf(node);
      if(!text)return;
      const oldVersion=/^資料更新[:：]|^內容版本[:：]?|GitHub Web版已上線/i.test(text);
      const technical=HARD_INTERNAL.test(text)||REVIEW_INTERNAL.test(text);
      if(oldVersion||technical)removeWholeBlock(node);
    });
  }

  function removeTechnicalLinks(){
    document.querySelectorAll('a[href]').forEach(link=>{
      const href=String(link.getAttribute('href')||'');
      const text=textOf(link);
      if(/(?:github\.com|workers\.dev\/health|onrender\.com\/health|supabase\.co)/i.test(href) || HARD_INTERNAL.test(text)){
        const parent=link.closest('li');
        if(parent)parent.remove(); else link.remove();
      }
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
      const text=textOf(p);
      if(/各自使用正式產品原圖等比例呈現/.test(text))p.textContent='從產品型態、容量與日常使用方式開始比較，找到比較順手的選擇。';
      if(/圖片只使用與文案情境相符的產品與場景/.test(text))p.textContent='熱飲、燉湯與家常料理分開整理，讓使用情境更容易理解。';
    });
  }

  function guardBrandVisual(){
    if(document.body?.dataset?.page!=='brand-origin')return;
    const hero=document.querySelector('.brand-hero-v410__media img');
    if(!hero)return;
    const src=hero.getAttribute('src')||'';
    if(/approved-v405\/home-brand\.webp/i.test(src)){
      hero.src='images/logo.png?v=20260810-15';
      hero.alt='仙加味 Logo';
    }
    hero.style.objectFit='contain';
    hero.style.objectPosition='center center';
    hero.style.transform='none';
  }

  function cleanProductsCopy(){
    if(document.body?.dataset?.page!=='products')return;
    const hero=document.querySelector('.hero__content > p:not(.eyebrow)');
    if(hero)hero.textContent='六項產品依型態、容量與使用方式整理，方便直接比較。官網以產品資訊為主；價格、活動、付款與配送請由官方 LINE 確認。';
  }

  function cleanKnowledgeCopy(){
    if(document.body?.dataset?.page!=='knowledge'||!document.querySelector('.knowledge-page-v409'))return;
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
      if(textOf(a)==='查看原食材百科資料')a.textContent='查看食材百科';
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
    cleanHomeCopy();
    guardBrandVisual();
    cleanProductsCopy();
    cleanKnowledgeCopy();
    cleanVideoCopy();
    removeTechnicalCards();
    removeImplementationParagraphs();
    removeTechnicalLinks();
    document.documentElement.dataset.publicContentVersion=VERSION;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});
  else run();
})();