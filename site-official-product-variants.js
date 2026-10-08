"use strict";

/* 仙加味正式產品規格顯示層 v6｜2026-08-14
 * 目前正式主規格：
 * 手機比較卡的製作／出貨資訊一律標為「出貨」。
 */
(function () {
  if (window.__XJW_OFFICIAL_VARIANTS_V6__) return;
  window.__XJW_OFFICIAL_VARIANTS_V6__ = true;

  const SPECS=Object.freeze({});
  const DESCRIPTIONS=Object.freeze({});
  const FULFILLMENT_PATTERN=/預先製作備貨|接單製作|工作天|現貨|安排出貨|製作加工/;

  function setSpec(element,spec,prefix='規格：'){
    if(!element||!spec)return;
    const value=`${prefix}${spec}`;
    if(element.textContent!==value)element.textContent=value;
    if(element.style.whiteSpace!=='normal')element.style.whiteSpace='normal';
    if(element.dataset.xjwOfficialSpec!==spec)element.dataset.xjwOfficialSpec=spec;
  }

  function normalizeProductCards(root=document){
    Object.entries(SPECS).forEach(([id,spec])=>{
      root.querySelectorAll?.(`[data-product-id="${id}"]`).forEach(card=>{
        const muted=Array.from(card.querySelectorAll('.muted')).find(item=>item.textContent.includes('規格'));
        setSpec(muted,spec);
        const description=Array.from(card.querySelectorAll('.product-card__body > p')).find(item=>!item.classList.contains('eyebrow')&&!item.classList.contains('muted')&&!item.classList.contains('product-purpose'));
        const copy=DESCRIPTIONS[id];
        if(description&&copy&&description.textContent!==copy)description.textContent=copy;
      });
    });
  }

  function productIdFromModal(modal){
    const title=modal.querySelector('#product-modal-title')?.textContent||'';
    return'';
  }

  function normalizeModal(root=document){
    const modal=root.querySelector?.('#product-modal')||document.getElementById('product-modal');
    if(!modal||!modal.classList.contains('show'))return;
    const id=productIdFromModal(modal),spec=SPECS[id];
    if(!id||!spec)return;
    const muted=Array.from(modal.querySelectorAll('.modal-copy .muted')).find(item=>item.textContent.includes('規格'));
    setSpec(muted,spec);
    const description=modal.querySelector('.modal-copy > p:not(.eyebrow):not(.product-purpose):not(.muted)');
    if(description&&DESCRIPTIONS[id]&&description.textContent!==DESCRIPTIONS[id])description.textContent=DESCRIPTIONS[id];
  }

  function normalizeMobileCompare(root=document){
    root.querySelectorAll?.('.mobile-compare-card').forEach(card=>{
      const title=String(card.querySelector('h3')?.textContent||'');
      let id='';
      if(id){
        const specTerm=Array.from(card.querySelectorAll('dt')).find(item=>item.textContent.trim()==='規格');
        const spec=specTerm?.nextElementSibling;
        if(spec&&spec.tagName==='DD'&&spec.textContent!==SPECS[id])spec.textContent=SPECS[id];
      }
      card.querySelectorAll('dt').forEach(term=>{
        const value=term.nextElementSibling;
        if(!value||value.tagName!=='DD')return;
        if(FULFILLMENT_PATTERN.test(String(value.textContent||''))&&term.textContent!=='出貨'){
          term.textContent='出貨';
          term.dataset.xjwFulfillmentLabel='1';
        }
      });
    });
  }

  let queued=false;
  function normalizeAll(){queued=false;normalizeProductCards();normalizeModal();normalizeMobileCompare();}
  function queueNormalize(){if(queued)return;queued=true;requestAnimationFrame(normalizeAll);}
  const observer=new MutationObserver(queueNormalize);
  function start(){normalizeAll();observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});}

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.XJW_OFFICIAL_PRODUCT_VARIANTS=Object.freeze({version:'v6',specs:SPECS,fulfillmentLabel:'出貨'});
})();
