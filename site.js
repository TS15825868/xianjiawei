let siteData = null;

document.addEventListener('DOMContentLoaded', async () => {
  initMenuShell();
  initYear();
  await loadData();
  hydrateGlobalContent();
  initScrollReveal();
  initModal();
  closeMenuOnNavigation();
  window.addEventListener('resize', syncReveal);
});

async function loadData(){
  try {
    const res = await fetch('data.json?v=' + Date.now());
    siteData = await res.json();
  } catch (err) {
    console.error('資料載入失敗', err);
    document.querySelectorAll('[data-render]').forEach(el => {
      el.innerHTML = '<div class="empty-state">資料載入失敗，請重新整理頁面。</div>';
    });
  }
}

function initMenuShell(){
  const menu = document.getElementById('site-menu');
  const overlay = document.getElementById('menu-overlay');
  const toggle = document.getElementById('menu-toggle');
  const close = document.getElementById('menu-close');
  if(!menu || !overlay || !toggle) return;
  toggle.addEventListener('click', openMenu);
  overlay.addEventListener('click', closeMenu);
  if (close) close.addEventListener('click', closeMenu);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
      closeModal();
    }
  });
}
function openMenu(){ document.body.classList.add('menu-open'); }
function closeMenu(){ document.body.classList.remove('menu-open'); }
function closeMenuOnNavigation(){
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.menu-link');
    if (link) closeMenu();
  });
}

function initYear(){
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
}

function hydrateGlobalContent(){
  if(!siteData) return;
  renderBrandBits();
  renderProducts();
  renderCompare();
  renderGuide();
  renderRecipes();
  renderVideos();
  renderFaq();
  renderRecommendations();
}

function renderBrandBits(){
  const b = siteData.brand;
  document.querySelectorAll('[data-brand-name]').forEach(el => el.textContent = b.name);
  document.querySelectorAll('[data-brand-series]').forEach(el => el.textContent = b.series);
  document.querySelectorAll('[data-brand-tagline]').forEach(el => el.textContent = b.tagline);
  document.querySelectorAll('[data-brand-subtitle]').forEach(el => el.textContent = b.subtitle);
  document.querySelectorAll('[data-line-url]').forEach(el => el.setAttribute('href', b.line_url));
  document.querySelectorAll('[data-line-id]').forEach(el => el.textContent = b.line_id);
  document.querySelectorAll('[data-logo]').forEach(el => { if (el.tagName === 'IMG') el.src = b.logo; });
  const menu = document.getElementById('site-menu');
  if (menu) {
    menu.innerHTML = `
      <div class="menu-head">
        <strong>${b.name}</strong>
        <button id="menu-close" class="menu-close" type="button" aria-label="關閉選單">✕</button>
      </div>
      <div class="menu-section">
        <h3>首頁</h3>
        <a class="menu-link" href="index.html"><span>品牌首頁</span><small>Hero / 產品 / 入口</small></a>
      </div>
      <div class="menu-section">
        <h3>產品</h3>
        <a class="menu-link" href="products.html"><span>龜鹿系列</span><small>完整產品總覽</small></a>
        <a class="menu-link" href="recommend.html"><span>怎麼選龜鹿</span><small>依情境快速分流</small></a>
      </div>
      <div class="menu-section">
        <h3>使用指南</h3>
        <a class="menu-link" href="guide.html"><span>怎麼使用</span><small>型態 / 作息 / 規格</small></a>
        <a class="menu-link" href="recipes.html"><span>料理搭配</span><small>燉湯 / 熱飲 / 調飲</small></a>
      </div>
      <div class="menu-section">
        <h3>內容</h3>
        <a class="menu-link" href="videos.html"><span>觀點影片</span><small>公開影片整理</small></a>
        <a class="menu-link" href="knowledge.html"><span>食材與日常觀點</span><small>品牌知識整理</small></a>
        <a class="menu-link" href="faq.html"><span>常見問題</span><small>使用與選購前整理</small></a>
      </div>
      <div class="menu-section">
        <h3>品牌</h3>
        <a class="menu-link" href="brand.html"><span>品牌故事</span><small>萬華四代熬製工序</small></a>
        <a class="menu-link" href="contact.html"><span>聯絡我們</span><small>官方 LINE / 諮詢</small></a>
      </div>`;
    document.getElementById('menu-close')?.addEventListener('click', closeMenu);
  }
}

