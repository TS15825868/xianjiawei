"use strict";

/* 仙加味小老闆正式情境圖配置｜2026-08-12 mobile-visual-fix-v5
 * 只在內容完全符合且不含重畫產品的輔助位置放核准 Q 版角色。
 * 絕不插入產品主圖、產品卡、Modal、DM，也不再使用含生成式產品拼圖的 contact-line/home-brand 等舊圖。
 * 怎麼選／FAQ 改用歷史已核准的 1448×1086 高解析母圖，避免手機放大時模糊。
 */
(function(){
  if(window.__XJW_MASCOT_PLACEMENT_20260812__)return;
  window.__XJW_MASCOT_PLACEMENT_20260812__=true;

  const VERSION='20260812-mobile-visual-fix-v5';
  const HD='images/brand/hd-v20260812/';
  const ASSETS=Object.freeze({
    choose:`${HD}choose.jpg?v=${VERSION}`,
    faq:`${HD}faq.png?v=${VERSION}`
  });
  const RETIRED_VISIBLE=Object.freeze([
    'images/brand/approved-v405/contact-line.webp',
    'images/brand/approved-v405/home-brand.webp',
    'images/brand/approved-v405/products-all.webp',
    'images/brand/approved-v405/combo.webp',
    'images/brand/approved-v405/guide-how-to-use.webp'
  ]);

  function makeFigure(src,alt,role){
    const figure=document.createElement('figure');
    figure.className='xjw-mascot-context reveal';
    figure.dataset.xjwMascot=role;
    figure.setAttribute('aria-label',alt);
    const img=document.createElement('img');
    img.src=src;
    img.alt=alt;
    img.loading='lazy';
    img.decoding='async';
    img.dataset.xjwApprovedMascot='approved-hd-v20260812-safe-no-product-redraw';
    img.dataset.xjwImageQuality='original-1448x1086-no-css-upscale';
    figure.appendChild(img);
    return figure;
  }

  function insertAfterHero(src,alt,role){
    if(document.querySelector(`[data-xjw-mascot="${role}"]`))return;
    const hero=document.querySelector('main > .hero, main .hero');
    if(!hero)return;
    const section=document.createElement('section');
    section.className='section section--narrow xjw-mascot-section';
    section.dataset.xjwMascot=role;
    section.appendChild(makeFigure(src,alt,`${role}-figure`));
    hero.insertAdjacentElement('afterend',section);
  }

  function retireOldInjectedMascots(){
    document.querySelectorAll('.xjw-mascot-context img, .xjw-mascot-section img').forEach(img=>{
      const src=String(img.getAttribute('src')||'').split('?')[0];
      if(RETIRED_VISIBLE.some(path=>src.endsWith(path))){
        const wrapper=img.closest('.xjw-mascot-section, .xjw-mascot-context');
        if(wrapper)wrapper.remove();
      }
    });
    document.querySelectorAll('[data-xjw-mascot="home-line"], [data-xjw-mascot="contact"], [data-xjw-mascot="contact-figure"]').forEach(node=>node.remove());
  }

  function apply(){
    retireOldInjectedMascots();
    const page=String(document.body?.dataset?.page||'').trim();
    if(page==='choose')insertAfterHero(ASSETS.choose,'仙加味 Q 版小老闆陪你整理產品怎麼選','choose');
    if(page==='faq')insertAfterHero(ASSETS.faq,'仙加味 Q 版小老闆陪你查看常見問題','faq');
    /* guide 的舊「怎麼使用」情境圖含非正式產品形象，本版不重新放回；正確產品身份優先於裝飾。 */
    /* home/contact 暫不放角色圖：既有 contact-line 圖含重畫產品，正確性優先於裝飾。 */
    /* trial 頁本身固定使用 trial-small-boss 正式試喝主圖，不再疊加其他角色圖。 */
  }

  function start(){apply();new MutationObserver(apply).observe(document.documentElement,{subtree:true,childList:true});}
  window.XJWMascotPlacement=Object.freeze({version:VERSION,assets:ASSETS,retiredVisible:RETIRED_VISIBLE,apply});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
