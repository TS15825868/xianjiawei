
let SITE_DATA = null;
const MENU_GROUPS = [
  { title: '🏠 首頁', links: [{ href: 'index.html', label: '首頁' }] },
  { title: '📦 產品與挑選', links: [
    { href: 'products.html', label: '龜鹿系列' },
    { href: 'choose.html', label: '怎麼選龜鹿' },
    { href: 'combo.html', label: '套餐搭配' },
    { href: 'dm.html', label: '產品整理' }
  ] },
  { title: '🍵 使用與內容', links: [
    { href: 'guide.html', label: '怎麼使用' },
    { href: 'recipes.html', label: '料理搭配' },
    { href: 'video.html', label: '觀點影片' },
    { href: 'knowledge.html', label: '龜鹿知識' }
  ] },
  { title: '🏛 品牌與服務', links: [
    { href: 'brand.html', label: '品牌故事' },
    { href: 'faq.html', label: '常見問題 FAQ' },
    { href: 'contact.html', label: '聯絡我們' }
  ] }
];
let lastFocusedCard = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    try { await loadData(); } catch (e) { console.warn('data.json 載入失敗，先顯示選單外殼', e); SITE_DATA = SITE_DATA || {brand:'仙加味', lineId:'@762jybnm', products:[], combos:[], offers:{comboOffers:[]}, recommend:[], recipes:[], videos:[], faqs:[]}; }
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

  const res = await fetch('data.json?v=128.0');

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

function lineButton(label = '怎麼選龜鹿？', text = '我想詢問仙加味龜鹿產品。') {
  const url = `https://line.me/R/oaMessage/${encodeURIComponent(SITE_DATA.lineId || '@762jybnm')}/?${encodeURIComponent(text)}`;
  return `<a class="btn btn-line" href="${url}" target="_blank" rel="noopener">${label}</a>`;
}

function sourceLineText(page = '') {
  const map = {
    home: '我想知道哪一種龜鹿比較適合我。',
    products: '我從官網產品頁進來，想了解產品。',
    combo: '我從官網套餐頁進來，想了解套餐搭配。',
    choose: '我想知道哪一種龜鹿比較適合我。',
    guide: '我從官網怎麼使用頁面進來，想了解產品使用方式。',
    recipes: '我從官網料理頁進來，想了解龜鹿料理搭配。',
    video: '我從官網影片頁進來，想看龜鹿系列影片與產品。',
    videos: '我從官網影片頁進來，想看龜鹿系列影片與產品。',
    knowledge: '我從官網知識頁進來，想了解龜鹿知識。',
    brand: '我從官網品牌頁進來，想了解仙加味。',
    faq: '我從官網FAQ頁面進來，有幾個問題想詢問。',
    contact: '我從官網聯絡頁進來，想詢問產品資訊。'
  };
  return map[page] || '我想知道哪一種龜鹿比較適合我。';
}

function pageLineButton(label = '怎麼選龜鹿？') {
  return lineButton(label, sourceLineText(document.body?.dataset?.page || 'home'));
}