function renderProducts(){
  const targets = document.querySelectorAll('[data-render="products"]');
  if (!targets.length || !siteData?.products) return;
  const cards = siteData.products.map(p => productCardMarkup(p)).join('');
  targets.forEach(target => { target.innerHTML = cards; bindProductCards(target); });
}

function productCardMarkup(p){
  return `
    <article class="product-card glass-card reveal" data-product-id="${escapeHtml(p.id)}" tabindex="0" role="button" aria-label="查看 ${escapeHtml(p.name)} 詳細內容">
      <div class="product-thumb"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}"></div>
      <div class="product-body">
        <div class="product-meta"><strong>${escapeHtml(p.name)}</strong><span class="category-tag">${escapeHtml(p.category || '')}</span></div>
        <p>${escapeHtml(p.description)}</p>
        <div class="product-actions"><span>${escapeHtml(p.size || '')}</span><span>查看完整介紹 →</span></div>
      </div>
    </article>`;
}

function bindProductCards(scope){
  scope.querySelectorAll('[data-product-id]').forEach(card => {
    const id = card.getAttribute('data-product-id');
    const open = () => openProductModal(id);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open();
      }
    });
  });
  syncReveal();
}

function openProductModal(id){
  const product = siteData?.products?.find(item => item.id === id);
  if (!product) return;
  const modal = document.getElementById('modal');
  const content = document.getElementById('modal-content');
  if (!modal || !content) return;
  const gallery = [product.image].concat(product.gallery || []).filter(Boolean);
  const uniqueGallery = [...new Set(gallery)];
  content.innerHTML = `
    <div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
      <div class="modal-top">
        <h2 id="product-modal-title">${escapeHtml(product.name)}</h2>
        <button class="modal-close" type="button" aria-label="關閉產品詳細介紹">關閉 ×</button>
      </div>
      <div class="modal-layout">
        <div class="modal-gallery">
          ${uniqueGallery.map(src => `<img src="${escapeHtml(src)}" alt="${escapeHtml(product.name)}">`).join('')}
        </div>
        <div class="modal-copy">
          <span class="spec-chip">規格：${escapeHtml(product.size || '')}</span>
          <p>${escapeHtml(product.description)}</p>
          <h3>成分</h3>
          <ul>${(product.ingredients || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
          <h3>使用方式</h3>
          <ul>${(product.usage || []).map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
          <h3>保存方式</h3>
          <p>${escapeHtml(product.storage || '請依包裝標示保存。')}</p>
          ${(product.faq && product.faq.length) ? `<h3>常見問題</h3><ul>${product.faq.map(item => `<li><strong>${escapeHtml(item.q)}</strong>：${escapeHtml(item.a)}</li>`).join('')}</ul>` : ''}
          <div class="modal-cta">
            <a class="btn btn-primary" href="${escapeHtml(siteData.brand.line_url)}" target="_blank" rel="noopener">LINE 諮詢</a>
            <a class="btn btn-ghost" href="products.html">回產品總覽</a>
          </div>
        </div>
      </div>
    </div>`;
  modal.classList.add('show');
  document.body.classList.add('modal-open');
  content.querySelector('.modal-close')?.addEventListener('click', closeModal);
}

function initModal(){
  const modal = document.getElementById('modal');
  if (!modal) return;
  modal.addEventListener('click', (e) => {
    if (e.target.id === 'modal' || e.target.closest('.modal-close')) closeModal();
  });
}
function closeModal(){
  const modal = document.getElementById('modal');
  const content = document.getElementById('modal-content');
  if (!modal || !content) return;
  modal.classList.remove('show');
  document.body.classList.remove('modal-open');
  content.innerHTML = '';
}

