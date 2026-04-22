let SITE_DATA = null;
const MENU_GROUPS = [
  { title: '首頁', links: [{ href: 'index.html', label: '首頁' }] },
  { title: '產品與挑選', links: [{ href: 'products.html', label: '龜鹿系列' }, { href: 'choose.html', label: '怎麼選' }, { href: 'combo.html', label: '套餐搭配' }] },
  { title: '使用與內容', links: [{ href: 'guide.html', label: '怎麼使用' }, { href: 'recipes.html', label: '料理搭配' }, { href: 'knowledge.html', label: '食材與日常觀點' }, { href: 'videos.html', label: '觀點影片' }, { href: 'recommend.html', label: '推薦整理' }] },
  { title: '品牌與服務', links: [{ href: 'brand.html', label: '品牌故事' }, { href: 'faq.html', label: 'FAQ' }, { href: 'contact.html', label: '聯絡' }] }
];
let lastFocusedCard = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  buildShell();
  hydrateStaticFields();
  renderPage();
  initReveal();
  bindGlobalEvents();
});

async function loadData() {
  if (SITE_DATA) return SITE_DATA;
  const res = await fetch('data.json?v=' + Date.now());
  SITE_DATA = await res.json();
  return SITE_DATA;
}

function buildShell() {
  const header = document.getElementById('site-header');
  const footer = document.getElementById('site-footer');
  const modal = document.getElementById('site-modal');
  if (header) header.innerHTML = renderHeader();
  if (footer) footer.innerHTML = renderFooter();
  if (modal) modal.innerHTML = renderModalShell();
}

function hydrateStaticFields() {
  document.querySelectorAll('[data-line-url]').forEach(el => el.setAttribute('href', SITE_DATA.lineUrl || 'https://lin.ee/sHZW7NkR'));
  document.querySelectorAll('[data-line-id]').forEach(el => el.textContent = SITE_DATA.lineId || '@762jybnm');
  document.querySelectorAll('[data-brand-name]').forEach(el => el.textContent = SITE_DATA.brand || '仙加味');
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
}

function renderHeader() {
  return `
  <div class="header-inner">
    <a class="brand-mark" href="index.html">
      <img src="images/logo.png" alt="${SITE_DATA?.brand || '仙加味'}">
      <span>${SITE_DATA?.brand || '仙加味'}</span>
    </a>
    <button id="menu-btn" class="menu-btn" type="button" aria-label="開啟選單" aria-expanded="false">☰ 選單</button>
  </div>
  <nav id="menu-drawer" class="site-menu" aria-hidden="true">
    <div class="site-menu__backdrop" data-close-menu="1"></div>
    <aside class="site-menu__panel">
      <button id="menu-close" class="menu-close" type="button" aria-label="關閉選單">✕</button>
      ${MENU_GROUPS.map(group => `
        <div class="menu-group">
          <h4>${group.title}</h4>
          ${group.links.map(link => `<a href="${link.href}">${link.label}</a>`).join('')}
        </div>
      `).join('')}
    </aside>
  </nav>`;
}

function renderFooter() {
  return `
    <div class="footer-card card">
      <div>
        <strong>${SITE_DATA?.brand || '仙加味'}・龜鹿</strong>
        <p>補養，是一種節奏。</p>
        <p>把龜鹿放回日常飲食與生活安排裡。</p>
      </div>
      <div>
        <p>官方 LINE：${SITE_DATA?.lineId || '@762jybnm'}</p>
        <p><a class="btn btn-line" href="${SITE_DATA?.lineUrl || 'https://lin.ee/sHZW7NkR'}" target="_blank" rel="noopener">LINE 聯絡</a></p>
        <p>© <span data-year></span> ${SITE_DATA?.brand || '仙加味'}</p>
      </div>
    </div>`;
}

function renderModalShell() {
  return `
    <div id="product-modal" class="product-modal" aria-hidden="true">
      <div class="product-modal__backdrop" data-close-modal="1"></div>
      <div class="product-modal__scroll">
        <div class="product-modal__panel">
          <button id="product-modal-close" class="product-modal__close" type="button" aria-label="關閉">關閉</button>
          <div id="product-modal-body"></div>
        </div>
      </div>
    </div>
  `;
}

