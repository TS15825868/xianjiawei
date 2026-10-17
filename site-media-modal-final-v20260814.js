"use strict";
(()=>{
  const VERSION='20261015-unified-catalog-modal-v1';
  const BASE=location.pathname.includes('/xianjiawei/')?'/xianjiawei':'';
  const DM30=`${BASE}/images/dm-final/02_guilu-drink-30cc-dm-official-v20260814.jpg?v=${VERSION}`;
  const TRIAL=`${BASE}/images/trial/trial-poster-small-boss-official-v20260814.jpg?v=${VERSION}`;

  const cleanFile=value=>String(value||'').split('/').pop().split(/[?#]/)[0];
  const products=()=>{
    try{if(typeof SITE_DATA!=='undefined'&&Array.isArray(SITE_DATA?.products))return [...SITE_DATA.products,...(SITE_DATA.partnerProducts||[])];}catch(_){ }
    return Array.isArray(window.SITE_DATA?.products)?window.SITE_DATA.products:[];
  };
  const findProduct=href=>{
    const file=cleanFile(href);
    return products().find(product=>[product.page,product.detailPage].some(value=>cleanFile(value)===file));
  };
  const currentProduct=()=>findProduct(location.href);
  const findProductByCard=element=>{
    const card=element?.closest?.('[data-product-id],[data-fallback-product]');
    if(!card)return null;
    const id=card.dataset.productId||card.dataset.fallbackProduct;
    const matched=products().find(product=>product.id===id);
    if(matched)return matched;
    // 若動態商品目錄暫時無法讀取，既有經核准的 HTML 備援卡仍可使用同一跳窗。
    if(!card.dataset.fallbackProduct)return null;
    const anchor=card.querySelector('.product-card__actions a[href],.product-card__img a[href]');
    const href=anchor?.getAttribute('href')||'';
    const verified=href&&findProduct(href);
    if(verified)return verified;
    if(!/^product-[a-z0-9-]+\.html$/i.test(href))return null;
    const name=card.querySelector('h3')?.textContent?.trim()||'';
    const image=card.querySelector('.product-card__img img')?.getAttribute('src')||'';
    if(!name||!image)return null;
    return {id,name,displayName:name,image,page:href,
      size:card.querySelector('.muted')?.textContent?.replace(/^規格[：:]\s*/,'').trim()||'',
      category:card.querySelector('.eyebrow')?.textContent?.trim()||'',
      brandType:card.closest('#partner-brand-catalog')?'partner':'own',
      informationOnly:!!card.closest('#partner-brand-catalog')};
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
    if(rename){
      const product=findProduct(anchor.getAttribute('href')||'')||findProductByCard(anchor);
      const nearby=anchor.closest('article,.product-card,.trial-product-card')?.querySelector('h3')?.textContent?.trim();
      const existing=anchor.textContent.trim();
      const page=cleanFile(anchor.getAttribute('href')||'');
      const fallbackNames={
        'product-danshen-tea.html':'丹參茶包六款',
        'product-guilu-gao.html':'龜鹿膏',
        'product-guilu-drink-30cc.html':'龜鹿飲30cc玻璃罐',
        'product-guilu-drink-180cc.html':'龜鹿飲180cc鋁袋',
        'product-luerong-fen.html':'鹿茸粉'
      };
      const name=String(product?.displayName||product?.name||nearby||fallbackNames[page]||'').trim();
      const label=name?name+'｜查看介紹':(existing==='查看介紹'?'查看商品詳細資料':existing);
      // MutationObserver 會重跑標準化；內容未變時不可重建文字節點，否則手機點擊可能被中斷。
      if(existing!==label)anchor.textContent=label;
      if(anchor.getAttribute('aria-label')!==label)anchor.setAttribute('aria-label',label);
    }
    anchor.dataset.productIntro='1';
    anchor.setAttribute('aria-haspopup','dialog');
  }

  function normalizeProductDetailHero(){
    if(document.body?.dataset?.page!=='product-detail' || !document.getElementById('complete-info'))return;
    const button=document.querySelector('.product-detail-hero .hero-actions a[href="#complete-info"],.product-detail-hero .hero-actions a[data-product-intro-current="1"],.product-detail-hero .hero-actions a[data-product-intro="1"]');
    if(!button)return;
    // 已在詳細頁時，導向下方完整資訊；不得打開自己的跳窗。
    button.href='#complete-info';
    if(button.textContent!=='查看完整產品資訊')button.textContent='查看完整產品資訊';
    button.removeAttribute('data-product-intro');
    button.removeAttribute('data-product-intro-current');
    button.removeAttribute('aria-haspopup');
  }

  // 所有商品（包含茶包系列）進入統一跳窗；只有跳窗內「查看詳細」保留前往完整頁。

  function normalizeIntroActions(root=document){
    root.querySelectorAll('a[href*="product-"]').forEach(anchor=>{
      if(anchor.closest('.breadcrumb,#product-modal')){
        anchor.removeAttribute('data-product-intro');
        anchor.removeAttribute('aria-haspopup');
        return;
      }
      // 對外頁面的商品連結都先開跳窗；舊的直接詳細頁旗標不能跳過本規則。
      anchor.removeAttribute('data-product-page-direct');
      const isCurrentDetail=document.body?.dataset?.page==='product-detail'
        &&cleanFile(anchor.getAttribute('href'))===cleanFile(location.href);
      if(isCurrentDetail)return;
      const isButton=anchor.classList.contains('btn')||
        !!anchor.closest('.product-card__actions,.trial-product-card__actions,.hero-actions,.final-cta__actions');
      markIntro(anchor,{rename:isButton});
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
    // 捕捉階段也要放行系列頁及跳窗內連結，避免舊標記殘留造成重開跳窗。
    // 跳窗內的「查看詳細」是唯一完整商品頁入口，保持正常跳轉，不重開跳窗。
    if(target.closest('#product-modal') || target.dataset.productPageDirect === '1')return;
    openIntro(target,event);
  },true);

  // 未被動態資料取代的備援卡，點主圖、文字區與鍵盤 Enter/Space 也先進跳窗。
  document.addEventListener('click',event=>{
    if(event.target.closest('a,button,input,select,textarea'))return;
    const card=event.target.closest('.product-card[data-fallback-product]');
    if(card)openIntro(card,event);
  },true);
  document.addEventListener('keydown',event=>{
    if(!['Enter',' '].includes(event.key))return;
    const card=event.target.closest('.product-card[data-fallback-product]');
    if(!card||event.target!==card)return;
    event.preventDefault();
    openIntro(card,event);
  },true);

  function enforce(){
    fixDm();
    fixTrial();
    normalizeIntroActions();
    document.querySelectorAll('.product-card[data-fallback-product]').forEach(card=>{
      card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-haspopup','dialog');
      card.setAttribute('aria-label','開啟'+(card.querySelector('h3')?.textContent?.trim()||'商品')+'產品介紹跳窗');
    });
    document.documentElement.dataset.productIntroMode='unified-catalog-modal-v1';
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
