"use strict";

/* 仙加味全站穩定層｜2026-08-14
 * 原則：公開內容永遠先可讀；Reveal 動畫失敗不能造成白屏。
 * Safari pageshow / BFCache 回復時，若共用 shell 尚未建立，嘗試重新初始化一次。
 */
(function(){
  if(window.__XJW_SITE_STABILITY_20260814__)return;
  window.__XJW_SITE_STABILITY_20260814__=true;

  const VERSION='20260814-site-refresh-v4';
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
      revealEverything();
    }
  }

  function stabilize(){
    revealEverything();
    setTimeout(revealEverything,80);
    setTimeout(revealEverything,450);
    setTimeout(recoverShell,120);
  }

  window.addEventListener('error',()=>setTimeout(revealEverything,0));
  window.addEventListener('unhandledrejection',()=>setTimeout(revealEverything,0));
  window.addEventListener('pageshow',stabilize);

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',stabilize,{once:true});
  }else stabilize();

  window.XJWSiteStability=Object.freeze({version:VERSION,revealEverything,recoverShell});
})();