function bindGlobalEvents() {
  document.addEventListener('click', (e) => {
    const drawer = document.getElementById('menu-drawer');
    const btn = document.getElementById('menu-btn');

    if (btn && (btn === e.target || btn.contains(e.target))) {
      const opening = !drawer?.classList.contains('open');
      drawer?.classList.toggle('open', opening);
      drawer?.setAttribute('aria-hidden', String(!opening));
      btn.setAttribute('aria-expanded', String(opening));
      document.body.classList.toggle('menu-open', opening);
      return;
    }

    if (e.target.closest('[data-close-menu="1"]') || e.target.closest('.site-menu__panel a') || e.target.closest('#menu-close')) {
      closeMenu();
    }

    if (e.target.closest('[data-close-modal="1"]') || e.target.closest('#product-modal-close')) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
      closeModal();
    }
  });

  window.addEventListener('scroll', () => {
    closeMenu();
  }, { passive: true });
}

function closeMenu() {
  const drawer = document.getElementById('menu-drawer');
  const btn = document.getElementById('menu-btn');
  drawer?.classList.remove('open');
  drawer?.setAttribute('aria-hidden', 'true');
  btn?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}

function renderPage() {
  const page = document.body.dataset.page;
  if (page === 'home') renderHome();
  if (page === 'products') renderProductsPage();
  if (page === 'choose') renderChoosePage();
  if (page === 'combo') renderComboPage();
  if (page === 'guide') renderGuidePage();
  if (page === 'recipes') renderRecipesPage();
  if (page === 'knowledge') renderKnowledgePage();
  if (page === 'videos') renderVideosPage();
  if (page === 'faq') renderFaqPage();
  if (page === 'recommend') renderRecommendPage();
  if (page === 'brand') renderBrandPage();
  if (page === 'contact') renderContactPage();
}

function renderHome() {
  fillProducts('home-products', SITE_DATA.products);
  const comboWrap = document.getElementById('home-combo-list');
  if (comboWrap && SITE_DATA.offers?.comboOffers?.length) {
    comboWrap.innerHTML = SITE_DATA.offers.comboOffers.slice(0, 2).map(combo => `
      <article class="card reveal">
        <p class="eyebrow">首頁精選搭配</p>
        <h3>${combo.name}</h3>
        <p>${combo.desc}</p>
        <p class="muted">內容：${combo.items.join('＋')}</p>
        ${combo.gift ? `<p class="accent">附贈：${combo.gift}</p>` : ''}
        <a class="btn btn-outline" href="combo.html">看完整搭配</a>
      </article>
    `).join('');
  }
}

function renderProductsPage() {
  fillProducts('product-list', SITE_DATA.products);
  const compare = document.getElementById('compare-grid');
  if (compare) {
    compare.innerHTML = SITE_DATA.products.map(p => `
      <article class="card reveal">
        <p class="eyebrow">${p.size}</p>
        <h3>${p.name}</h3>
        <p>${p.description}</p>
      </article>
    `).join('');
  }
}

function renderChoosePage() {
  const el = document.getElementById('choose-results');
  if (!el) return;
  el.innerHTML = SITE_DATA.recommend.map(r => `
    <article class="card reveal">
      <p class="eyebrow">${r.keyword}</p>
      <h3>${r.result}</h3>
      <p>${r.desc}</p>
      <a class="btn btn-outline" href="products.html">看產品</a>
    </article>
  `).join('');
}

function renderComboPage() {
  const el = document.getElementById('combo-grid');
  if (!el) return;
  const combos = SITE_DATA.offers?.comboOffers || [];
  el.innerHTML = combos.map(combo => `
    <article class="card reveal">
      <p class="eyebrow">搭配方案</p>
      <h3>${combo.name}</h3>
      <p>${combo.desc}</p>
      <p class="muted">內容：${combo.items.join('＋')}</p>
      ${combo.gift ? `<p class="accent">附贈：${combo.gift}</p>` : ''}
      <a class="btn btn-line" href="${SITE_DATA.lineUrl}" target="_blank" rel="noopener">LINE 詢問這組</a>
    </article>
  `).join('');
}

