"use strict";
(()=>{
  const VERSION='20260814-dm-trial-modal-v1';
  const BASE=location.pathname.includes('/xianjiawei/')?'/xianjiawei':'';
  const DM30=`${BASE}/images/dm-final/02_guilu-drink-30cc-dm-v20260814.webp?v=${VERSION}`;
  const TRIAL=`${BASE}/images/trial/trial-poster-small-boss-v20260814.webp?v=${VERSION}`;

  const cleanFile=value=>String(value||'').split('/').pop().split(/[?#]/)[0];
  const products=()=>{
    try{
      if(typeof SITE_DATA!=='undefined' && Array.isArray(SITE_DATA?.products)) return SITE_DATA.products;
    }catch(_){ }
    return Array.isArray(window.SITE_DATA?.products)?window.SITE_DATA.products:[];
  };
  const findProduct=href=>{
    const file=cleanFile(href);
    return products().find(product=>[product.page,product.detailPage].some(value=>cleanFile(value)===file));
  };

  function fixDm(){
    if(document.body?.dataset?.page!=='dm') return;
    document.querySelectorAll('img').forEach(img=>{
      const scope=img.closest('article')||img.parentElement;
      const text=`${img.alt||''} ${scope?.textContent||''}`;
      if(/龜鹿飲\s*30\s*cc|30cc玻璃罐/i.test(text)){
        if(img.src!==new URL(DM30,location.href).href) img.src=DM30;
        img.removeAttribute('srcset');
        Object.assign(img.style,{width:'100%',height:'auto',maxWidth:'100%',maxHeight:'none',objectFit:'contain',objectPosition:'center',transform:'none'});
      }
    });
    document.documentElement.dataset.dm30Authority='user-approved-v20260814';
  }

  function fixTrial(){
    if(document.body?.dataset?.page!=='trial') return;
    const section=document.querySelector('[aria-labelledby="trial-visual-title"]');
    if(!section) return;
    let poster=section.querySelector('[data-official-trial-poster="20260814"]');
    if(!poster){
      section.querySelector('.trial-showcase,.trial-poster')?.remove();
      poster=document.createElement('figure');
      poster.className='trial-poster reveal is-visible';
      poster.dataset.officialTrialPoster='20260814';
      poster.innerHTML=`<img src="${TRIAL}" alt="仙加味龜鹿飲試喝組｜先試喝，再決定｜3罐試喝品免費、運費自付" fetchpriority="high" decoding="async">`;
      section.appendChild(poster);
    }
    const img=poster.querySelector('img');
    if(img){
      if(img.src!==new URL(TRIAL,location.href).href) img.src=TRIAL;
      img.removeAttribute('srcset');
      Object.assign(img.style,{display:'block',width:'100%',height:'auto',maxWidth:'100%',maxHeight:'none',objectFit:'contain',objectPosition:'center',transform:'none',filter:'none'});
    }
    Object.assign(poster.style,{maxWidth:'900px',margin:'0 auto',padding:'4px',background:'#fff',borderRadius:'20px',overflow:'hidden',boxShadow:'0 16px 40px rgba(33,24,16,.08)'});
    document.documentElement.dataset.trialMediaMode='official-poster-v20260814';
  }

  function simplifyProductActions(root=document){
    root.querySelectorAll('[data-quick-view="1"]').forEach(button=>{
      const actions=button.closest('.product-card__actions');
      if(actions && [...actions.querySelectorAll('a,button')].some(el=>/查看介紹/.test(el.textContent||''))) button.remove();
    });
  }

  function openIntro(anchor,event){
    const href=anchor.getAttribute('href')||'';
    const file=cleanFile(href);
    if(!/^product-[\w-]+\.html$/i.test(file)) return false;
    const product=findProduct(href);
    if(!product || typeof window.openProductModal!=='function') return false;
    event?.preventDefault();
    event?.stopPropagation();
    window.openProductModal(product,anchor);
    return true;
  }

  document.addEventListener('click',event=>{
    const anchor=event.target.closest('a');
    if(!anchor || !/查看介紹/.test(anchor.textContent||'')) return;
    openIntro(anchor,event);
  },true);

  function enforce(){
    fixDm();
    fixTrial();
    simplifyProductActions();
    document.documentElement.dataset.productIntroMode='modal-v20260814';
  }

  const observer=new MutationObserver(mutations=>{
    if(mutations.some(m=>m.type==='childList' || (m.type==='attributes' && ['src','srcset'].includes(m.attributeName)))) enforce();
  });
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{enforce();observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src','srcset']});});
  else {enforce();observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src','srcset']});}
  window.addEventListener('load',enforce,{once:true});
  window.XJWMediaModalFinal=Object.freeze({version:VERSION,dm30:DM30,trial:TRIAL});
})();