function productFitText(productName = '') {
  return `我想了解${productName}適不適合我。`;
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
        <img src="images/logo.png" alt="${SITE_DATA?.brand || '仙加味'}" decoding="async">
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
        <div class="menu-line-cta">
          <p class="menu-line-cta__title">官方 LINE 客服</p>
          <p class="menu-line-cta__id">LINE ID：<strong>${getLineId()}</strong></p>
          ${lineButton('這個適合我嗎？', '我想看龜鹿怎麼選，幫我整理一個方向。')}
        </div>
      </aside>
    </nav>
  `;
}

function renderFooter() {
  return `
    <div class="footer-card card">
      <div class="footer-brand-block">
        <strong>${SITE_DATA?.brand || '仙加味'}・龜鹿</strong>
        <p>補養，是一種節奏。</p>
        <p>把龜鹿放回日常飲食與生活安排裡。</p>
        <p>${SITE_DATA?.heritage?.footer || `SINCE 1978｜仙加味品牌 Founded 2008`}</p>
      </div>
      <div class="footer-line-box">
        <div class="footer-line-logo">
          <img src="images/logo.png" alt="仙加味 LOGO" loading="lazy" decoding="async">
        </div>
        <div class="footer-line-copy">
          <p class="footer-line-title">官方 LINE</p>
          <p class="footer-line-id">LINE ID：<strong>${getLineId()}</strong></p>
          <p class="muted">想了解搭配方式與方案，歡迎加入 怎麼選龜鹿？。</p>
          <p>${lineButton('這個適合我嗎？', '我想看龜鹿怎麼選，幫我整理一個方向。')}</p>
        </div>
        <img class="line-qr-small" src="images/line-qr.jpg" alt="仙加味官方 LINE QR Code" loading="lazy" decoding="async">
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
}

function openMenu() {
  let drawer = document.getElementById('menu-drawer');
  let btn = document.getElementById('menu-btn');
  if (!drawer) {
    buildShell();
    drawer = document.getElementById('menu-drawer');
    btn = document.getElementById('menu-btn');
  }
  drawer?.classList.add('open');
  drawer?.setAttribute('aria-hidden', 'false');
  btn?.setAttribute('aria-expanded', 'true');
  document.body.classList.add('menu-open');
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
  if (page === 'videos' || page === 'video') renderVideosPage();
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
          ${lineButton('LINE 幫我看這組適不適合', `我想看「${combo.name}」這組適不適合我。`)}
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
        <h3>${p.displayName || p.name}</h3>
        <p>${p.description}</p>
        <div class="final-cta__actions">
          ${lineButton('這個適合我嗎？', productFitText((typeof p !== 'undefined' ? (p.displayName || p.name) : (product.displayName || product.name))))}
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
        ${lineButton('這個適合我嗎？', `我目前是「${r.keyword}」，想看哪一種比較適合我。`)}
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
        ${lineButton('LINE 幫我看這組適不適合', `我想看「${combo.name}」這組適不適合我。`)}
      </div>
    </article>
  `).join('') + finalCtaBlock('想直接由我們幫你搭配', '不用自己慢慢比，直接用 LINE 告訴我們你的生活方式，我們幫你整理。', '我想看適合我的龜鹿搭配，請幫我整理。');
}

function renderGuidePage() {
  const items = SITE_DATA.pageContent?.guide || [];
  const html = items.map((item, index) => `
    <article class="card guide-card reveal">
      <p class="eyebrow">使用 ${index + 1}</p>
      <h3>${item.title}</h3>
      <p class="preline">${item.desc}</p>
    </article>
  `).join('');
  const target = document.getElementById('guide-steps') || document.getElementById('guide-notes') || document.getElementById('guide-grid');
  if (target) {
    target.innerHTML = html + finalCtaBlock('想知道自己適合哪種方式', '直接用 LINE 告訴我們你平常是想熱飲、燉湯或方便即飲。', sourceLineText('guide'));
    return;
  }
  const main = document.querySelector('main.page');
  if (main && !document.getElementById('guide-dynamic-grid')) {
    main.insertAdjacentHTML('beforeend', `<section class="section"><div class="section-title"><p class="eyebrow">使用整理</p><h2>五種產品使用方式</h2></div><div class="grid cards-2" id="guide-dynamic-grid">${html}</div>${finalCtaBlock('想知道自己適合哪種方式', '直接用 LINE 告訴我們你平常是想熱飲、燉湯或方便即飲。', sourceLineText('guide'))}</section>`);
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
  const videos = SITE_DATA.videos || [];
  if (count) count.textContent = videos.length;
  if (!grid) return;
  const channelUrl = SITE_DATA.tiktokChannel || 'https://www.tiktok.com/@changwuchi2023';
  const groups = ['龜鹿系列', '鹿茸系列', '中醫師觀點'];
  const top = `
    <article class="card video-card reveal grid-span-2">
      <p class="eyebrow">合作中醫師</p>
      <h3>章無忌中醫師 TikTok 頻道</h3>
      <p>本頁整理 25 支公開影片入口，依龜鹿系列、鹿茸系列與中醫師觀點分類。影片不自動播放，點擊後開啟 TikTok。</p>
      <a class="btn btn-line" href="${channelUrl}" target="_blank" rel="noopener">觀看 TikTok 頻道</a>
    </article>
    ${groups.map(g => `<article class="card reveal"><p class="eyebrow">影片分類</p><h3>${g}</h3><p>${videos.filter(v => v.category === g).length} 支影片</p></article>`).join('')}
  `;
  const cards = videos.map((v, i) => `
    <article class="card video-card reveal">
      <p class="eyebrow">${v.category || '影片'}</p>
      <h3>${i + 1}. ${v.title}</h3>
      <p>整理自公開平台，點擊後開啟原影片。</p>
      <a class="btn btn-outline" href="${v.url}" target="_blank" rel="noopener">開啟影片</a>
    </article>
  `).join('');
  grid.innerHTML = top + cards + finalCtaBlock('看完還是不確定怎麼選', '直接用 LINE 跟我們說你平常偏好熱飲、燉湯或方便即飲，我們幫你整理。', sourceLineText('video'));
}

function renderFaqPage() {
  const el = document.getElementById('faq-grid');
  if (!el) return;
  const faqs = SITE_DATA.faq || SITE_DATA.faqs || [];
  const groups = [...new Set(faqs.map(f => f.category || '常見問題'))];
  el.innerHTML = groups.map(group => `
    <div class="grid-span-2 faq-category reveal">
      <p class="eyebrow">FAQ</p>
      <h2>${group}</h2>
    </div>
    ${faqs.filter(f => (f.category || '常見問題') === group).map(f => `
      <details class="faq-item reveal">
        <summary>${f.q}</summary>
        <div class="faq-item__body"><p>${f.a}</p></div>
      </details>
    `).join('')}
  `).join('') + finalCtaBlock('還是不確定怎麼選？', '可以直接跟我們說你的生活方式，我們幫你整理比較適合的方式。', sourceLineText('faq'));
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
        ${lineButton('這個適合我嗎？', `我目前是「${r.keyword}」，想請你幫我看適合哪一種。`)}
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
        ${lineButton('這個適合我嗎？', '我想了解萬華門市與龜鹿產品，幫我整理一個方向。')}
      </div>
    `;
  }
}

