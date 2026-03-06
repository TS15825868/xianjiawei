'use strict';

/**
 * guilu-series page modal
 * - Product cards are clickable (no buttons inside cards)
 * - Modal shows sizes/specs and switches images per size
 * Data source: products.json
 */

(function(){
  const cards = Array.from(document.querySelectorAll('.card[data-series]'));
  const modal = document.getElementById('sModal');
  const overlay = document.getElementById('sModalOverlay');
  const closeBtn = document.getElementById('sModalClose');
  const body = document.getElementById('sModalBody');
  const titleEl = document.getElementById('sModalTitle');
  const bottom = document.getElementById('sModalBottom');

  if(!cards.length || !modal || !overlay || !closeBtn || !body || !titleEl || !bottom) return;

  let PRODUCTS = null;
  let currentCat = null;
  let currentItemId = null;

  function esc(s){ return String(s||'').replace(/[&<>"']/g, (c)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  function openModal(){
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    document.documentElement.classList.add('modal-open');
  }
  function closeModal(){
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    document.documentElement.classList.remove('modal-open');
  }

  function findCategory(catId){
    if(!PRODUCTS) return null;
    return (PRODUCTS.categories || []).find(c => c.id === catId) || null;
  }

  function itemById(cat, id){
    if(!cat) return null;
    return (cat.items||[]).find(i => i.id === id) || null;
  }

  function buildSizeSelector(cat){
    if(!cat || !cat.items || cat.items.length <= 1) return '';
    const btns = cat.items.map(it => {
      const active = (it.id === currentItemId) ? ' is-active' : '';
      const label = it.size || it.name || it.id;
      return `<button type="button" class="chip${active}" data-item="${esc(it.id)}">${esc(label)}</button>`;
    }).join('');
    return `<div class="modal-section">
      <div class="modal-label">規格</div>
      <div class="chips">${btns}</div>
    </div>`;
  }

  function buildBody(cat){
    const it = itemById(cat, currentItemId) || (cat.items||[])[0];
    if(!it) return;

    currentItemId = it.id;

    const img = (it.images && it.images[0]) ? it.images[0] : '';
    const highlights = (it.highlights||[]).slice(0,4).map(x=>`<li>${esc(x)}</li>`).join('');
    const suggest = (it.suggest||[]).slice(0,6).map(x=>`<li>${esc(x)}</li>`).join('');
    const notes = (it.notes||[]).slice(0,6).map(x=>`<li>${esc(x)}</li>`).join('');
    const specs = (it.specs||[]).slice(0,10).map(r=>`<tr><th>${esc(r.k)}</th><td>${esc(r.v)}</td></tr>`).join('');

    body.innerHTML = `
      <div class="modal-grid">
        <div class="modal-media">
          ${img ? `<img src="${esc(img)}" alt="${esc(it.name)}" loading="lazy" />` : ''}
        </div>
        <div class="modal-content">
          ${buildSizeSelector(cat)}
          ${highlights ? `<div class="modal-section">
              <div class="modal-label">簡介</div>
              <ul class="bullets">${highlights}</ul>
            </div>` : ''}
          ${suggest ? `<div class="modal-section">
              <div class="modal-label">建議使用方式</div>
              <ul class="bullets">${suggest}</ul>
            </div>` : ''}
          ${specs ? `<div class="modal-section">
              <div class="modal-label">規格資訊</div>
              <table class="spec-table">${specs}</table>
            </div>` : ''}
          ${notes ? `<div class="modal-section">
              <div class="modal-label">備註</div>
              <ul class="bullets">${notes}</ul>
            </div>` : ''}
        </div>
      </div>
    `;

    // bind chips
    body.querySelectorAll('button.chip[data-item]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.getAttribute('data-item');
        if(id && id !== currentItemId){
          currentItemId = id;
          buildBody(cat);
        }
      });
    });
  }

  function buildBottom(catId){
    // keep CTAs minimal (no forcing)
    const primaryMap = {
      gel: {label:'查看怎麼搭配', href:'guilu-howto-eat.html'},
      drink:{label:'查看使用方式', href:'guilu-eat.html'},
      block:{label:'查看食譜', href:'guilu-recipes.html'},
      powder:{label:'怎麼選擇', href:'choose.html'}
    };
    const p = primaryMap[catId] || {label:'查看內容', href:'products.html'};
    bottom.innerHTML = `
      <a class="btn ghost" href="${esc(p.href)}">${esc(p.label)}</a>
      <a class="btn" href="products.html?cat=${esc(catId)}">查看產品規格</a>
      <a class="btn line" href="https://lin.ee/sHZW7NkR" target="_blank" rel="noopener">LINE詢問</a>
    `;
  }

  async function ensureData(){
    if(PRODUCTS) return PRODUCTS;
    const res = await fetch('products.json', {cache:'no-store'});
    PRODUCTS = await res.json();
    return PRODUCTS;
  }

  async function openFor(catId){
    await ensureData();
    currentCat = findCategory(catId);
    if(!currentCat) return;

    titleEl.textContent = currentCat.name || '產品';
    currentItemId = (currentCat.items && currentCat.items[0]) ? currentCat.items[0].id : null;

    // Special note: 湯塊 300/600 傳統包裝（若資料沒寫，這裡補一層保險）
    if(catId === 'block'){
      (currentCat.items||[]).forEach(it=>{
        const sz = String(it.size||'');
        if((sz.includes('300') || sz.includes('600')) && !(it.notes||[]).some(n=>String(n).includes('傳統'))){
          it.notes = (it.notes||[]).concat(['300g / 600g 為傳統盒裝包裝。']);
        }
      });
    }

    buildBody(currentCat);
    buildBottom(catId);
    openModal();
  }

  // events
  overlay.addEventListener('click', closeModal);
  closeBtn.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  function cardHandler(card){
    const catId = card.getAttribute('data-series');
    if(!catId) return;
    openFor(catId);
  }

  cards.forEach(card=>{
    card.addEventListener('click', ()=>cardHandler(card));
    card.addEventListener('keydown', (e)=>{
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        cardHandler(card);
      }
    });
  });
})();