function renderGuidePage() {
  const guide = document.querySelector('[data-render="guide"]');
  const rhythm = document.querySelector('[data-render="rhythm"]');

  if (guide) {
    guide.innerHTML = `
      <article class="card reveal">
        <p class="eyebrow">Step 1</p>
        <h3>先看型態</h3>
        <p>膏適合固定節奏，飲適合快速安排，湯塊適合餐桌，粉適合自己搭配。</p>
      </article>
      <article class="card reveal">
        <p class="eyebrow">Step 2</p>
        <h3>再看作息</h3>
        <p>把安排放在早上與下午比較好執行，盡量避免接近睡前。</p>
      </article>
      <article class="card reveal">
        <p class="eyebrow">Step 3</p>
        <h3>最後看規格</h3>
        <p>先從自己覺得容易開始的份量下手，比一次做太多設定更容易持續。</p>
      </article>
    `;
  }

  if (rhythm) {
    rhythm.innerHTML = `
      <article class="card reveal">
        <h3>平日安排</h3>
        <p>把補養放進每天固定的時間點，比偶爾想到才使用更容易形成節奏。</p>
      </article>
      <article class="card reveal">
        <h3>餐桌搭配</h3>
        <p>湯塊與熱飲類型，適合用「順手」作為安排原則，不需要每次都做得很複雜。</p>
      </article>
    `;
  }
}

function renderRecipesPage() {
  const el = document.getElementById('recipe-grid');
  if (!el) return;
  el.innerHTML = SITE_DATA.recipes.map(r => `
    <article class="card reveal">
      <p class="eyebrow">${r.category}</p>
      <h3>${r.title}</h3>
      <p>${r.desc}</p>
      <ol>
        ${r.steps.map(s => `<li>${s}</li>`).join('')}
      </ol>
    </article>
  `).join('');
}

function renderKnowledgePage() {
  const el = document.getElementById('knowledge-grid');
  if (!el) return;
  const items = [
    ['從食材出發', '官網用語以龜板萃取物、鹿角萃取物為主，回到飲食搭配的理解方式。'],
    ['從工序出發', '長時間熬製、慢火濃縮，是品牌一路延續下來的做法。'],
    ['從節奏出發', '比起追求一次看見什麼，更重視能不能穩定、舒服地放進生活。'],
    ['從餐桌出發', '熱飲、調飲、燉湯、固定小匙，這些都比空泛形容更有幫助。']
  ];
  el.innerHTML = items.map(([title, desc]) => `
    <article class="card reveal">
      <h3>${title}</h3>
      <p>${desc}</p>
    </article>
  `).join('');
}

function renderVideosPage() {
  const count = document.getElementById('video-count');
  const grid = document.getElementById('video-grid');
  if (count) count.textContent = SITE_DATA.videos.length;
  if (grid) {
    grid.innerHTML = SITE_DATA.videos.map((v, i) => `
      <article class="card video-card reveal">
        <p class="eyebrow">第 ${i + 1} 支</p>
        <h3>${v.title}</h3>
        <p>整理自公開平台，不自動播放，點擊後開啟原影片。</p>
        <a class="btn btn-outline" href="${v.url}" target="_blank" rel="noopener">開啟原影片</a>
      </article>
    `).join('');
  }
}

function renderFaqPage() {
  const el = document.getElementById('faq-grid');
  if (!el) return;
  el.innerHTML = SITE_DATA.faqs.map(f => `
    <details class="faq-item reveal">
      <summary>${f.q}</summary>
      <div class="faq-item__body">
        <p>${f.a}</p>
      </div>
    </details>
  `).join('');
}

function renderRecommendPage() {
  const el = document.getElementById('recommend-grid');
  if (!el) return;
  el.innerHTML = SITE_DATA.recommend.map(r => `
    <article class="card reveal">
      <p class="eyebrow">${r.keyword}</p>
      <h3>${r.result}</h3>
      <p>${r.desc}</p>
      <a class="btn btn-outline" href="products.html">看產品</a>
    </article>
  `).join('');
}

