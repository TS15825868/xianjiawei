
let SITE_DATA = null;
const MENU_GROUPS = [
  { title: '首頁', links: [{ href: 'index.html', label: '首頁' }] },
  { title: '產品與挑選', links: [{ href: 'products.html', label: '龜鹿系列' }, { href: 'choose.html', label: '怎麼選' }, { href: 'combo.html', label: '套餐搭配' }] },
  { title: '使用與內容', links: [{ href: 'guide.html', label: '怎麼使用' }, { href: 'recipes.html', label: '料理搭配' }, { href: 'knowledge.html', label: '食材與日常觀點' }, { href: 'videos.html', label: '觀點影片' }, { href: 'recommend.html', label: '推薦整理' }] },
  { title: '品牌與服務', links: [{ href: 'brand.html', label: '品牌故事' }, { href: 'faq.html', label: 'FAQ' }, { href: 'contact.html', label: '聯絡' }] }
];
let lastFocusedCard = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await loadData();
    buildShell();
    hydrateStaticFields();
    renderPage();
    initReveal();
    bindGlobalEvents();
  } catch (err) {
    console.error('網站初始化失敗：', err);
  }
});

async function loadData() {
  if (SITE_DATA) return SITE_DATA;

  const res = await fetch(`data.json?v=${Date.now()}`, {
    cache: 'no-store'
  });

  if (!res.ok) {
    throw new Error(`data.json 載入失敗：${res.status}`);
  }

  SITE_DATA = await res.json();
  return SITE_DATA;
}

function getLineId() {
  return SITE_DATA?.lineId || '@762jybnm';
}

function buildLineAutoLink(message = '我想看龜鹿怎麼選，幫我整理一個方向。') {
  const lineId = encodeURIComponent(getLineId());
  const text = encodeURIComponent(message);
  return `https://line.me/R/oaMessage/${lineId}/?${text}`;
}

function lineButton(label = 'LINE 幫我看適合哪個', message = '我想看龜鹿怎麼選，幫我整理一個方向。') {
  return `<a class="btn btn-line" href="${buildLineAutoLink(message)}" target="_blank" rel="noopener">${label}</a>`;
}

function buildShell() {
  const header = document.getElementById('site-header');
  const menuRoot = document.getElementById('site-menu-root');
  const footer = document.getElementById('site-footer');
  const modal = document.getElementById('site-modal');

  if (header) header.innerHTML = renderHeaderBar();
  if (menuRoot) menuRoot.innerHTML = renderMenuDrawer();
  if (footer) footer.innerHTML = renderFooter();
  if (modal) modal.innerHTML = renderModalShell();
}

function hydrateStaticFields() {
  document.querySelectorAll('[data-line-url]').forEach(el => {
    const msg = el.dataset.lineMessage || '我想看龜鹿怎麼選，幫我整理一個方向。';
    el.setAttribute('href', buildLineAutoLink(msg));
  });
  document.querySelectorAll('[data-line-id]').forEach(el => el.textContent = getLineId());
  document.querySelectorAll('[data-brand-name]').forEach(el => el.textContent = SITE_DATA.brand || '仙加味');
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
}

function renderHeaderBar() {
  return `
    <div class="header-inner">
      <a class="brand-mark" href="index.html">
        <img src="images/logo.png" alt="${SITE_DATA?.brand || '仙加味'}">
        <span>${SITE_DATA?.brand || '仙加味'}</span>
      </a>
      <button id="menu-btn" class="menu-btn" type="button" aria-label="開啟選單" aria-expanded="false">☰ 選單</button>
    </div>
  `;
}