function renderContactPage() {
  const askList = document.getElementById('contact-ask-list');
  const payments = document.getElementById('contact-payments');
  const shipping = document.getElementById('contact-shipping');
  const notes = document.getElementById('contact-notes');
  const storeInfo = document.getElementById('store-info');
  const storeCard = document.getElementById('store-card');
  const askItems = ['想知道適合哪一種龜鹿產品', '想了解價格與活動方案', '想詢問配送、門市自取或雙北親送', '想洽談中藥店、診所或通路合作'];
  if (askList) askList.innerHTML = askItems.map(x => `<li>${x}</li>`).join('');
  if (payments) payments.innerHTML = (SITE_DATA.payments || ['現金付款','匯款','貨到付款','TWQR（建置中）']).map(x => `<li>${x}</li>`).join('');
  if (shipping) shipping.innerHTML = (SITE_DATA.shipping || ['宅配','7-11賣貨便','門市自取','雙北親送']).map(x => `<li>${x}</li>`).join('');
  if (notes) notes.innerHTML = (SITE_DATA.pageContent?.contactNotes || []).map(x => `<li>${x}</li>`).join('');
  if (storeInfo) {
    const store = SITE_DATA.store || {};
    storeInfo.innerHTML = `
      <p><strong>門市地址：</strong>${store.address || '台北市萬華區西昌街52號'}</p>
      <p><strong>官方 LINE：</strong>${SITE_DATA.lineId || '@762jybnm'}</p>
      <p>${store.pickupNote || '門市自取請先透過官方 LINE 確認取貨時間。'}</p>
      <p><a class="btn btn-outline" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address || '台北市萬華區西昌街52號')}" target="_blank" rel="noopener">開啟 Google 地圖</a></p>
    `;
  }
  if (storeCard) storeCard.innerHTML = finalCtaBlock('直接透過 怎麼選龜鹿？', '把你想問的產品、數量或使用方式傳給我們，我們會協助整理。', sourceLineText('contact'));
}

