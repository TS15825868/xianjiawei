let SITE_DATA = null;

const MENU_GROUPS = [
  { title: '🏠 首頁', links: [{ href: 'index.html', label: '首頁' }] },
  { title: '📦 產品用途與挑選', links: [
    { href: 'products.html', label: '龜鹿系列／產品學堂' },
    { href: 'choose.html', label: '怎麼選龜鹿' },
    { href: 'combo.html', label: '套餐搭配' },
    { href: 'dm.html', label: '產品DM' }
  ] },
  { title: '🍵 食補使用與內容', links: [
    { href: 'guide.html', label: '怎麼使用／補養日常' },
    { href: 'recipes.html', label: '料理搭配' },
    { href: 'video.html', label: '觀點影片' },
    { href: 'knowledge.html', label: '漢方知識館' },
    { href: 'hanfang-baike.html', label: '漢方百科' },
    { href: 'sources.html', label: '資料來源與引用原則' }
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
    try {
      await loadData();
    } catch (e) {
      console.warn('data.json 載入失敗，先顯示選單外殼', e);
      SITE_DATA = {
        brand: '仙加味',
        lineId: '@762jybnm',
        products: [],
        combos: [],
        offers: { comboOffers: [] },
        recommend: [],
        recipes: [],
        videos: [],
        faqs: []
      };
    }

    buildShell();
    renderFloatingLineCta();
    hydrateStaticFields();
    renderPage();
    renderMascotGuide();
    initReveal();
    bindGlobalEvents();
  } catch (err) {
    console.error('網站初始化失敗：', err);
  }
});

async function loadData() {
  if (SITE_DATA) return SITE_DATA;

  const res = await fetch('data.json?v=302.0');

  if (!res.ok) {
    throw new Error(`data.json 載入失敗：${res.status}`);
  }

  SITE_DATA = await res.json();
  return SITE_DATA;
}

function getLineId() {
  return SITE_DATA?.lineId || '@762jybnm';
}

function normalizeLineIntent(message = '') {
  const text = String(message || '').trim();
  if (!text) return '看產品';
  if (/^(產品詳情|使用方式|選擇數量|加入購物車|搭配方案|搭配組數|加入組合)｜/.test(text)) return text;
  if (/^(看產品|直接下單|幫我推薦|搭配組合|怎麼使用|價格方案|品牌故事|人工客服|料理搭配)$/.test(text)) return text;

  const product = (SITE_DATA?.products || []).find(item => {
    const names = [item.id, item.name, item.displayName, ...(item.aliases || [])].filter(Boolean);
    return names.some(name => text.includes(String(name)));
  });
  if (product) {
    if (/怎麼用|使用方式|食用方式|成分/.test(text)) return `使用方式｜${product.id}`;
    return `產品詳情｜${product.id}`;
  }

  if (/價格|售價|價錢|多少錢|活動|優惠/.test(text)) return '價格方案';
  if (/套餐|搭配組合|搭配方式|料理搭配|燉湯|熱飲.*調飲/.test(text)) return '搭配組合';
  if (/怎麼使用|使用方式|食用方式|怎麼用/.test(text)) return '怎麼使用';
  if (/FAQ|聯絡|客服|問題想詢問|配送|付款|通路合作|診所|中藥店|門市|取貨|自取/.test(text)) return '人工客服';
  if (/品牌|四代|鹿角伯|了解仙加味/.test(text)) return '品牌故事';
  if (/推薦|比較|差異|怎麼選|適合|產品整理|規格比較/.test(text)) return '幫我推薦';
  return '看產品';
}

function lineIntentButtonLabel(message = '', fallbackLabel = '看產品') {
  const intent = normalizeLineIntent(message);
  const labels = {
    '看產品': '看產品',
    '直接下單': '直接下單',
    '幫我推薦': '幫我推薦',
    '搭配組合': '搭配組合',
    '怎麼使用': '怎麼使用',
    '價格方案': '價格方案',
    '品牌故事': '品牌故事',
    '人工客服': '人工客服',
    '料理搭配': '搭配組合'
  };

  if (labels[intent]) return labels[intent];

  const parts = intent.split('｜');
  const action = parts[0] || '';
  const productId = parts[1] || '';
  const product = (SITE_DATA?.products || []).find(item => item.id === productId);
  const productName = product?.displayName || product?.name || '產品';

  if (action === '產品詳情') return `看${productName}`;
  if (action === '使用方式') return `${productName}使用方式`;
  if (action === '選擇數量') return '選擇數量';
  if (action === '加入購物車') return '加入購物車';
  if (action === '搭配方案') return '搭配組合';
  if (action === '搭配組數') return '選擇組數';
  if (action === '加入組合') return '加入購物車';

  const cleaned = String(fallbackLabel || '').replace(/^LINE\s*/i, '').trim();
  return cleaned || '看產品';
}

function buildLineAutoLink(message = '看產品') {
  const lineId = encodeURIComponent(getLineId());
  const text = encodeURIComponent(normalizeLineIntent(message));
  return `https://line.me/R/oaMessage/${lineId}/?${text}`;
}

function lineButton(label = '看產品', text = '看產品') {
  const intent = normalizeLineIntent(text);
  const url = buildLineAutoLink(intent);
  const visibleLabel = lineIntentButtonLabel(intent, label);
  return `<a class="btn btn-line" href="${url}" target="_blank" rel="noopener" aria-label="官方 LINE｜${visibleLabel}">${visibleLabel}</a>`;
}

