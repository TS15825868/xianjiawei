"use strict";
(()=>{
  const VERSION='20260930-main-dm-v13';
  const BASE=location.pathname.includes('/xianjiawei/')?'/xianjiawei':'';
  const DM30=`${BASE}/images/dm-final/02_guilu-drink-30cc-dm-official-v20260814.jpg?v=${VERSION}`;
  const TRIAL=`${BASE}/images/trial/trial-poster-small-boss-official-v20260814.jpg?v=${VERSION}`;

  const cleanFile=value=>String(value||'').split('/').pop().split(/[?#]/)[0];
  const products=()=>{
    try{if(typeof SITE_DATA!=='undefined'&&Array.isArray(SITE_DATA?.products))return SITE_DATA.products;}catch(_){ }
    return Array.isArray(window.SITE_DATA?.products)?window.SITE_DATA.products:[];
  };
  const findProduct=href=>{
    const file=cleanFile(href);
    return products().find(product=>[product.page,product.detailPage].some(value=>cleanFile(value)===file));
  };
  const currentProduct=()=>findProduct(location.href);
  const findProductByCard=element=>{
    const card=element?.closest?.('[data-product-id]');
    return card?products().find(product=>product.id===card.dataset.productId):null;
  };

  function fixDm(){
    if(document.body?.dataset?.page!=='dm')return;
    document.querySelectorAll('img').forEach(img=>{
      const scope=img.closest('article')||img.parentElement;
      const text=`${img.alt||''} ${scope?.textContent||''}`;
      if(/龜鹿飲\s*30\s*cc|30cc玻璃罐/i.test(text)){
        const target=new URL(DM30,location.href).href;
        if(img.src!==target)img.src=DM30;
        if(img.hasAttribute('srcset'))img.removeAttribute('srcset');
        Object.assign(img.style,{width:'100%',height:'auto',maxWidth:'100%',maxHeight:'none',objectFit:'contain',objectPosition:'center',transform:'none'});
      }
    });
    document.documentElement.dataset.dm30Authority='user-approved-v20260814';
  }

  function fixTrial(){
    if(document.body?.dataset?.page!=='trial')return;
    const section=document.querySelector('[aria-labelledby="trial-visual-title"]');
    if(!section)return;
    let poster=section.querySelector('[data-official-trial-poster="20260814"]');
    if(!poster){
      section.querySelector('.trial-showcase,.trial-poster')?.remove();
      poster=document.createElement('figure');
      poster.className='trial-poster reveal show';
      poster.dataset.officialTrialPoster='20260814';
      poster.innerHTML=`<img src="${TRIAL}" alt="仙加味龜鹿飲試喝組｜先試喝，再決定｜3罐試喝品免費、運費自付" fetchpriority="high" decoding="async">`;
      section.appendChild(poster);
    }
    const img=poster.querySelector('img');
    if(img){
      const target=new URL(TRIAL,location.href).href;
      if(img.src!==target)img.src=TRIAL;
      if(img.hasAttribute('srcset'))img.removeAttribute('srcset');
      Object.assign(img.style,{display:'block',width:'100%',height:'auto',maxWidth:'100%',maxHeight:'none',objectFit:'contain',objectPosition:'center',transform:'none',filter:'none'});
    }
    Object.assign(poster.style,{maxWidth:'900px',margin:'0 auto',padding:'4px',background:'#fff',borderRadius:'20px',overflow:'hidden',boxShadow:'0 16px 40px rgba(33,24,16,.08)'});
    document.documentElement.dataset.trialMediaMode='official-poster-v20260814';
  }

  function markIntro(anchor,{rename=true}={}){
    if(!anchor)return;
    if(rename)anchor.textContent='查看介紹';
    anchor.dataset.productIntro='1';
    anchor.setAttribute('aria-haspopup','dialog');
  }

  function normalizeProductDetailHero(){
    if(document.body?.dataset?.page!=='product-detail')return;
    const product=currentProduct();
    if(!product)return;
    const button=document.querySelector('.product-detail-hero .hero-actions a[href="#complete-info"],.product-detail-hero .hero-actions a[data-product-intro-current="1"]');
    if(button){
      button.href=product.page||product.detailPage||location.pathname;
      button.dataset.productIntroCurrent='1';
      markIntro(button,{rename:true});
    }
  }

  function normalizeIntroActions(root=document){
    root.querySelectorAll('a[href*="product-"]').forEach(anchor=>{
      if(anchor.closest('.breadcrumb'))return;
      const isButton=anchor.classList.contains('btn')||
        !!anchor.closest('.product-card__actions,.trial-product-card__actions,.hero-actions,.final-cta__actions');
      const isProductSurface=!!anchor.closest('.product-card,.trial-product-card,.home-product-showcase__grid');
      if(isButton)markIntro(anchor,{rename:true});
      else if(isProductSurface)markIntro(anchor,{rename:false});
    });
    root.querySelectorAll('[data-quick-view="1"]').forEach(button=>button.remove());
    normalizeProductDetailHero();
  }

  function fallbackToPage(element){
    const href=element?.getAttribute?.('href')||'';
    if(!href)return;
    try{window.location.assign(new URL(href,location.href).href);}catch{window.location.href=href;}
  }
  function openIntro(element,event){
    let product=null;
    if(element.matches?.('a[href]'))product=findProduct(element.getAttribute('href')||'');
    if(!product)product=findProductByCard(element);
    if(!product&&document.body?.dataset?.page==='product-detail')product=currentProduct();
    if(!product||typeof window.openProductModal!=='function')return false;
    try{
      event?.preventDefault();event?.stopPropagation();
      window.openProductModal(product,element);
      const modal=document.getElementById('product-modal');
      const body=document.getElementById('product-modal-body');
      if(!modal?.classList.contains('show')||!body?.children?.length)throw new Error('產品跳窗未成功建立');
      return true;
    }catch(error){
      console.warn('產品介紹跳窗失敗，改回產品頁。',error);
      try{window.closeModal?.();}catch(_){ }
      setTimeout(()=>fallbackToPage(element),0);
      return false;
    }
  }

  document.addEventListener('click',event=>{
    const target=event.target.closest('[data-product-intro="1"]');
    if(!target)return;
    openIntro(target,event);
  },true);

  function enforce(){
    fixDm();
    fixTrial();
    normalizeIntroActions();
    document.documentElement.dataset.productIntroMode='single-modal-v13';
  }
  let queued=false;
  const observer=new MutationObserver(mutations=>{
    if(!mutations.some(m=>m.type==='childList'||(m.type==='attributes'&&['src','srcset'].includes(m.attributeName))))return;
    if(queued)return;
    queued=true;requestAnimationFrame(()=>{queued=false;enforce();});
  });
  const start=()=>{enforce();observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['src','srcset']});};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  window.addEventListener('load',enforce,{once:true});
  window.XJWMediaModalFinal=Object.freeze({version:VERSION,dm30:DM30,trial:TRIAL});
})();
