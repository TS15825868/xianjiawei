"use strict";

/* 仙加味全站穩定與公開內容收斂｜2026-08-14
 * 原則：公開內容永遠先可讀；Reveal 動畫失敗不能造成白屏。
 * 同步補上龜鹿入門導航，並確保消費者畫面只使用「仙加味」。
 */
(function(){
  if(window.__XJW_SITE_STABILITY_20260814__)return;
  window.__XJW_SITE_STABILITY_20260814__=true;

  const VERSION='20260814-content-navigation-v1';
  let recovering=false;

  function revealEverything(){
    document.querySelectorAll('.reveal').forEach(node=>{
      node.classList.add('show');
      node.style.opacity='1';
      node.style.transform='none';
      node.style.visibility='visible';
    });
    document.documentElement.dataset.xjwVisibility='ready';
  }

  function addLinkOnce(container,href,label,beforeSelector=''){
    if(!container||container.querySelector(`a[href="${href}"]`))return;
    const link=document.createElement('a');
    link.href=href;
    link.textContent=label;
    const before=beforeSelector?container.querySelector(beforeSelector):null;
    if(before)container.insertBefore(link,before);else container.appendChild(link);
  }

  function upgradeNavigation(){
    document.querySelectorAll('.menu-group').forEach(group=>{
      const heading=group.querySelector('h4');
      if(heading?.textContent?.trim()==='知識與品牌')addLinkOnce(group,'why-guilu.html','龜鹿入門','a[href="brand.html"]');
    });
    addLinkOnce(document.querySelector('.footer-nav-links'),'why-guilu.html','龜鹿入門','a[href="brand.html"]');
  }

  function polishHomeGuilu(){
    const title=document.getElementById('home-guilu-title');
    const heading=title?.closest('.section-heading');
    const copy=heading?.querySelector('p:last-child');
    if(copy)copy.textContent='從飲食文化、產品型態與生活方式認識龜鹿，再往下比較自己最順手的日常形式。';
  }

  function publicCopySafety(){
    if(!document.body||!document.createTreeWalker)return;
    const legacy=['台興山產・仙加味','台興山產有限公司','台興山產'];
    const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT),nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      if(node.parentElement?.closest('script,style,textarea,input'))continue;
      const current=String(node.nodeValue||'');
      let next=current;
      for(const oldName of legacy)next=next.replaceAll(oldName,'仙加味');
      next=next.replaceAll('不是每個人都一定需要','依生活方式了解適合自己的日常安排');
      if(next!==current)node.nodeValue=next;
    }
  }

  function finishPublicUi(){
    revealEverything();
    upgradeNavigation();
    polishHomeGuilu();
    publicCopySafety();
    document.documentElement.dataset.xjwPublicContent=VERSION;
  }

  async function recoverShell(){
    const header=document.getElementById('site-header');
    if(!header||header.children.length||recovering)return;
    if(typeof window.initSite!=='function')return;
    recovering=true;
    try{
      await window.initSite();
      document.documentElement.dataset.xjwShellRecovery='success';
    }catch(error){
      console.warn('仙加味共用介面復原失敗',error);
      document.documentElement.dataset.xjwShellRecovery='failed';
    }finally{
      recovering=false;
      finishPublicUi();
    }
  }

  function stabilize(){
    finishPublicUi();
    setTimeout(finishPublicUi,80);
    setTimeout(finishPublicUi,450);
    setTimeout(recoverShell,120);
  }

  window.addEventListener('error',()=>setTimeout(finishPublicUi,0));
  window.addEventListener('unhandledrejection',()=>setTimeout(finishPublicUi,0));
  window.addEventListener('pageshow',stabilize);

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',stabilize,{once:true});
  else stabilize();

  window.XJWSiteStability=Object.freeze({version:VERSION,revealEverything,upgradeNavigation,publicCopySafety,recoverShell});
})();