function renderMenuDrawer() {
  return `
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
    </nav>
  `;
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
        <p>官方 LINE：${getLineId()}</p>
        <p>${lineButton('LINE 幫我看適合哪個', '我想看龜鹿怎麼選，幫我整理一個方向。')}</p>
        <p>© <span data-year></span> ${SITE_DATA?.brand || '仙加味'}</p>
      </div>
    </div>
  `;
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
    comboWrap.innerHTML = SITE_DATA.offers.comboOffers.slice(0, 2).map((combo, index) => `
      <article class="card combo-card--featured reveal">
        ${index === 0 ? `<div class="combo-badge">最常先看這組</div>` : `<div class="combo-badge">想方便的人常看</div>`}
        <p class="eyebrow">首頁精選搭配</p>
        <h3>${combo.name}</h3>
        <p>${combo.desc}</p>
        <p class="muted">內容：${combo.items.join('＋')}</p>
        ${combo.gift ? `<p class="accent">附贈：${combo.gift}</p>` : ''}
        <div class="final-cta__actions">
          ${lineButton('LINE 幫我看適合哪個', `我想看「${combo.name}」這組適不適合我。`)}
          <a class="btn btn-outline" href="combo.html">看完整搭配</a>
        </div>
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
        <div class="final-cta__actions">
          ${lineButton('LINE 幫我看適合哪個', `我想看「${p.name}」適不適合我。`)}
        </div>
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
      <div class="final-cta__actions">
        <a class="btn btn-outline" href="products.html">看產品</a>
        ${lineButton('LINE 幫我看適合哪個', `我目前是「${r.keyword}」，想看哪一種比較適合我。`)}
      </div>
    </article>
  `).join('') + finalCtaBlock('不確定怎麼挑也沒關係', '直接跟我們說你的生活方式，我們幫你整理比較適合的方向。', '我想看龜鹿怎麼選，幫我整理一個方向。');
}

function renderComboPage() {
  const el = document.getElementById('combo-grid');
  if (!el) return;
  const combos = SITE_DATA.offers?.comboOffers || [];
  el.innerHTML = combos.map((combo, index) => `
    <article class="card combo-card--featured reveal">
      ${index === 0 ? `<div class="combo-badge">最常先看這組</div>` : `<div class="combo-badge">搭配方案</div>`}
      <h3>${combo.name}</h3>
      <p>${combo.desc}</p>
      <p class="muted">內容：${combo.items.join('＋')}</p>
      ${combo.gift ? `<p class="accent">附贈：${combo.gift}</p>` : ''}
      <div class="final-cta__actions">
        ${lineButton('LINE 幫我看適合哪個', `我想看「${combo.name}」這組適不適合我。`)}
      </div>
    </article>
  `).join('') + finalCtaBlock('想直接由我們幫你搭配', '不用自己慢慢比，直接用 LINE 告訴我們你的生活方式，我們幫你整理。', '我想看適合我的龜鹿搭配，請幫我整理。');
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
    ` + finalCtaBlock('想直接問怎麼安排', '告訴我們你的作息，我們幫你整理比較好執行的方式。', '我想看怎麼安排比較適合我的日常。');
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
      <ol>${r.steps.map(s => `<li>${s}</li>`).join('')}</ol>
    </article>
  `).join('') + finalCtaBlock('想直接問哪一種比較適合你', '如果你比較偏熱飲、燉湯或調飲，也可以直接用 LINE 問我們。', '我想看我比較適合熱飲、燉湯還是調飲。');
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
  `).join('') + finalCtaBlock('想從比較適合自己的方式開始', '不用自己慢慢理解，直接 LINE 告訴我們你的情況，我們幫你整理。', '我想看比較適合我的龜鹿方式。');
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
    `).join('') + finalCtaBlock('看完還是不確定怎麼選', '直接用 LINE 跟我們說你現在比較在意什麼，我們幫你整理。', '我看完影片了，想請你幫我看適合哪一種。');
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
  `).join('') + finalCtaBlock('還是不確定怎麼選？', '可以直接跟我們說你的生活方式，我們幫你整理比較適合的方式。', '我想看龜鹿怎麼選，幫我整理一個方向。');
}