function sourceLineText(page = '') {
  const map = {
    home: '幫我推薦',
    '404': '看產品',
    dm: '看產品',
    'product-detail': '看產品',
    products: '看產品',
    combo: '搭配組合',
    choose: '幫我推薦',
    guide: '怎麼使用',
    recipes: '料理搭配',
    video: '幫我推薦',
    knowledge: '幫我推薦',
    'hanfang-baike': '看產品',
    sources: '看產品',
    brand: '品牌故事',
    faq: '人工客服',
    contact: '人工客服'
  };
  return map[page] || '看產品';
}

function pageLineButton(label = 'LINE 比較產品') {
  return lineButton(label, sourceLineText(document.body?.dataset?.page || 'home'));
}

function productFitText(product = '') {
  if (product && typeof product === 'object' && product.id) return `產品詳情｜${product.id}`;
  const name = String(product || '').trim();
  const matched = (SITE_DATA?.products || []).find(item =>
    [item.name, item.displayName, ...(item.aliases || [])].filter(Boolean).some(value => name.includes(String(value)))
  );
  return matched?.id ? `產品詳情｜${matched.id}` : '看產品';
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

function renderFloatingLineCta() {
  if (document.getElementById('floating-line-cta')) return;
  const intent = sourceLineText(document.body?.dataset?.page || 'home');
  const visibleLabel = lineIntentButtonLabel(intent, '看產品');
  const link = document.createElement('a');
  link.id = 'floating-line-cta';
  link.className = 'floating-line-cta';
  link.href = buildLineAutoLink(intent);
  link.target = '_blank';
  link.rel = 'noopener';
  link.setAttribute('aria-label', `官方 LINE｜${visibleLabel}`);
  link.innerHTML = `<span class="floating-line-cta__dot" aria-hidden="true">LINE</span><span>${visibleLabel}</span>`;
  document.body.appendChild(link);
}

function hydrateStaticFields() {
  document.querySelectorAll('[data-line-url]').forEach(el => {
    const msg = normalizeLineIntent(el.dataset.lineMessage || sourceLineText(document.body?.dataset?.page || 'home'));
    const visibleLabel = lineIntentButtonLabel(msg, el.textContent || '看產品');
    el.setAttribute('href', buildLineAutoLink(msg));
    el.textContent = visibleLabel;
    el.setAttribute('aria-label', `官方 LINE｜${visibleLabel}`);
  });

  document.querySelectorAll('[data-line-id]').forEach(el => {
    el.textContent = getLineId();
  });

  document.querySelectorAll('[data-brand-name]').forEach(el => {
    el.textContent = SITE_DATA.brand || '仙加味';
  });

  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
}

function renderHeaderBar() {
  const brand = SITE_DATA?.brand || '仙加味';
  return `
    <div class="header-inner">
      <a class="brand-mark" href="index.html" aria-label="${brand}｜補養，是一種節奏。">
        <img src="images/logo.png" alt="${brand}" decoding="async">
        <span class="brand-mark__copy">
          <span class="brand-mark__name">${brand}</span>
          <span class="brand-mark__tagline">補養，是一種節奏。</span>
        </span>
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
          <p class="menu-line-cta__title">官方 LINE 詢問</p>
          <p class="menu-line-cta__id">LINE ID：<strong>${getLineId()}</strong></p>
          ${lineButton('LINE 詢問產品', '看產品')}
        </div>
      </aside>
    </nav>
  `;
}

function renderFooter() {
  return `
    <div class="footer-card card">
      <div class="footer-brand-block">
        <strong>${SITE_DATA?.brand || '仙加味'}</strong>
        <p>補養，是一種節奏。</p>
        <p>清楚認識產品型態、規格與使用方式。</p>
        <p>${SITE_DATA?.heritage?.footer || '從萬華出發・傳承工藝・回歸日常'}</p>
      </div>

      <div class="footer-line-box">
        <div class="footer-line-logo">
          <img src="images/logo.png" alt="仙加味 LOGO" loading="lazy" decoding="async">
        </div>

        <div class="footer-line-copy">
          <p class="footer-line-title">官方 LINE</p>
          <p class="footer-line-id">
            LINE ID：<strong>${getLineId()}</strong>
          </p>

          <p class="muted">想了解產品規格、成分、使用方式與購買資訊，歡迎透過官方 LINE 詢問。</p>

          <p>
            ${lineButton(
              'LINE 詢問產品',
              '看產品'
            )}
          </p>
        </div>

        <img
          class="line-qr-small"
          src="images/line-qr.jpg"
          alt="仙加味官方 LINE QR Code"
          loading="lazy"
          decoding="async"
        >
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

    if (
      e.target.closest('[data-close-menu="1"]') ||
      e.target.closest('.site-menu__panel a') ||
      e.target.closest('#menu-close')
    ) {
      closeMenu();
    }

    if (
      e.target.closest('[data-close-modal="1"]') ||
      e.target.closest('#product-modal-close')
    ) {
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
  if (page === 'hanfang-baike') renderHanfangBaike();
  if (page === 'video') renderVideosPage();
  if (page === 'faq') renderFaqPage();
  if (page === 'brand') renderBrandPage();
  if (page === 'contact') renderContactPage();
}


const MASCOT_IMAGES = {
  welcome: 'images/brand/xianjiawei-scene-welcome.jpg?v=302.0',
  products: 'images/brand/xianjiawei-scene-products.jpg?v=302.0',
  guide: 'images/brand/xianjiawei-scene-guide.jpg?v=302.0',
  service: 'images/brand/xianjiawei-scene-service.jpg?v=302.0',
  usage: 'images/brand/xianjiawei-scene-usage.jpg?v=302.0'
};

function renderMascotGuide() {
  const page = document.body?.dataset?.page || '';
  const config = {
    home: {
      image: 'welcome', eyebrow: '歡迎認識仙加味',
      title: '先從你平常想怎麼使用開始',
      text: '依固定安排、方便即飲、沖泡燉湯、家庭規格或自行調飲來比較，找到適合日常節奏的產品型態。',
      actions: `${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="products.html">看產品</a>`
    },
    products: {
      image: 'products', eyebrow: '小老闆帶你看產品',
      title: '不同型態，使用方式也不一樣',
      text: '從龜鹿膏、龜鹿飲30cc、龜鹿湯塊、龜鹿膠到鹿茸粉，依規格、成分與生活情境逐一比較。',
      actions: `${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="choose.html">怎麼選</a>`
    },
    choose: {
      image: 'guide', eyebrow: '不知道怎麼選？',
      title: '先看使用情境，再決定產品型態',
      text: '固定安排、方便即飲、沖泡燉湯、家庭使用或自行搭配飲品，都可以從平常習慣開始比較。',
      actions: `${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="products.html">看全部產品</a>`
    },
    combo: {
      image: 'products', eyebrow: '日常搭配導覽',
      title: '依生活節奏查看搭配組合',
      text: '每組內容、價格、可選組數與活動，都會在正式方案卡中清楚列出。',
      actions: `${lineButton('搭配組合', '搭配組合')}<a class="btn btn-outline" href="products.html">先看產品</a>`
    },
    guide: {
      image: 'usage', eyebrow: '使用方式清楚整理',
      title: '沖泡、即飲與燉湯，都有適合的安排',
      text: '依產品型態查看取用方式、建議時段、搭配方式與保存資訊，讓日常使用更順手。',
      actions: `${lineButton('怎麼使用', '怎麼使用')}<a class="btn btn-outline" href="faq.html">看常見問題</a>`
    },
    recipes: {
      image: 'usage', eyebrow: '料理與熱飲搭配',
      title: '從原本熟悉的飲食方式開始',
      text: '用沖泡、調飲或燉湯的方式，把產品自然放進每天的飲食節奏。',
      actions: `${lineButton('料理搭配', '料理搭配')}<a class="btn btn-outline" href="guide.html">看使用方式</a>`
    },
    video: {
      image: 'guide', eyebrow: '一起看原料與工序',
      title: '用影片認識傳統食補文化',
      text: '從原料、處理方式與日常觀點開始理解；產品資訊仍以仙加味正式頁面為準。',
      actions: `${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="knowledge.html">看知識內容</a>`
    },
    knowledge: {
      image: 'guide', eyebrow: '食材與日常觀點',
      title: '把傳統資料整理成容易理解的內容',
      text: '內容以食材文化、原料與日常使用觀點為主，不代替醫療診斷或個人體質判斷。',
      actions: `${lineButton('看產品', '看產品')}<a class="btn btn-outline" href="sources.html">查看資料來源</a>`
    },
    'hanfang-baike': {
      image: 'guide', eyebrow: '漢方資料導覽',
      title: '先了解資料出處，再認識食材文化',
      text: '古籍與藥典內容會標示來源與引用原則，並與產品資訊清楚區分。',
      actions: `${lineButton('看產品', '看產品')}<a class="btn btn-outline" href="sources.html">資料來源</a>`
    },
    sources: {
      image: 'guide', eyebrow: '資料來源與引用原則',
      title: '來源清楚，內容才看得安心',
      text: '引用古籍、藥典與公開資料時，保留出處、年代與適用範圍，不延伸為產品療效宣稱。',
      actions: `${lineButton('人工客服', '人工客服')}<a class="btn btn-outline" href="knowledge.html">回知識館</a>`
    },
    brand: {
      image: 'welcome', eyebrow: '從萬華出發',
      title: '延續四代對原料、工序與信用的重視',
      text: '仙加味把多年累積的經驗整理成清楚的產品資訊與日常使用方式，讓傳統更容易被今天的人理解。',
      actions: `${lineButton('看產品', '看產品')}<a class="btn btn-outline" href="contact.html">聯絡我們</a>`
    },
    faq: {
      image: 'service', eyebrow: '常見問題一次整理',
      title: '產品差異、使用方式與購買流程',
      text: '先查看常見問題；需要確認規格、數量、配送或付款方式時，再由官方 LINE 協助。',
      actions: `${lineButton('人工客服', '人工客服')}<a class="btn btn-outline" href="products.html">看產品</a>`
    },
    contact: {
      image: 'service', eyebrow: '官方 LINE 與門市服務',
      title: '歡迎留下想了解的產品與需求',
      text: '提供產品名稱、規格、數量或取貨方式，我們會依實際庫存與安排協助確認。',
      actions: `${lineButton('人工客服', '人工客服')}<a class="btn btn-outline" href="products.html">先看產品</a>`
    },
    dm: {
      image: 'products', eyebrow: '產品快速整理',
      title: '先掌握產品型態、規格與使用方向',
      text: '快速比較各產品差異，再進入產品頁查看完整成分、使用與保存資訊。',
      actions: `${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="products.html">完整產品頁</a>`
    },
    'product-detail': {
      image: 'products', eyebrow: '產品資訊',
      title: '先看規格、成分與使用方式',
      text: '產品頁以正式標示為準；需要確認價格、數量、活動或出貨時間，可透過官方 LINE 詢問。',
      actions: `${lineButton('看產品', '看產品')}<a class="btn btn-outline" href="products.html">比較其他產品</a>`
    }
  }[page];

  if (!config || document.getElementById('mascot-guide')) return;
  const hero = document.querySelector('main .hero');
  if (!hero) return;
  const section = document.createElement('section');
  section.id = 'mascot-guide';
  section.className = 'section mascot-guide-section';
  section.innerHTML = `
    <article class="mascot-guide-card reveal">
      <div class="mascot-guide-card__media">
        <img src="${MASCOT_IMAGES[config.image] || MASCOT_IMAGES.welcome}" alt="仙加味小老闆情境導覽" width="960" height="1200" loading="eager" decoding="async">
      </div>
      <div class="mascot-guide-card__copy">
        <p class="eyebrow">${config.eyebrow}</p>
        <h2>${config.title}</h2>
        <p>${config.text}</p>
        <div class="hero-actions">${config.actions}</div>
      </div>
    </article>
  `;
  hero.insertAdjacentElement('afterend', section);
}

function renderHome() {
  fillProducts('home-products', SITE_DATA.products || []);

  const comboWrap = document.getElementById('home-combo-list');

  if (comboWrap && SITE_DATA.offers?.comboOffers?.length) {
    comboWrap.innerHTML = SITE_DATA.offers.comboOffers.slice(0, 2).map((combo, index) => `
      <article class="card combo-card--featured reveal">
        ${index === 0 ? `<div class="combo-badge">最常先看這組</div>` : `<div class="combo-badge">想方便的人常看</div>`}
        <p class="eyebrow">首頁精選搭配</p>
        <h3>${combo.name}</h3>
        <p>${combo.desc}</p>
        <p class="muted">內容：${Array.isArray(combo.items) ? combo.items.join('＋') : ''}</p>
        ${combo.gift ? `<p class="accent">附贈：${combo.gift}</p>` : ''}
        <div class="final-cta__actions">
          ${lineButton('選擇組數', `搭配組數｜${index}`)}
          <a class="btn btn-outline" href="combo.html">看完整搭配</a>
        </div>
      </article>
    `).join('');
  }
}

function renderProductsPage() {
  fillProducts('product-list', SITE_DATA.products || []);

  const compare = document.getElementById('compare-grid');

  if (compare) {
    compare.innerHTML = (SITE_DATA.products || []).map(p => `
      <article class="card reveal">
        <p class="eyebrow">${p.size || ''}</p>
        <h3>${p.displayName || p.name || ''}</h3>
        ${p.purpose ? `<p class="product-purpose">用途方向：${p.purpose}</p>` : ''}
        <p>${p.description || ''}</p>
        <div class="final-cta__actions">
          ${lineButton('LINE 詢問產品', productFitText(p))}
        </div>
      </article>
    `).join('');
  }
}

function renderChoosePage() {
  const el = document.getElementById('choose-results');
  if (!el) return;

  const recommend = Array.isArray(SITE_DATA.recommend) ? SITE_DATA.recommend : [];

  el.innerHTML = recommend.map(r => `
    <article class="card reveal">
      <p class="eyebrow">${r.keyword || ''}</p>
      <h3>${r.result || ''}</h3>
      <p>${r.desc || ''}</p>
      <div class="final-cta__actions">
        <a class="btn btn-outline" href="products.html">看產品</a>
        ${lineButton('LINE 詢問產品', `我目前是「${r.keyword || '不確定'}」，想看哪一種比較適合我。`)}
      </div>
    </article>
  `).join('') + finalCtaBlock(
    '不確定怎麼挑也沒關係',
    '直接跟我們說你的生活方式，我們幫你整理比較適合的方向。',
    sourceLineText('choose')
  );
}

function renderComboPage() {
  const el = document.getElementById('combo-grid');
  if (!el) return;

  const combos = SITE_DATA.offers?.comboOffers || [];

  el.innerHTML = combos.map((combo, index) => `
    <article class="card combo-card--featured reveal">
      ${index === 0 ? `<div class="combo-badge">最常先看這組</div>` : `<div class="combo-badge">搭配方案</div>`}
      <h3>${combo.name || ''}</h3>
      <p>${combo.desc || ''}</p>
      <p class="muted">內容：${Array.isArray(combo.items) ? combo.items.join('＋') : ''}</p>
      ${combo.gift ? `<p class="accent">附贈：${combo.gift}</p>` : ''}
      <div class="final-cta__actions">
        ${lineButton('選擇組數', `搭配組數｜${index}`)}
      </div>
    </article>
  `).join('') + finalCtaBlock(
    '想直接由我們幫你搭配',
    '不用自己慢慢比，直接用 LINE 告訴我們你的生活方式，我們幫你整理。',
    '我想看適合我的龜鹿搭配，請幫我整理。'
  );
}

function renderGuidePage() {
  const items = Array.isArray(SITE_DATA.pageContent?.guide)
    ? SITE_DATA.pageContent.guide
    : [];

  const html = items.map((item, index) => `
    <article class="card guide-card reveal">
      <p class="eyebrow">使用 ${index + 1}</p>
      <h3>${item.title || ''}</h3>
      <p class="preline">${item.desc || ''}</p>
    </article>
  `).join('');

  const target =
    document.getElementById('guide-steps') ||
    document.getElementById('guide-notes') ||
    document.getElementById('guide-grid');

  if (target) {
    target.innerHTML = html + finalCtaBlock(
      '想知道自己適合哪種方式',
      '直接用 LINE 告訴我們你平常是想熱飲、燉湯或方便即飲。',
      sourceLineText('guide')
    );
    return;
  }

  const main = document.querySelector('main.page');

  if (main && !document.getElementById('guide-dynamic-grid')) {
    main.insertAdjacentHTML(
      'beforeend',
      `<section class="section">
        <div class="section-title">
          <p class="eyebrow">使用整理</p>
          <h2>五種產品使用方式</h2>
        </div>
        <div class="grid cards-2" id="guide-dynamic-grid">${html}</div>
        ${finalCtaBlock(
          '想知道自己適合哪種方式',
          '直接用 LINE 告訴我們你平常是想熱飲、燉湯或方便即飲。',
          sourceLineText('guide')
        )}
      </section>`
    );
  }
}

function renderRecipesPage() {
  const el = document.getElementById('recipe-grid');
  if (!el) return;

  const recipes = Array.isArray(SITE_DATA.recipes)
    ? SITE_DATA.recipes
    : (Array.isArray(SITE_DATA.pageContent?.recipes) ? SITE_DATA.pageContent.recipes : []);

  if (!recipes.length) {
    el.innerHTML = `
      <article class="card reveal">
        <p class="eyebrow">料理搭配</p>
        <h3>料理內容整理中</h3>
        <p>目前料理搭配內容正在整理，若想了解龜鹿膏、龜鹿湯塊、龜鹿膠或鹿茸粉怎麼搭配，可以先透過官方 LINE 詢問。</p>
      </article>
    ` + finalCtaBlock(
      '想直接問哪一種比較適合',
      '如果你比較偏熱飲、燉湯或調飲，也可以直接用 LINE 問我們。',
      '我想看我比較適合熱飲、燉湯還是調飲。'
    );
    return;
  }

  el.innerHTML = recipes.map(r => {
    const title = r.title || '料理搭配';
    const desc = r.desc || r.description || '';
    const category = r.category || '日常搭配';
    const steps = Array.isArray(r.steps) ? r.steps : [];

    return `
      <article class="card reveal">
        <p class="eyebrow">${category}</p>
        <h3>${title}</h3>
        <p>${desc}</p>
        ${
          steps.length
            ? `<ol>${steps.map(s => `<li>${s}</li>`).join('')}</ol>`
            : ''
        }
      </article>
    `;
  }).join('') + finalCtaBlock(
    '想直接問哪一種比較適合',
    '如果你比較偏熱飲、燉湯或調飲，也可以直接用 LINE 問我們。',
    '我想看我比較適合熱飲、燉湯還是調飲。'
  );
}

function renderKnowledgePage() {
  const el = document.getElementById('knowledge-grid');
  if (!el) return;

  const items = [
    ['從食補用途出發', '先了解固定取用、即飲便利、沖泡燉湯、大規格與自行調飲，再比較產品。'],
    ['從食材與工序出發', '鹿角、龜板與日常食材經過整理，形成膏、飲、湯塊、膠與粉等型態。'],
    ['從使用方式出發', '小匙取用、開瓶即飲、熱水沖泡、保溫壺與家常燉湯，都是實際用途方向。'],
    ['從食補文化出發', '古籍用於理解傳統名稱與文化；產品選擇仍以現行成分標示、規格與使用方式為準。']
  ];

  el.innerHTML = items.map(([title, desc]) => `
    <article class="card reveal">
      <h3>${title}</h3>
      <p>${desc}</p>
    </article>
  `).join('') + finalCtaBlock(
    '想從比較適合自己的方式開始',
    '不用自己慢慢比較，直接 LINE 告訴我們偏好的食補方式，我們幫你整理。',
    '我想看比較適合我的龜鹿方式。'
  );
}

function renderVideosPage() {
  const count = document.getElementById('video-count');
  const grid = document.getElementById('video-grid');
  const videos = Array.isArray(SITE_DATA.videos) ? SITE_DATA.videos : [];

  if (count) count.textContent = videos.length;
  if (!grid) return;

  const channelUrl = SITE_DATA.tiktokChannel || 'https://www.tiktok.com/@changwuchi2023';
  const groups = ['龜鹿系列', '鹿茸系列', '中醫師觀點'];

  const top = `
    <article class="card video-card reveal grid-span-2">
      <p class="eyebrow">合作中醫師</p>
      <h3>章無忌中醫師 TikTok 頻道</h3>
      <p>本頁整理 ${videos.length} 支公開影片入口，依龜鹿系列、鹿茸系列與中醫師觀點分類。影片不自動播放，點擊後開啟 TikTok。</p>
      <a class="btn btn-line" href="${channelUrl}" target="_blank" rel="noopener">觀看 TikTok 頻道</a>
    </article>

    ${groups.map(g => `
      <article class="card reveal">
        <p class="eyebrow">影片分類</p>
        <h3>${g}</h3>
        <p>${videos.filter(v => v.category === g).length} 支影片</p>
      </article>
    `).join('')}
  `;

  const cards = videos.map((v, i) => `
    <article class="card video-card reveal">
      <p class="eyebrow">${v.category || '影片'}</p>
      <h3>${i + 1}. ${v.title || '影片'}</h3>
      <p>整理自公開平台，點擊後開啟原影片。</p>
      <a class="btn btn-outline" href="${v.url || '#'}" target="_blank" rel="noopener">開啟影片</a>
    </article>
  `).join('');

  grid.innerHTML = top + cards + finalCtaBlock(
    '看完還是不確定怎麼選',
    '直接用 LINE 跟我們說你平常偏好熱飲、燉湯或方便即飲，我們幫你整理。',
    sourceLineText('video')
  );
}

function renderFaqPage() {
  const el = document.getElementById('faq-grid');
  if (!el || el.dataset.staticContent === 'true') return;

  const faqs = Array.isArray(SITE_DATA.faq)
    ? SITE_DATA.faq
    : (Array.isArray(SITE_DATA.faqs) ? SITE_DATA.faqs : []);

  const groups = [...new Set(faqs.map(f => f.category || '常見問題'))];

  el.innerHTML = groups.map(group => `
    <div class="grid-span-2 faq-category reveal">
      <p class="eyebrow">FAQ</p>
      <h2>${group}</h2>
    </div>

    ${faqs.filter(f => (f.category || '常見問題') === group).map(f => `
      <details class="faq-item reveal">
        <summary>${f.q || ''}</summary>
        <div class="faq-item__body">
          <p>${f.a || ''}</p>
        </div>
      </details>
    `).join('')}
  `).join('') + finalCtaBlock(
    '還是不確定怎麼選？',
    '可以提供偏好的使用情境、規格與數量，我們協助整理產品差異與購買資訊。',
    sourceLineText('faq')
  );
}

function renderRecommendPage() {
  const el = document.getElementById('recommend-grid');
  if (!el) return;

  const recommend = Array.isArray(SITE_DATA.recommend) ? SITE_DATA.recommend : [];

  el.innerHTML = recommend.map(r => `
    <article class="card reveal">
      <p class="eyebrow">${r.keyword || ''}</p>
      <h3>${r.result || ''}</h3>
      <p>${r.desc || ''}</p>
      <div class="final-cta__actions">
        <a class="btn btn-outline" href="products.html">看產品</a>
        ${lineButton('LINE 詢問產品', `我目前是「${r.keyword || '不確定'}」，想請你幫我看適合哪一種。`)}
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
    const items = Array.isArray(b.timeline) ? b.timeline : [];

    timeline.innerHTML = items.map((item, idx) => `
      <article class="card timeline-card reveal">
        <p class="eyebrow">${String(idx + 1).padStart(2, '0')}</p>
        <h3>${item.title || ''}</h3>
        <p>${item.desc || ''}</p>
      </article>
    `).join('');
  }

  if (store) {
    store.innerHTML = `
      <p class="eyebrow">回到萬華</p>
      <h3>${s.name || '萬華門市'}｜${s.address || '台北市萬華區西昌街52號'}</h3>
      <p>${s.heritage || '萬華老店・四代鹿角工序傳承'}</p>
      <p>如果你在萬華附近，可以先查看門市位置；若想了解產品型態與搭配方式，也可以先用官方 LINE 詢問。</p>

      <div class="final-cta__actions">
        <a class="btn btn-outline" href="${s.mapUrl || 'https://www.google.com/maps?q=台北市萬華區西昌街52號'}" target="_blank" rel="noopener">開啟地圖</a>
        ${lineButton('LINE 詢問產品', '我想了解萬華門市與龜鹿產品，幫我整理一個方向。')}
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

  const askItems = [
    '想知道適合哪一種龜鹿產品',
    '想了解價格與活動方案',
    '想詢問配送、門市自取或雙北親送',
    '想洽談中藥店、診所或通路合作'
  ];

  if (askList) {
    askList.innerHTML = askItems.map(x => `<li>${x}</li>`).join('');
  }

  if (payments) {
    payments.innerHTML = (SITE_DATA.payments || [
      '現金付款',
      '匯款',
      '貨到付款',
    ]).map(x => `<li>${x}</li>`).join('');
  }

  if (shipping) {
    shipping.innerHTML = (SITE_DATA.shipping || [
      '宅配',
      '7-11賣貨便',
      '門市自取',
      '雙北親送'
    ]).map(x => `<li>${x}</li>`).join('');
  }

  if (notes) {
    const contactNotes = Array.isArray(SITE_DATA.pageContent?.contactNotes)
      ? SITE_DATA.pageContent.contactNotes
      : [];

    notes.innerHTML = contactNotes.map(x => `<li>${x}</li>`).join('');
  }

  if (storeInfo) {
    const store = SITE_DATA.store || {};

    storeInfo.innerHTML = `
      <p><strong>門市地址：</strong>${store.address || '台北市萬華區西昌街52號'}</p>
      <p><strong>官方 LINE：</strong>${SITE_DATA.lineId || '@762jybnm'}</p>
      <p>${store.pickupNote || '門市自取請先透過官方 LINE 確認取貨時間。'}</p>
      <p>
        <a
          class="btn btn-outline"
          href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address || '台北市萬華區西昌街52號')}"
          target="_blank"
          rel="noopener"
        >
          開啟 Google 地圖
        </a>
      </p>
    `;
  }

  if (storeCard) {
    storeCard.innerHTML = finalCtaBlock(
      '直接透過 LINE 詢問',
      '把你想問的產品、數量或使用方式傳給我們，我們會協助整理。',
      sourceLineText('contact')
    );
  }
}

function fillProducts(targetId, products) {
  const list = document.getElementById(targetId);
  if (!list) return;

  const safeProducts = Array.isArray(products) ? products : [];

  list.innerHTML = safeProducts.map(p => {
    const thumb = p.image || (Array.isArray(p.gallery) && p.gallery[0]) || 'images/logo.png';

    return `
      <article id="${p.id === 'guilu-drink-30' ? 'guilu-drink' : (p.id || '')}" class="product-card reveal" data-product-id="${p.id || ''}" tabindex="0" role="button" aria-label="查看 ${p.displayName || p.name || '產品'} 詳細介紹">
        <div class="product-card__img">
          <img src="${thumb}" alt="${p.name || '仙加味產品'}" loading="lazy" decoding="async">
        </div>

        <div class="product-card__body">
          <p class="eyebrow">${p.series || ''}</p>
          <h3>${p.displayName || p.name || ''}</h3>
          ${p.purpose ? `<p class="product-purpose">用途方向：${p.purpose}</p>` : ''}
          <p>${p.description || ''}</p>
          <p class="product-hint">可依使用情境、產品型態與規格比較，選擇符合日常安排的品項。</p>
          <p class="muted">規格：${p.size || ''}</p>

          <div class="product-card__actions">
            <a class="btn btn-outline" href="${p.page || p.detailPage || 'products.html'}">完整介紹</a>
            <button class="btn btn-outline" type="button" data-quick-view="1">快速查看</button>
            ${lineButton('LINE 詢問產品', productFitText(p))}
          </div>
        </div>
      </article>
    `;
  }).join('');

  list.querySelectorAll('[data-product-id]').forEach(card => {
    const handler = (e) => {
      if (e && e.target.closest('a')) return;
      if (e && e.target.closest('button') && !e.target.closest('[data-quick-view]')) return;

      const p = safeProducts.find(x => x.id === card.dataset.productId);
      if (p) openProductModal(p, card);
    };

    card.addEventListener('click', handler);

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();

        const p = safeProducts.find(x => x.id === card.dataset.productId);
        if (p) openProductModal(p, card);
      }
    });
  });
}

function renderSpecOptions(p) {
  if (!Array.isArray(p.specOptions) || !p.specOptions.length) return '';

  return `
    <div class="modal-section spec-options">
      <h3>規格選擇</h3>
      ${p.specOptions.map(opt => `
        <div class="spec-option-card">
          <strong>${opt.title || ''}</strong>
          <ul>${(Array.isArray(opt.lines) ? opt.lines : []).map(line => `<li>${line}</li>`).join('')}</ul>
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

  // v253 強制規則：
  // 產品卡片只用 p.image（實際外包裝）。
  // 產品詳情彈窗只用 p.dmImage / p.detailImages[0]（一張 DM）。
  // 不再讀取 gallery，不再顯示產品照。
  const detailImage =
    p.dmImage ||
    (Array.isArray(p.detailImages) && p.detailImages[0]) ||
    'images/logo.png';

  body.innerHTML = `
    <div class="modal-top modal-top--dm-only">
      <div class="modal-gallery modal-gallery--single modal-gallery--dm-only">
        <div class="modal-gallery__item modal-gallery__item--dm-only">
          <img src="${detailImage}" alt="${p.name || '產品'} 產品DM" loading="lazy" decoding="async">
        </div>
      </div>

      <div class="modal-copy">
        <p class="eyebrow">${p.series || '仙加味'}</p>
        <h2>${p.displayName || p.name || ''}</h2>
        ${p.purpose ? `<p class="product-purpose">用途方向：${p.purpose}</p>` : ''}
        <p>${p.description || ''}</p>
        <p class="muted">規格：${p.size || ''}</p>

        ${renderSpecOptions(p)}

        <div class="modal-section">
          <h3>成分</h3>
          <p>${(Array.isArray(p.ingredients) ? p.ingredients : []).join('、')}</p>
        </div>

        <div class="modal-section">
          <h3>使用方式</h3>
          <ul>${(Array.isArray(p.usage) ? p.usage : []).map(i => `<li>${i}</li>`).join('')}</ul>
        </div>

        <div class="final-cta">
          <h3>想確認這個食補用途是否符合你的習慣？</h3>
          <p>直接用 LINE 告訴我們偏好固定、即飲、沖泡、燉湯或自行搭配，我們幫你整理。</p>
          <div class="final-cta__actions">
            ${lineButton('LINE 詢問產品', productFitText(p))}
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
  const items = Array.from(document.querySelectorAll('.reveal'));
  if (!items.length) return;

  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('show'));
    return;
  }

  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('show');
      currentObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -60px 0px', threshold: 0.05 });

  items.forEach(el => observer.observe(el));
}

function finalCtaBlock(title, desc, message = '看產品') {
  return `
    <section class="final-cta reveal">
      <h3>${title}</h3>
      <p>${desc}</p>
      <div class="final-cta__actions">
        ${lineButton('LINE 詢問產品', message)}
      </div>
    </section>
  `;
}

window.closeModal = closeModal;


function makeInfoCard(title, desc) {
  return `<article class="card reveal"><h3>${title}</h3><p>${desc}</p></article>`;
}

function renderRichProducts(data) {
  const mount = document.querySelector('[data-rich-products]');
  if (!mount || !data.productGuide) return;
  mount.innerHTML = `
    <section class="section">
      <div class="section-heading reveal">
        <p class="eyebrow">產品整理</p>
        <h2>${data.productGuide.title}</h2>
        <p>${data.productGuide.intro}</p>
      </div>
      <div class="grid grid-3">
        ${data.productGuide.cards.map(i => makeInfoCard(`${i.name}｜${i.type}`, i.desc)).join('')}
      </div>
    </section>
    <section class="section">
      <div class="section-heading reveal">
        <p class="eyebrow">快速比較</p>
        <h2>常見產品差異</h2>
        <p>先看差異，再決定要從哪一款開始詢問。</p>
      </div>
      <div class="grid grid-2">
        ${data.productGuide.compare.map(i => makeInfoCard(i.title, i.desc)).join('')}
      </div>
    </section>`;
}

function renderRichGuide(data) {
  const mount = document.querySelector('[data-rich-guide]');
  if (!mount || !data.usageGuide) return;
  mount.innerHTML = `
    <section class="section">
      <div class="section-heading reveal">
        <p class="eyebrow">日常安排</p>
        <h2>${data.usageGuide.title}</h2>
        <p>${data.usageGuide.intro}</p>
      </div>
      <div class="grid grid-2">
        ${data.usageGuide.daily.map(i => makeInfoCard(i.title, i.desc)).join('')}
      </div>
    </section>
    <section class="section">
      <div class="section-heading reveal">
        <p class="eyebrow">各產品使用方式</p>
        <h2>買回去怎麼用</h2>
        <p>每一種產品的使用方式整理如下。</p>
      </div>
      <div class="grid grid-3">
        ${data.usageGuide.products.map(i => `<article class="card reveal"><h3>${i.name}</h3><ul>${i.steps.map(s => `<li>${s}</li>`).join('')}</ul></article>`).join('')}
      </div>
    </section>
    <section class="section">
      <div class="section-heading reveal">
        <p class="eyebrow">保存方式</p>
        <h2>保存也要清楚</h2>
      </div>
      <div class="card reveal"><ul>${data.usageGuide.storage.map(s => `<li>${s}</li>`).join('')}</ul></div>
    </section>`;
}

function renderRichRecipes(data) {
  const mount = document.querySelector('[data-rich-recipes]');
  if (!mount || !data.recipeGuide) return;
  mount.innerHTML = `
    <section class="section">
      <div class="section-heading reveal">
        <p class="eyebrow">料理搭配</p>
        <h2>${data.recipeGuide.title}</h2>
        <p>${data.recipeGuide.intro}</p>
      </div>
      <div class="grid grid-2">
        ${data.recipeGuide.recipes.map(r => `
          <article class="card reveal">
            <h3>${r.name}</h3>
            <p><strong>準備：</strong>${r.items.join('、')}</p>
            <ul>${r.steps.map(s => `<li>${s}</li>`).join('')}</ul>
          </article>
        `).join('')}
      </div>
      <div class="card reveal"><h3>料理提醒</h3><ul>${data.recipeGuide.notes.map(s => `<li>${s}</li>`).join('')}</ul></div>
    </section>`;
}

function renderRichFaq(data) {
  const mount = document.querySelector('[data-rich-faq]');
  if (!mount || !Array.isArray(data.faqRich)) return;
  mount.innerHTML = `
    <section class="section">
      <div class="section-heading reveal">
        <p class="eyebrow">FAQ</p>
        <h2>購買前常見問題</h2>
        <p>先看常見問題，仍不確定可以直接加入 LINE 詢問。</p>
      </div>
      <div class="faq-list">
        ${data.faqRich.map(i => `<details class="faq-item reveal"><summary>${i.q}</summary><p>${i.a}</p></details>`).join('')}
      </div>
    </section>`;
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (SITE_DATA) {
      renderRichProducts(SITE_DATA);
      renderRichGuide(SITE_DATA);
      renderRichRecipes(SITE_DATA);
      renderRichFaq(SITE_DATA);
      initReveal();
    }
  }, 600);
});


function renderBrand3Knowledge(){const el=document.getElementById('brand3-knowledge-grid');if(!el)return;const items=[['產品學堂','從產品型態了解日常使用方式','龜鹿膏、龜鹿飲、龜鹿湯塊、龜鹿膠與鹿茸粉，各自放在不同生活情境裡理解。','products.html#product-academy'],['漢方百科','從食材與文化背景開始','鹿角萃取物、龜板萃取物、枸杞、紅棗、黃耆、粉光蔘與鹿茸，以飲食文化和成分理解為主。','hanfang-baike.html'],['補養日常','從每天做得到的方式開始','熱水化開、保溫瓶、燉湯、保存與送禮等，都整理成容易理解的日常方式。','guide.html#nourishment-daily'],['品牌故事','從萬華西昌街出發','把好的東西說清楚、讓客人問得到、看得懂。','brand.html']];el.innerHTML=items.map(i=>`<article class="card knowledge-card reveal"><span class="knowledge-card__tag">仙加味知識館</span><h3>${i[0]}</h3><p>${i[1]}</p><p>${i[2]}</p><a class="btn btn-outline" href="${i[3]}">閱讀更多</a></article>`).join('');}
function renderProductAcademy(){const el=document.getElementById('product-academy-grid');if(!el)return;}
function renderHanfangBaike(){const el=document.getElementById('hanfang-baike-grid');if(!el)return;}
function renderNourishmentDaily(){const el=document.getElementById('daily-grid');if(!el)return;}



// v282：DM 大圖燈箱。修正「開啟 DM 後沒有 X 可關閉」問題。
function initDMLightboxV282() {
  const links = Array.from(document.querySelectorAll('.dm-lightbox-link'));
  if (!links.length) return;

  let lightbox = document.getElementById('dm-lightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.id = 'dm-lightbox';
    lightbox.className = 'dm-lightbox';
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-label', '產品DM大圖');
    lightbox.innerHTML = `
      <button class="dm-lightbox__close" type="button" aria-label="關閉DM大圖" data-close-dm-lightbox="1">×</button>
      <div class="dm-lightbox__panel" role="document">
        <img class="dm-lightbox__img" alt="產品DM大圖" src="" loading="eager" decoding="async">
      </div>
    `;
    document.body.appendChild(lightbox);
  }

  const img = lightbox.querySelector('.dm-lightbox__img');
  const closeBtn = lightbox.querySelector('.dm-lightbox__close');

  const open = (src, alt) => {
    if (!img || !src) return;
    img.src = src;
    img.alt = alt || '產品DM大圖';
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('dm-lightbox-open');
    closeBtn?.focus();
  };

  const close = () => {
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('dm-lightbox-open');
    if (img) img.src = '';
  };

  links.forEach(link => {
    if (link.dataset.lightboxBound === '1') return;
    link.dataset.lightboxBound = '1';
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const src = link.getAttribute('data-dm-src') || link.getAttribute('href');
      const title = link.closest('article')?.querySelector('h3')?.textContent || link.textContent || '產品DM';
      open(src, title + '產品DM大圖');
    });
  });

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.closest('[data-close-dm-lightbox="1"]')) {
      close();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.getAttribute('aria-hidden') === 'false') {
      close();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initDMLightboxV282, 300);
});