function fillProducts(targetId, products) {
  const list = document.getElementById(targetId);
  if (!list) return;

  list.innerHTML = products.map(p => {
    const thumb = p.image || (p.gallery && p.gallery[0]);
    return `
      <article class="product-card reveal" data-product-id="${p.id}" tabindex="0" role="button" aria-label="查看 ${p.displayName || p.name} 詳細介紹">
        <div class="product-card__img">
          <img src="${thumb}" alt="${p.name}" loading="lazy" decoding="async">
        </div>
        <div class="product-card__body">
          <p class="eyebrow">${p.series || ''}</p>
          <h3>${p.displayName || p.name}</h3>
          <p>${p.description}</p>
          <p class="product-hint">第一次了解，可先從生活方式選，不一定要一次看完全部。</p>
          <p class="muted">規格：${p.size}</p>
          <div class="product-card__actions">
            <button class="btn btn-outline" type="button">查看詳情</button>
            ${lineButton('這個適合我嗎？', productFitText((typeof p !== 'undefined' ? (p.displayName || p.name) : (product.displayName || product.name))))}
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

function renderSpecOptions(p) {
  if (!p.specOptions || !p.specOptions.length) return '';
  return `
    <div class="modal-section spec-options">
      <h3>規格選擇</h3>
      ${p.specOptions.map(opt => `
        <div class="spec-option-card">
          <strong>${opt.title}</strong>
          <ul>${(opt.lines || []).map(line => `<li>${line}</li>`).join('')}</ul>
        </div>
      `).join('')}
    </div>
  `;
}

function openProductModal(p, sourceEl) {
  const modal = document.getElementById('product-modal');
  const body = document.getElementById('product-modal-body');
  if (!modal || !body) return;

  lastFocusedCard = sourceEl || document.activeElement;
  const gallery = Array.from(new Set(((p.gallery && p.gallery.length) ? p.gallery : [p.image]).filter(Boolean)));

  body.innerHTML = `
    <div class="modal-top">
      <div class="modal-gallery">
        ${gallery.map((src, idx) => `
          <div class="modal-gallery__item">
            <img src="${src}" alt="${p.name} 圖片 ${idx + 1}" loading="lazy" decoding="async">
          </div>
        `).join('')}
      </div>
      <div class="modal-copy">
        <p class="eyebrow">${p.series || '仙加味・龜鹿'}</p>
        <h2>${p.displayName || p.name}</h2>
        <p>${p.description}</p>
        <p class="muted">規格：${p.size}</p>
        ${renderSpecOptions(p)}

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
            ${lineButton('這個適合我嗎？', productFitText((typeof p !== 'undefined' ? (p.displayName || p.name) : (product.displayName || product.name))))}
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
}

function finalCtaBlock(title, desc, message = '我想看龜鹿怎麼選，幫我整理一個方向。') {
  return `
    <section class="final-cta reveal">
      <h3>${title}</h3>
      <p>${desc}</p>
      <div class="final-cta__actions">
        ${lineButton('這個適合我嗎？', message)}
      </div>
    </section>
  `;
}

window.closeModal = closeModal;