function renderRecommendPage() {
  const el = document.getElementById('recommend-grid');
  if (!el) return;
  el.innerHTML = SITE_DATA.recommend.map(r => `
    <article class="card reveal">
      <p class="eyebrow">${r.keyword}</p>
      <h3>${r.result}</h3>
      <p>${r.desc}</p>
      <div class="final-cta__actions">
        <a class="btn btn-outline" href="products.html">看產品</a>
        ${lineButton('LINE 幫我看適合哪個', `我目前是「${r.keyword}」，想請你幫我看適合哪一種。`)}
      </div>
    </article>
  `).join('');
}

function renderBrandPage() {
  const el = document.getElementById('brand-story');
  const timeline = document.getElementById('brand-timeline');
  const store = document.getElementById('brand-store');
  const b = SITE_DATA.brandStory || {};
  const s = SITE_DATA.store || {};

  if (el) {
    el.innerHTML = `
      <article class="brand-quote card reveal">
        <p class="eyebrow">品牌記憶點</p>
        <h2>${b.quote || '補養，不是補很多，是讓身體有機會慢慢回來。'}</h2>
      </article>

      <article class="card reveal">
        <p class="eyebrow">品牌由來</p>
        <h2>${b.originTitle || '仙加味的由來'}</h2>
        <p>${b.origin || '仙加味把補養加回日常，讓龜鹿產品更容易理解、安排與持續。'}</p>
      </article>

      <article class="card reveal">
        <p class="eyebrow">萬華起點</p>
        <h2>${b.storyTitle || '從萬華開始'}</h2>
        <p>${b.story || '從萬華老店出發，延續對原料、火候與工序的重視。'}</p>
      </article>

      <article class="card reveal">
        <p class="eyebrow">創始人的選擇</p>
        <h2>${b.founderTitle || '創辦人的想法'}</h2>
        <p>${b.founder || '把補養放回餐桌、熱飲與每天可執行的生活節奏。'}</p>
      </article>

      <article class="card reveal">
        <p class="eyebrow">工序傳承</p>
        <h2>${b.craftTitle || '四代鹿角工序'}</h2>
        <p>${b.craft || '真正重要的是時間與細節，不誇大、不急躁，穩穩地放進生活。'}</p>
      </article>
    `;
  }

  if (timeline) {
    const items = b.timeline || [];
    timeline.innerHTML = items.map((item, idx) => `
      <article class="card timeline-card reveal">
        <p class="eyebrow">${String(idx + 1).padStart(2, '0')}</p>
        <h3>${item.title}</h3>
        <p>${item.desc}</p>
      </article>
    `).join('');
  }

  if (store) {
    store.innerHTML = `
      <p class="eyebrow">回到萬華</p>
      <h3>${s.name || '萬華門市'}｜${s.address || '台北市萬華區西昌街52號'}</h3>
      <p>${s.heritage || '萬華老店・四代鹿角工序傳承'}</p>
      <p>如果你在萬華附近，可以先查看門市位置；若想了解產品型態與搭配方式，建議用 LINE 讓我們先幫你整理。</p>
      <div class="final-cta__actions">
        <a class="btn btn-outline" href="${s.mapUrl || 'https://www.google.com/maps?q=台北市萬華區西昌街52號'}" target="_blank" rel="noopener">開啟地圖</a>
        ${lineButton('LINE 幫我看適合哪個', '我想了解萬華門市與龜鹿產品，請幫我整理。')}
      </div>
    `;
  }
}