function renderCompare(){
  const target = document.querySelector('[data-render="compare"]');
  if (!target || !siteData?.products) return;
  target.innerHTML = siteData.products.map(p => `
    <article class="compare-card reveal">
      <h3>${escapeHtml(p.name)}</h3>
      <p><strong>型態：</strong>${escapeHtml(p.category || '')}</p>
      <p><strong>規格：</strong>${escapeHtml(p.size || '')}</p>
      <p>${escapeHtml(compareDescription(p))}</p>
    </article>`).join('');
  syncReveal();
}
function compareDescription(p){
  if (p.id === 'guilu-gao') return '適合想建立固定食用節奏者。';
  if (p.id === 'guilu-drink') return '適合在外或忙碌時快速準備。';
  if (p.id === 'guilu-block') return '適合燉煮、煲湯與家常料理。';
  if (p.id === 'lurong') return '適合偏好自由調飲與粉末型態者。';
  return p.description || '';
}

function renderGuide(){
  const target = document.querySelector('[data-render="guide"]');
  if (!target || !siteData?.guide?.steps) return;
  target.innerHTML = siteData.guide.steps.map((step, idx) => `
    <article class="guide-step reveal">
      <span class="eyebrow">Step ${idx + 1}</span>
      <h3>${escapeHtml(step.title)}</h3>
      <p>${escapeHtml(step.text)}</p>
    </article>`).join('');
  const seasonal = document.querySelector('[data-render="seasonal"]');
  if (seasonal && siteData.guide.seasonal) {
    seasonal.innerHTML = `<div class="note-box reveal"><strong style="display:block;color:var(--ink);margin-bottom:8px">四季建議</strong><ul class="steps">${siteData.guide.seasonal.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul></div>`;
  }
  syncReveal();
}

function renderRecipes(){
  const target = document.querySelector('[data-render="recipes"]');
  if (!target || !siteData?.recipes) return;
  target.innerHTML = siteData.recipes.map(recipe => `
    <article class="recipe-card reveal">
      <div class="pill-row"><span class="pill">${escapeHtml(recipe.category || '日常')}</span></div>
      <h3>${escapeHtml(recipe.title)}</h3>
      <p>${escapeHtml(recipe.desc || '')}</p>
      <ol class="steps">${(recipe.steps || []).map(step => `<li>${escapeHtml(step)}</li>`).join('')}</ol>
    </article>`).join('');
  syncReveal();
}

function renderVideos(){
  const target = document.querySelector('[data-render="videos"]');
  if (!target || !siteData?.videos) return;
  target.innerHTML = siteData.videos.map(video => `
    <article class="video-card reveal">
      <div class="pill-row"><span class="pill">公開影片</span></div>
      <h3>${escapeHtml(video.title)}</h3>
      <p>整理自公開平台內容，僅供知識交流與選品參考。</p>
      <p style="margin-top:12px"><a href="${escapeHtml(video.url)}" target="_blank" rel="noopener">開啟原影片 →</a></p>
    </article>`).join('');
  syncReveal();
}

function renderFaq(){
  const target = document.querySelector('[data-render="faq"]');
  if (!target || !siteData?.faq) return;
  target.innerHTML = siteData.faq.map(item => `
    <article class="faq-item reveal">
      <h3>${escapeHtml(item.q)}</h3>
      <p>${escapeHtml(item.a)}</p>
    </article>`).join('');
  syncReveal();
}

function renderRecommendations(){
  const target = document.querySelector('[data-render="recommendations"]');
  if (!target || !siteData?.recommendations) return;
  target.innerHTML = siteData.recommendations.map(item => `
    <article class="story-card reveal">
      <h3>${escapeHtml(item.title)}</h3>
      <p><strong style="color:var(--ink)">${escapeHtml(item.result)}</strong></p>
      <p>${escapeHtml(item.desc)}</p>
    </article>`).join('');
  syncReveal();
}

function initScrollReveal(){
  window.addEventListener('scroll', syncReveal, { passive: true });
  syncReveal();
}
function syncReveal(){
  document.querySelectorAll('.reveal').forEach(el => {
    if (el.getBoundingClientRect().top < window.innerHeight - 70) el.classList.add('show');
  });
}

function escapeHtml(value){
  return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
