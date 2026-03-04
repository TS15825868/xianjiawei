"use strict";
/* Web v7.9 — Unified Hamburger */
(function(){
  const btn=document.querySelector('.nav-toggle');
  const nav=document.querySelector('.site-nav');
  const overlay=document.querySelector('.nav-overlay');
  if(!btn || !nav || !overlay) return;

  const open=()=>{ nav.classList.add('open'); overlay.classList.add('open'); btn.setAttribute('aria-expanded','true'); document.body.style.overflow='hidden'; };
  const close=()=>{ nav.classList.remove('open'); overlay.classList.remove('open'); btn.setAttribute('aria-expanded','false'); document.body.style.overflow=''; };

  btn.addEventListener('click',(e)=>{ e.preventDefault(); nav.classList.contains('open') ? close() : open(); });
  overlay.addEventListener('click', close);
  nav.addEventListener('click',(e)=>{ const a=e.target.closest('a'); if(a && window.matchMedia('(max-width: 900px)').matches) close(); });
  window.addEventListener('keydown',(e)=>{ if(e.key==='Escape') close(); });
  window.addEventListener('scroll',()=>{ if(nav.classList.contains('open')) close(); },{passive:true});
})();