function renderContactPage() {
  const paymentEl = document.getElementById('contact-payments');
  const shippingEl = document.getElementById('contact-shipping');
  const notesEl = document.getElementById('contact-notes');
  const askList = document.getElementById('contact-ask-list');
  const storeCard = document.getElementById('store-card');
  const s = SITE_DATA.store || {};

  if (storeCard) {
    storeCard.innerHTML = `
      <article class="card reveal">
        <p class="eyebrow">${s.area || '台北萬華'}</p>
        <h3>${s.name || '萬華門市'}</h3>
        <p><strong>${s.address || '台北市萬華區西昌街52號'}</strong></p>
        <p>${s.heritage || '萬華老店・四代鹿角工序傳承'}</p>
        <p class="muted">${s.note || '建議先透過 LINE 聯絡，確認現場與安排時間。'}</p>
        <div class="final-cta__actions">
          <a class="btn btn-outline" href="${s.mapUrl || 'https://www.google.com/maps?q=台北市萬華區西昌街52號'}" target="_blank" rel="noopener">開啟 Google 地圖</a>
          ${lineButton('LINE 幫我看適合哪個', '我想了解萬華門市與龜鹿產品，請幫我整理。')}
        </div>
      </article>
      <article class="card reveal map-card">
        <h3>門市與到店說明</h3>
        <p>門市地址：${s.address || '台北市萬華區西昌街52號'}</p>
        <p>到店可先查看地圖；若想先了解產品型態、料理搭配或適合哪一種，透過 LINE 會整理得更清楚。</p>
      </article>
    `;
  }
  if (paymentEl) {
    paymentEl.innerHTML = (SITE_DATA.payments || []).map(item => `<li>${item}</li>`).join('');
  }
  if (shippingEl) {
    shippingEl.innerHTML = (SITE_DATA.shipping || []).map(item => `<li>${item}</li>`).join('');
  }
  if (notesEl) {
    notesEl.innerHTML = Object.entries(SITE_DATA.shippingNotes || {}).map(([k, v]) => `<li><strong>${k}</strong>：${v}</li>`).join('');
  }
  if (askList) {
    askList.innerHTML = [
      '適合哪一種型態',
      '怎麼安排日常使用',
      '搭配組合怎麼選',
      '付款與配送方式',
      '萬華門市地址與到店安排'
    ].map(item => `<li>${item}</li>`).join('');
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
          ${p.tag ? `<p class="product-tag">${p.tag}</p>` : ''}
          <p>${p.description}</p>
          ${p.hint ? `<p class="product-hint">${p.hint}</p>` : ''}
          <p class="muted">規格：${p.size}</p>
          <div class="product-card__actions">
            <button class="btn btn-outline" type="button">查看詳情</button>
            ${lineButton('LINE 幫我看適合哪個', `我想看「${p.name}」適不適合我。`)}
          </div>
        </div>
      </article>
    `;
  }).join('');

  list.querySelectorAll('[data-product-id]').forEach(card => {
    const handler = (e) => {
      if (e && e.target.closest('a')) return;
      const p = products.find(x => x.id === card.dataset.productId);
      if (p) openProductModal(p, card);
    };
    card.addEventListener('click', handler);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const p = products.find(x => x.id === card.dataset.productId);
        if (p) openProductModal(p, card);
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
        ${p.hint ? `<p class="product-hint product-hint--modal">${p.hint}</p>` : ''}
        <p class="muted">規格：${p.size}</p>

        <div class="modal-section">
          <h3>成分</h3>
          <p>${(p.ingredients || []).join('、')}</p>
        </div>

        <div class="modal-section">
          <h3>使用方式</h3>
          <ul>${(p.usage || []).map(i => `<li>${i}</li>`).join('')}</ul>
        </div>

        <div class="final-cta">
          <h3>想知道這一種適不適合你？</h3>
          <p>直接用 LINE 告訴我們你的生活方式，我們幫你整理。</p>
          <div class="final-cta__actions">
            ${lineButton('LINE 幫我看適合哪個', `我想看「${p.name}」適不適合我。`)}
          </div>
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

function finalCtaBlock(title, desc, message = '我想看龜鹿怎麼選，幫我整理一個方向。') {
  return `
    <section class="final-cta reveal">
      <h3>${title}</h3>
      <p>${desc}</p>
      <div class="final-cta__actions">
        ${lineButton('LINE 幫我看適合哪個', message)}
      </div>
    </section>
  `;
}

window.closeModal = closeModal;