function renderBrandPage() {
  const el = document.getElementById('brand-story');
  if (!el) return;
  el.innerHTML = `
    <article class="card reveal">
      <h2>從萬華開始</h2>
      <p>一間做鹿角的老店，一路走到現在。我們做的，其實很單純，把龜板與鹿角交給時間，用該有的火候，慢慢熬。</p>
    </article>
    <article class="card reveal">
      <h2>回到節奏</h2>
      <p>不強調神奇，不追求一次塞滿，而是把補養放回日常、放回餐桌、放回可以長久執行的方式裡。</p>
    </article>
  `;
}

function renderContactPage() {
  const paymentEl = document.getElementById('contact-payments');
  const shippingEl = document.getElementById('contact-shipping');
  const notesEl = document.getElementById('contact-notes');

  if (paymentEl) {
    paymentEl.innerHTML = (SITE_DATA.payments || []).map(item => `<li>${item}</li>`).join('');
  }

  if (shippingEl) {
    shippingEl.innerHTML = (SITE_DATA.shipping || []).map(item => `<li>${item}</li>`).join('');
  }

  if (notesEl) {
    notesEl.innerHTML = Object.entries(SITE_DATA.shippingNotes || {}).map(([k, v]) => `
      <li><strong>${k}</strong>：${v}</li>
    `).join('');
  }
}

function fillProducts(targetId, products) {
  const list = document.getElementById(targetId);
  if (!list) return;

  list.innerHTML = products.map(p => {
    const thumb = (p.gallery && p.gallery[0]) || p.image;
    return `
      <article class="product-card reveal" data-product-id="${p.id}" tabindex="0" role="button" aria-label="查看 ${p.name} 詳細介紹">
        <div class="product-card__img">
          <img src="${thumb}" alt="${p.name}">
        </div>
        <div class="product-card__body">
          <p class="eyebrow">${p.series || ''}</p>
          <h3>${p.name}</h3>
          <p>${p.description}</p>
          <p class="muted">規格：${p.size}</p>
          <button class="btn btn-outline" type="button">查看詳情</button>
        </div>
      </article>
    `;
  }).join('');

  list.querySelectorAll('[data-product-id]').forEach(card => {
    const handler = () => {
      const p = products.find(x => x.id === card.dataset.productId);
      if (p) openProductModal(p, card);
    };
    card.addEventListener('click', handler);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handler();
      }
    });
  });
}

function openProductModal(p, sourceEl) {
  const modal = document.getElementById('product-modal');
  const body = document.getElementById('product-modal-body');
  if (!modal || !body) return;

  lastFocusedCard = sourceEl || document.activeElement;
  const gallery = ((p.gallery && p.gallery.length) ? p.gallery : [p.image]).filter(Boolean);

  body.innerHTML = `
    <div class="modal-top">
      <div class="modal-gallery">
        ${gallery.map((src, idx) => `
          <div class="modal-gallery__item">
            <img src="${src}" alt="${p.name} 圖片 ${idx + 1}">
          </div>
        `).join('')}
      </div>
      <div class="modal-copy">
        <p class="eyebrow">${p.series || '仙加味・龜鹿'}</p>
        <h2>${p.name}</h2>
        <p>${p.description}</p>
        <p class="muted">規格：${p.size}</p>

        <div class="modal-section">
          <h3>成分</h3>
          <p>${(p.ingredients || []).join('、')}</p>
        </div>

        <div class="modal-section">
          <h3>使用方式</h3>
          <ul>${(p.usage || []).map(i => `<li>${i}</li>`).join('')}</ul>
        </div>

        <div class="modal-actions">
          <a class="btn btn-line" href="${SITE_DATA.lineUrl || 'https://lin.ee/sHZW7NkR'}" target="_blank" rel="noopener">LINE 諮詢</a>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  document.getElementById('product-modal-close')?.focus();
}

function closeModal() {
  const modal = document.getElementById('product-modal');
  if (!modal) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  if (lastFocusedCard && typeof lastFocusedCard.focus === 'function') {
    lastFocusedCard.focus();
  }
}

function initReveal() {
  const run = () => {
    document.querySelectorAll('.reveal').forEach(el => {
      if (el.getBoundingClientRect().top < window.innerHeight - 60) {
        el.classList.add('show');
      }
    });
  };
  run();
  window.addEventListener('scroll', run, { passive: true });
}

window.closeModal = closeModal;
