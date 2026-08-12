"use strict";

/* 仙加味小老闆正式情境圖配置｜2026-08-12
 * 只在 CTA／FAQ／怎麼選／LINE／聯絡等輔助位置放核准 Q 版角色。
 * 絕不插入產品主圖、產品卡圖片、產品 Modal 或 DM 圖。
 */
(function(){
  if(window.__XJW_MASCOT_PLACEMENT_20260812__)return;
  window.__XJW_MASCOT_PLACEMENT_20260812__=true;

  const VERSION='20260812-formal-image-fix-v3';
  const BASE='images/brand/approved-v405/';
  const ASSETS=Object.freeze({
    homeLine:`${BASE}contact-line.webp?v=${VERSION}`,
    choose:`${BASE}choose.webp?v=${VERSION}`,
    faq:`${BASE}faq.webp?v=${VERSION}`,
    contact:`${BASE}contact-line.webp?v=${VERSION}`
  });

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
    img.dataset.xjwApprovedMascot='approved-v405';
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

  function placeHomeLine(){
    if(document.querySelector('[data-xjw-mascot="home-line"]'))return;
    const cta=document.querySelector('.home-final-cta');
    if(!cta)return;
    const figure=makeFigure(ASSETS.homeLine,'仙加味 Q 版小老闆陪你透過官方 LINE 詢問','home-line');
    cta.classList.add('xjw-cta-with-mascot');
    cta.insertBefore(figure,cta.firstChild);
  }

  function apply(){
    const page=String(document.body?.dataset?.page||'').trim();
    if(page==='home')placeHomeLine();
    if(page==='choose')insertAfterHero(ASSETS.choose,'仙加味 Q 版小老闆陪你整理產品怎麼選','choose');
    if(page==='faq')insertAfterHero(ASSETS.faq,'仙加味 Q 版小老闆陪你查看常見問題','faq');
    if(page==='contact')insertAfterHero(ASSETS.contact,'仙加味 Q 版小老闆與官方 LINE 聯絡情境','contact');
    /* trial 頁本身固定使用 trial-small-boss 正式試喝主圖，不再疊加其他角色圖。 */
  }

  function start(){apply();new MutationObserver(apply).observe(document.documentElement,{subtree:true,childList:true});}
  window.XJWMascotPlacement=Object.freeze({version:VERSION,assets:ASSETS,apply});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
