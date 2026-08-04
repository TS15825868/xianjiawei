"use strict";

/* 仙加味網站核心｜全站統一正式版 v410.0 */
window.__XJW_V410__ = true;
let SITE_DATA = null;
let lastFocusedElement = null;

const UX_VERSION = "410.0";
const LINE_FALLBACK = "https://lin.ee/sHZW7NkR";
const MENU_GROUPS = [
  {
    title: "主要內容",
    links: [
      { href: "index.html", label: "首頁", keys: ["home", "404"] },
      { href: "products.html", label: "龜鹿系列", keys: ["products", "product-detail", "dm"] },
      { href: "choose.html", label: "怎麼選", keys: ["choose", "combo"] },
      { href: "guide.html", label: "食用方式", keys: ["guide"] },
      { href: "recipes.html", label: "料理搭配", keys: ["recipes"] }
    ]
  },
  {
    title: "知識與品牌",
    links: [
      { href: "knowledge.html", label: "知識專區", keys: ["knowledge", "video", "hanfang-baike", "sources"] },
      { href: "brand.html", label: "品牌故事", keys: ["brand", "brand-origin", "craft", "quality", "ingredients"] },
      { href: "faq.html", label: "常見問題", keys: ["faq"] }
    ]
  },
  {
    title: "服務",
    links: [
      { href: "trial.html", label: "申請試喝", keys: ["trial"] },
      { href: "contact.html", label: "聯絡我們", keys: ["contact"] }
    ]
  }
];

ensureUxStyle();

document.addEventListener("DOMContentLoaded", initSite);

async function initSite() {
  document.body.classList.add("ux-v410");
  try {
    await loadData();
  } catch (error) {
    console.warn("data.json 載入失敗，改用基本資料顯示網站。", error);
    SITE_DATA = fallbackData();
  }

  buildShell();
  hydrateStaticFields();
  renderCurrentPage();
  renderMobileCompareCards();
  initKnowledgeTabs();
  bindGlobalEvents();
  initReveal();
  renderFloatingLineCta();
}

function ensureUxStyle() {
  if (document.querySelector('link[href*="site-ux-v410.css"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = `site-ux-v410.css?v=${UX_VERSION}`;
  document.head.appendChild(link);
}

function fallbackData() {
  return {
    brand: "仙加味",
    lineId: "@762jybnm",
    products: [],
    combos: [],
    offers: { comboOffers: [] },
    recommend: [],
    recipes: [],
    videos: [],
    faqs: [],
    pageContent: {}
  };
}

async function loadData() {
  if (SITE_DATA) return SITE_DATA;
  const response = await fetch(`data.json?v=${UX_VERSION}`);
  if (!response.ok) throw new Error(`data.json 載入失敗：${response.status}`);
  SITE_DATA = await response.json();
  return SITE_DATA;
}

function currentPageKey() {
  const declared = String(document.body?.dataset?.page || "").trim();
  if (declared) return declared;
  const name = location.pathname.split("/").pop()?.replace(/\.html$/i, "") || "index";
  const aliases = {
    index: "home",
    "brand-origin": "brand-origin",
    craft: "craft",
    quality: "quality",
    ingredients: "ingredients"
  };
  return aliases[name] || name;
}

function getLineId() {
  return SITE_DATA?.lineId || "@762jybnm";
}

function normalizeLineMessage(message = "看產品") {
  const text = String(message || "").trim();
  return text || "看產品";
}

function buildLineAutoLink(message = "看產品") {
  const id = encodeURIComponent(getLineId());
  const text = encodeURIComponent(normalizeLineMessage(message));
  return `https://line.me/R/oaMessage/${id}/?${text}`;
}

function lineButton(label = "前往 LINE 詢問", message = "看產品", extraClass = "") {
  return `<a class="btn btn-line ${escapeAttribute(extraClass)}" href="${buildLineAutoLink(message)}" target="_blank" rel="noopener" aria-label="將開啟仙加味官方 LINE">${escapeHtml(label)}</a>`;
}

function pageLineMessage(page = currentPageKey()) {
  const messages = {
    home: "我從仙加味官網首頁進來，想了解產品與怎麼選。",
    products: "我想了解仙加味龜鹿系列產品與規格。",
    "product-detail": "我正在查看產品詳細介紹，想確認規格與購買方式。",
    choose: "我不確定怎麼選，想請你依我的生活方式幫我整理。",
    combo: "我想詢問產品搭配方式。",
    guide: "我想詢問仙加味產品的一般使用方式。",
    recipes: "我想了解龜鹿產品的料理搭配。",
    knowledge: "我從知識專區進來，想進一步了解產品。",
    video: "我看了知識影音，想進一步了解產品。",
    brand: "我從品牌故事頁進來，想認識仙加味與產品。",
    faq: "我看了常見問題，還有問題想詢問。",
    trial: "我想申請龜鹿飲30cc試喝組。",
    contact: "我想聯絡仙加味。",
    dm: "我看了產品圖文整理，想確認規格與購買方式。"
  };
  return messages[page] || "我想了解仙加味產品。";
}

function buildShell() {
  const header = document.getElementById("site-header");
  const menuRoot = document.getElementById("site-menu-root");
  const footer = document.getElementById("site-footer");
  const modalRoot = document.getElementById("site-modal");

  if (header) header.innerHTML = renderHeader();
  if (menuRoot) menuRoot.innerHTML = renderMenu();
  if (footer) footer.innerHTML = renderFooter();
  if (modalRoot) modalRoot.innerHTML = renderModalShell();
}

function renderHeader() {
  const brand = SITE_DATA?.brand || "仙加味";
  return `
    <div class="header-inner">
      <a class="brand-mark" href="index.html" aria-label="${escapeAttribute(brand)}首頁">
        <img src="images/logo.png?v=${UX_VERSION}" alt="${escapeAttribute(brand)}" decoding="async">
        <span class="brand-mark__copy">
          <span class="brand-mark__name">${escapeHtml(brand)}</span>
          <span class="brand-mark__tagline">補養，是一種節奏。</span>
        </span>
      </a>
      <button id="menu-btn" class="menu-btn" type="button" aria-label="開啟選單" aria-expanded="false">☰ 選單</button>
    </div>
  `;
}

function renderMenu() {
  const page = currentPageKey();
  const groups = MENU_GROUPS.map(group => `
    <div class="menu-group">
      <h4>${escapeHtml(group.title)}</h4>
      ${group.links.map(link => {
        const active = link.keys.includes(page);
        return `<a class="${active ? "is-active" : ""}" href="${link.href}" ${active ? 'aria-current="page"' : ""}>${escapeHtml(link.label)}</a>`;
      }).join("")}
    </div>
  `).join("");

  return `
    <nav id="menu-drawer" class="site-menu" aria-hidden="true">
      <div class="site-menu__backdrop" data-close-menu="1"></div>
      <aside class="site-menu__panel" aria-label="網站選單">
        <div class="menu-topline">
          <a class="menu-brand-mini" href="index.html">
            <img src="images/logo.png?v=${UX_VERSION}" alt="仙加味">
            <strong>仙加味</strong>
          </a>
          <button id="menu-close" class="menu-close" type="button" aria-label="關閉選單">✕</button>
        </div>

        <div class="menu-quick-actions" aria-label="快速入口">
          <a class="btn btn-line" href="trial.html">試喝</a>
          <a class="btn btn-outline" href="products.html">查看產品</a>
          <a class="btn btn-outline" href="choose.html">幫我挑選</a>
          <a class="btn btn-outline" href="guide.html">怎麼使用</a>
          ${lineButton("LINE 詢問", "我想了解仙加味產品。")}
        </div>

        ${groups}

        <div class="menu-contact-card">
          <p class="eyebrow">官方 LINE</p>
          <strong>產品規格、使用與購買資訊</strong>
          <p class="muted">LINE ID：${escapeHtml(getLineId())}</p>
          ${lineButton("前往 LINE 詢問", pageLineMessage(page))}
        </div>
      </aside>
    </nav>
  `;
}

function renderFooter() {
  return `
    <div class="footer-card card">
      <div class="footer-brand-block">
        <strong>${escapeHtml(SITE_DATA?.brand || "仙加味")}</strong>
        <p>補養，是一種節奏。</p>
        <p>從萬華開始，把四代累積的龜鹿工序整理成清楚的產品資訊與日常使用方式。</p>
      </div>

      <nav class="footer-nav" aria-label="頁尾導覽">
        <h3>快速前往</h3>
        <div class="footer-nav-links">
          <a href="products.html">龜鹿系列</a>
          <a href="choose.html">怎麼選</a>
          <a href="guide.html">食用方式</a>
          <a href="recipes.html">料理搭配</a>
          <a href="knowledge.html">知識專區</a>
          <a href="brand.html">品牌故事</a>
          <a href="faq.html">常見問題</a>
          <a href="trial.html">申請試喝</a>
          <a href="contact.html">聯絡我們</a>
          <a href="sources.html">資料來源</a>
        </div>
      </nav>

      <div class="footer-contact">
        <div>
          <h3>仙加味官方 LINE</h3>
          <p>LINE ID：<strong>${escapeHtml(getLineId())}</strong></p>
          <p>產品規格、一般使用、配送與購買資訊，皆可透過官方 LINE 詢問。</p>
          ${lineButton("前往 LINE 詢問", pageLineMessage())}
        </div>
        <img src="images/line-qr.jpg?v=${UX_VERSION}" alt="仙加味官方 LINE QR Code" loading="lazy" decoding="async">
      </div>

      <div class="footer-legal">仙加味網站內容以產品資訊、日常飲食與傳統食補文化整理為主；特殊健康狀況請洽專業醫療人員。</div>
    </div>
  `;
}

function renderModalShell() {
  return `
    <div id="product-modal" class="product-modal" aria-hidden="true">
      <div class="product-modal__backdrop" data-close-modal="1"></div>
      <div class="product-modal__scroll">
        <div class="product-modal__panel" role="dialog" aria-modal="true" aria-labelledby="product-modal-title">
          <button id="product-modal-close" class="product-modal__close" type="button" aria-label="關閉產品介紹">關閉</button>
          <div id="product-modal-body"></div>
        </div>
      </div>
    </div>
  `;
}

function hydrateStaticFields() {
  document.querySelectorAll("[data-line-url]").forEach(element => {
    const message = element.dataset.lineMessage || pageLineMessage();
    element.href = buildLineAutoLink(message);
    element.target = "_blank";
    element.rel = "noopener";
    element.setAttribute("aria-label", "將開啟仙加味官方 LINE");
  });

  document.querySelectorAll("[data-line-id]").forEach(element => {
    element.textContent = getLineId();
  });

  document.querySelectorAll("[data-brand-name]").forEach(element => {
    element.textContent = SITE_DATA?.brand || "仙加味";
  });

  document.querySelectorAll("[data-year]").forEach(element => {
    element.textContent = String(new Date().getFullYear());
  });
}

function renderCurrentPage() {
  const page = currentPageKey();

  if (page === "home") renderHome();
  if (page === "products") renderProductsPage();
  if (page === "choose") renderChoosePage();
  if (page === "combo") renderComboPage();
  if (page === "guide") renderGuidePage();
  if (page === "recipes") renderRecipesPage();
  if (page === "knowledge") renderKnowledgePage();
  if (page === "video") renderVideoPage();
  if (page === "faq") renderFaqPage();
  if (page === "brand") renderBrandPage();
  if (page === "contact") renderContactPage();
}

function renderHome() {
  fillProducts("home-products", SITE_DATA?.products || [], { compact: true });
  document.querySelector("main")?.classList.add("home-v410");
}

function renderProductsPage() {
  fillProducts("product-list", SITE_DATA?.products || [], { compact: false });

  const compare = document.getElementById("compare-grid");
  if (compare && !compare.children.length) {
    compare.innerHTML = (SITE_DATA?.products || []).map(product => `
      <article class="card reveal">
        <p class="eyebrow">${escapeHtml(product.size || "產品規格")}</p>
        <h3>${escapeHtml(product.displayName || product.name || "產品")}</h3>
        <p>${escapeHtml(product.purpose || product.description || "")}</p>
        <a class="btn btn-outline" href="${escapeAttribute(product.page || product.detailPage || "products.html")}">查看介紹</a>
      </article>
    `).join("");
  }
}

function fillProducts(targetId, products, options = {}) {
  const list = document.getElementById(targetId);
  if (!list) return;

  const safeProducts = Array.isArray(products) ? products : [];
  list.innerHTML = safeProducts.map(product => {
    const name = product.displayName || product.name || "仙加味產品";
    const image = product.image || product.gallery?.[0] || "images/logo.png";
    const page = product.page || product.detailPage || "products.html";
    return `
      <article class="product-card reveal" data-product-id="${escapeAttribute(product.id || "")}" tabindex="0" role="button" aria-label="查看${escapeAttribute(name)}介紹">
        <div class="product-card__img">
          <img src="${escapeAttribute(image)}" alt="${escapeAttribute(name)}" loading="lazy" decoding="async">
        </div>
        <div class="product-card__body">
          <p class="eyebrow">${escapeHtml(product.series || "仙加味")}</p>
          <h3>${escapeHtml(name)}</h3>
          ${product.purpose ? `<p class="product-purpose">${escapeHtml(product.purpose)}</p>` : ""}
          ${!options.compact && product.description ? `<p>${escapeHtml(product.description)}</p>` : ""}
          <p class="muted">規格：${escapeHtml(product.size || "請見產品介紹")}</p>
          <div class="product-card__actions">
            <a class="btn btn-outline" href="${escapeAttribute(page)}">查看介紹</a>
            ${!options.compact ? '<button class="btn btn-outline" type="button" data-quick-view="1">快速查看</button>' : ""}
          </div>
        </div>
      </article>
    `;
  }).join("");

  list.querySelectorAll("[data-product-id]").forEach(card => {
    const open = event => {
      if (event?.target?.closest("a")) return;
      const product = safeProducts.find(item => item.id === card.dataset.productId);
      if (product) openProductModal(product, card);
    };
    card.addEventListener("click", open);
    card.addEventListener("keydown", event => {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      open(event);
    });
  });
}

function renderChoosePage() {
  const target = document.getElementById("choose-results");
  if (!target) return;

  const source = Array.isArray(SITE_DATA?.recommend) && SITE_DATA.recommend.length
    ? SITE_DATA.recommend
    : (SITE_DATA?.pageContent?.choose || []).map(item => ({
        keyword: item.title?.split("｜")[0] || "使用方式",
        result: item.title?.split("｜")[1] || item.title || "產品方向",
        desc: item.desc || ""
      }));

  target.innerHTML = source.map(item => `
    <article class="card reveal">
      <p class="eyebrow">${escapeHtml(item.keyword || "使用情境")}</p>
      <h3>${escapeHtml(item.result || item.title || "產品方向")}</h3>
      <p>${escapeHtml(item.desc || "")}</p>
      <div class="final-cta__actions">
        <a class="btn btn-outline" href="products.html">查看產品</a>
        ${lineButton("LINE 幫我挑選", `我平常偏好「${item.keyword || "不確定"}」，想請你幫我整理產品方向。`)}
      </div>
    </article>
  `).join("");
}

function renderComboPage() {
  const target = document.getElementById("combo-grid");
  if (!target || target.children.length) return;
  const combos = SITE_DATA?.offers?.comboOffers || SITE_DATA?.combos || [];
  target.innerHTML = combos.map(combo => `
    <article class="card reveal">
      <p class="eyebrow">日常搭配</p>
      <h3>${escapeHtml(combo.name || "產品搭配")}</h3>
      <p>${escapeHtml(combo.desc || "")}</p>
      ${Array.isArray(combo.items) ? `<p class="muted">內容：${escapeHtml(combo.items.join("＋"))}</p>` : ""}
      ${lineButton("LINE 詢問搭配", `我想詢問「${combo.name || "產品搭配"}」。`)}
    </article>
  `).join("");
}

function renderGuidePage() {
  const target = document.getElementById("guide-steps") || document.getElementById("guide-grid");
  if (!target) return;
  const items = Array.isArray(SITE_DATA?.pageContent?.guide) ? SITE_DATA.pageContent.guide : [];
  target.innerHTML = items.map((item, index) => `
    <article class="card guide-card reveal">
      <p class="eyebrow">使用 ${String(index + 1).padStart(2, "0")}</p>
      <h3>${escapeHtml(item.title || "使用方式")}</h3>
      <p class="preline">${escapeHtml(item.desc || "")}</p>
    </article>
  `).join("");
}

function renderRecipesPage() {
  const target = document.getElementById("recipe-grid");
  if (!target) return;
  const recipes = Array.isArray(SITE_DATA?.recipes) ? SITE_DATA.recipes : (SITE_DATA?.pageContent?.recipes || []);
  if (!recipes.length) return;
  target.innerHTML = recipes.map(recipe => `
    <article class="card reveal">
      <p class="eyebrow">${escapeHtml(recipe.category || "日常料理")}</p>
      <h3>${escapeHtml(recipe.title || "料理搭配")}</h3>
      <p>${escapeHtml(recipe.desc || recipe.description || "")}</p>
      ${Array.isArray(recipe.steps) && recipe.steps.length ? `<ol>${recipe.steps.map(step => `<li>${escapeHtml(step)}</li>`).join("")}</ol>` : ""}
    </article>
  `).join("");
}

function renderKnowledgePage() {
  const target = document.getElementById("knowledge-grid");
  if (!target || target.children.length) return;
  const items = [
    ["先看產品型態", "膏、飲、湯塊、膠與粉，對應不同的日常使用方式。"],
    ["再看成分與規格", "以正式產品標示、規格與保存方式為準，避免把不同產品混在一起理解。"],
    ["最後看怎麼使用", "依固定取用、溫熱飲用、沖泡燉湯或自行搭配，找到容易持續的方式。"]
  ];
  target.innerHTML = items.map(([title, text]) => `<article class="card reveal"><h3>${title}</h3><p>${text}</p></article>`).join("");
}

function initKnowledgeTabs() {
  const tabs = Array.from(document.querySelectorAll("[data-knowledge-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-knowledge-panel]"));
  if (!tabs.length || !panels.length) return;

  const allowed = tabs.map(tab => tab.dataset.knowledgeTab);
  const requested = new URLSearchParams(location.search).get("tab");
  const initial = allowed.includes(requested) ? requested : allowed[0];

  const activate = id => {
    tabs.forEach(tab => {
      const active = tab.dataset.knowledgeTab === id;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => {
      panel.hidden = panel.dataset.knowledgePanel !== id;
    });
  };

  tabs.forEach(tab => {
    tab.addEventListener("click", () => activate(tab.dataset.knowledgeTab));
    tab.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const index = tabs.indexOf(tab);
      const offset = event.key === "ArrowRight" ? 1 : -1;
      const next = tabs[(index + offset + tabs.length) % tabs.length];
      next.focus();
      activate(next.dataset.knowledgeTab);
    });
  });

  activate(initial);
}

function renderVideoPage() {
  const grid = document.getElementById("video-grid");
  const featured = document.getElementById("video-featured");
  if (!grid || !featured) return;

  const videos = Array.isArray(SITE_DATA?.videos) ? SITE_DATA.videos : [];
  const filters = Array.from(document.querySelectorAll("[data-video-filter]"));
  const search = document.getElementById("video-search");
  const count = document.getElementById("video-count");
  const empty = document.getElementById("video-empty");
  let category = new URLSearchParams(location.search).get("category") || "全部";
  let keyword = "";

  grid.classList.add("video-grid-v410");

  const refresh = () => {
    const filtered = videos.filter(video => {
      const categoryMatch = category === "全部" || video.category === category;
      const text = `${video.title || ""} ${video.category || ""}`.toLowerCase();
      return categoryMatch && (!keyword || text.includes(keyword));
    });

    filters.forEach(button => {
      const active = button.dataset.videoFilter === category;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    if (count) count.textContent = String(filtered.length);
    if (empty) empty.hidden = filtered.length > 0;

    if (!filtered.length) {
      featured.innerHTML = "";
      grid.innerHTML = "";
      return;
    }

    featured.innerHTML = renderFeaturedVideo(filtered[0]);
    grid.innerHTML = filtered.slice(1).map((video, index) => renderVideoCard(video, index + 2)).join("");
  };

  filters.forEach(button => {
    button.addEventListener("click", () => {
      category = button.dataset.videoFilter || "全部";
      refresh();
    });
  });

  search?.addEventListener("input", event => {
    keyword = String(event.target.value || "").trim().toLowerCase();
    refresh();
  });

  refresh();
}

function renderFeaturedVideo(video) {
  const title = displayVideoTitle(video);
  const category = video.category || "知識影音";
  return `
    <article class="card video-featured reveal">
      <a class="video-featured__cover" href="${escapeAttribute(video.url || "#")}" target="_blank" rel="noopener" aria-label="觀看${escapeAttribute(title)}">
        <span class="video-play" aria-hidden="true">▶</span>
        <span class="video-cover-label">${escapeHtml(category)}・精選</span>
      </a>
      <div class="video-featured__body">
        <p class="eyebrow">知識影音精選</p>
        <h2>${escapeHtml(title)}</h2>
        <p>頁面不自動播放；點擊後開啟原始公開平台觀看。</p>
        <a class="btn btn-outline" href="${escapeAttribute(video.url || "#")}" target="_blank" rel="noopener">觀看原影片</a>
      </div>
    </article>
  `;
}

function renderVideoCard(video, index) {
  const title = displayVideoTitle(video);
  const category = video.category || "知識影音";
  return `
    <article class="card video-card-v410 reveal">
      <a class="video-card-v410__cover" href="${escapeAttribute(video.url || "#")}" target="_blank" rel="noopener" aria-label="觀看${escapeAttribute(title)}">
        <span class="video-play" aria-hidden="true">▶</span>
        <span class="video-cover-label">${escapeHtml(category)}</span>
      </a>
      <div class="video-card-v410__body">
        <p class="eyebrow">影音 ${String(index).padStart(2, "0")}</p>
        <h3>${escapeHtml(title)}</h3>
        <a class="btn btn-outline" href="${escapeAttribute(video.url || "#")}" target="_blank" rel="noopener">觀看影片</a>
      </div>
    </article>
  `;
}

function displayVideoTitle(video) {
  return String(video?.title || "公開影音")
    .replace(/^龜鹿系列日常觀點\s*(\d+)$/u, "龜鹿日常｜第 $1 集")
    .replace(/^鹿茸系列食材觀點\s*(\d+)$/u, "鹿茸食材｜第 $1 集")
    .replace(/^中醫師公開觀點\s*(\d+)$/u, "中醫師觀點｜第 $1 集");
}

function renderFaqPage() {
  const target = document.getElementById("faq-grid");
  if (!target || target.dataset.staticContent === "true" || target.children.length) return;
  const faqs = Array.isArray(SITE_DATA?.faqs) ? SITE_DATA.faqs : (SITE_DATA?.faq || []);
  target.innerHTML = faqs.map(item => `
    <details class="faq-item reveal">
      <summary>${escapeHtml(item.q || item.question || "常見問題")}</summary>
      <div class="faq-item__body"><p>${escapeHtml(item.a || item.answer || "")}</p></div>
    </details>
  `).join("");
}

function renderContactPage() {
  const mapLinks = document.querySelectorAll("[data-map-url]");
  mapLinks.forEach(link => {
    if (SITE_DATA?.store?.mapUrl) link.href = SITE_DATA.store.mapUrl;
  });
}

function renderBrandPage() {
  const main = document.querySelector("main.page");
  if (!main || main.dataset.brandV410 === "true") return;
  main.dataset.brandV410 = "true";
  main.className = "page brand-v410";

  main.innerHTML = `
    <section class="hero brand-hero-v410">
      <article class="brand-hero-v410__panel reveal">
        <div class="brand-hero-v410__copy">
          <p class="eyebrow">仙加味・從萬華開始</p>
          <h1>四代累積，整理成今天更容易理解的仙加味</h1>
          <p>我們承接家族長年累積的原料處理、鹿角相關工作與龜鹿熬製經驗，不把傳統停在過去，而是重新整理成清楚的產品型態、正式規格與日常使用方式。</p>
          <div class="brand-facts" aria-label="品牌重點">
            <div class="brand-fact"><strong>四代</strong><span>家族經驗累積</span></div>
            <div class="brand-fact"><strong>萬華</strong><span>品牌故事起點</span></div>
            <div class="brand-fact"><strong>2008</strong><span>仙加味完成註冊</span></div>
            <div class="brand-fact"><strong>日常</strong><span>把資訊說清楚</span></div>
          </div>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#brand-generations">認識四代故事</a>
            <a class="btn btn-outline" href="products.html">查看龜鹿系列</a>
          </div>
        </div>
        <div class="brand-hero-v410__media">
          <img src="images/brand/approved-v405/home-brand.webp?v=${UX_VERSION}" alt="仙加味小老闆與龜鹿系列產品" fetchpriority="high" decoding="async">
        </div>
      </article>
    </section>

    <section class="section">
      <div class="section-heading reveal">
        <p class="eyebrow">品牌承諾</p>
        <h2>不是把內容說得更多，而是把重要的事說得更清楚</h2>
        <p>仙加味以產品實際型態、正式規格與一般使用資訊為核心，讓第一次接觸龜鹿產品的人也能找到方向。</p>
      </div>
      <div class="brand-promise-grid">
        <article class="card brand-promise-card reveal" data-number="01">
          <p class="eyebrow">看得懂</p>
          <h3>原料與成分清楚呈現</h3>
          <p>以正式產品資訊為準，不用模糊說法混淆不同產品，也不把文化介紹當成個人醫療建議。</p>
        </article>
        <article class="card brand-promise-card reveal" data-number="02">
          <p class="eyebrow">分得清</p>
          <h3>產品型態與規格各自說明</h3>
          <p>膏、飲、湯塊、膠與粉，依包裝、份量與使用方式整理，讓客人更容易比較。</p>
        </article>
        <article class="card brand-promise-card reveal" data-number="03">
          <p class="eyebrow">做得到</p>
          <h3>回到能持續的日常節奏</h3>
          <p>從固定取用、方便飲用、沖泡燉湯到自行搭配，先選生活裡真正容易做到的方式。</p>
        </article>
      </div>
    </section>

    <section class="section" id="brand-generations">
      <div class="brand-story-panel">
        <aside class="brand-story-intro reveal">
          <p class="eyebrow">四代傳承</p>
          <h2>每一代，都把上一代留下的經驗再往前整理一步</h2>
          <p>傳承不只是沿用舊方法，也包含因應時代，把原料、工序、規格與使用資訊重新說明。</p>
        </aside>
        <div class="brand-timeline">
          <article class="card brand-generation reveal">
            <div class="brand-generation__mark">一</div>
            <div><p class="eyebrow">第一代・扎根</p><h3>從萬華行口與山產買賣開始</h3><p>靠著每天看原料、比品質與累積信用，建立家族最早對產地、交易與原料判斷的理解。</p></div>
          </article>
          <article class="card brand-generation reveal">
            <div class="brand-generation__mark">二</div>
            <div><p class="eyebrow">第二代・專業</p><h3>祖父「鹿角伯」把工序做成一生的工作</h3><p>從老店現場學起，長年投入鹿角、鹿茸等相關原料的挑選、處理、分級與加工，也累積龜鹿相關實務經驗。</p></div>
          </article>
          <article class="card brand-generation reveal">
            <div class="brand-generation__mark">三</div>
            <div><p class="eyebrow">第三代・守成</p><h3>把品質與製程穩定延續下來</h3><p>承接日常營運與實際加工工作，持續重視原料、時間、火候與成品穩定度。</p></div>
          </article>
          <article class="card brand-generation reveal">
            <div class="brand-generation__mark">四</div>
            <div><p class="eyebrow">第四代・整理</p><h3>讓傳統被今天的人重新理解</h3><p>以仙加味為對外品牌，把家族經驗整理成產品頁、正式規格、使用方式、知識內容與 LINE 諮詢流程。</p></div>
          </article>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-heading reveal">
        <p class="eyebrow">用料與資訊原則</p>
        <h2>保留傳統的厚度，也保留現代人需要的透明度</h2>
      </div>
      <div class="brand-principles">
        <article class="card brand-principle reveal"><h3>以產品實際標示為準</h3><p>成分、內容量、保存與一般使用方式，以現行產品資訊呈現，避免不同版本互相混用。</p></article>
        <article class="card brand-principle reveal"><h3>不把食補說成療效</h3><p>網站以日常飲食、產品型態與傳統文化介紹為主；疾病、症狀、孕哺與用藥問題交由專業人員判斷。</p></article>
        <article class="card brand-principle reveal"><h3>不改變產品真實樣貌</h3><p>產品圖以實際包裝與正式規格呈現，不為了畫面效果任意改變比例、包裝或產品形式。</p></article>
        <article class="card brand-principle reveal"><h3>讓詢問流程更簡單</h3><p>官網負責把內容說清楚；價格、活動、配送與購買，再由官方 LINE 一對一確認。</p></article>
      </div>
    </section>

    <section class="section section--narrow">
      <article class="final-cta brand-signature reveal">
        <p class="eyebrow">仙加味</p>
        <h2>從萬華出發，把傳統整理成今天的日常</h2>
        <p>我們希望客人不是被複雜名詞推著走，而是先理解產品，再找到適合自己生活節奏的使用方式。</p>
        <div class="final-cta__actions" style="justify-content:center">
          <a class="btn btn-primary" href="products.html">查看龜鹿系列</a>
          <a class="btn btn-outline" href="knowledge.html">前往知識專區</a>
        </div>
      </article>
    </section>
  `;
}

function renderMobileCompareCards() {
  document.querySelectorAll(".compare-table").forEach((table, tableIndex) => {
    const tableWrap = table.closest(".table-scroll");
    let target = tableWrap?.nextElementSibling;
    if (!target || !target.classList.contains("mobile-compare-cards")) {
      target = document.createElement("div");
      target.className = "mobile-compare-cards";
      target.id = tableIndex === 0 ? "mobile-compare-cards" : `mobile-compare-cards-${tableIndex + 1}`;
      tableWrap?.insertAdjacentElement("afterend", target);
    }
    if (target.dataset.ready === "true") return;

    const rows = Array.from(table.querySelectorAll("tbody tr"));
    target.innerHTML = rows.map(row => {
      const cells = Array.from(row.children);
      const link = cells[0]?.querySelector("a");
      const name = link?.textContent?.trim() || cells[0]?.textContent?.trim() || "產品";
      const href = link?.getAttribute("href") || "products.html";
      const purpose = cells[1]?.textContent?.trim() || "";
      const size = cells[2]?.textContent?.trim() || "";
      const fit = cells[3]?.textContent?.trim() || "";
      return `
        <article class="mobile-compare-card">
          <h3>${escapeHtml(name)}</h3>
          <dl>
            ${purpose ? `<dt>用途</dt><dd>${escapeHtml(purpose)}</dd>` : ""}
            ${size ? `<dt>規格</dt><dd>${escapeHtml(size)}</dd>` : ""}
            ${fit ? `<dt>適合</dt><dd>${escapeHtml(fit)}</dd>` : ""}
          </dl>
          <a class="btn btn-outline" href="${escapeAttribute(href)}">查看產品</a>
        </article>
      `;
    }).join("");
    target.dataset.ready = "true";
  });
}

function openProductModal(product, sourceElement) {
  const modal = document.getElementById("product-modal");
  const body = document.getElementById("product-modal-body");
  if (!modal || !body) return;

  lastFocusedElement = sourceElement || document.activeElement;
  const name = product.displayName || product.name || "仙加味產品";
  const image = product.image || product.gallery?.[0] || "images/logo.png";
  const ingredients = Array.isArray(product.ingredients) ? product.ingredients : [];
  const usage = Array.isArray(product.usage) ? product.usage : [];
  const storage = Array.isArray(product.storage) ? product.storage : [];

  body.innerHTML = `
    <div class="modal-top">
      <div class="modal-gallery">
        <div class="modal-gallery__item">
          <img src="${escapeAttribute(image)}" alt="${escapeAttribute(name)}" loading="eager" decoding="async">
        </div>
      </div>
      <div class="modal-copy">
        <p class="eyebrow">${escapeHtml(product.series || "仙加味")}</p>
        <h2 id="product-modal-title">${escapeHtml(name)}</h2>
        ${product.purpose ? `<p class="product-purpose">${escapeHtml(product.purpose)}</p>` : ""}
        <p>${escapeHtml(product.description || "")}</p>
        <p class="muted">規格：${escapeHtml(product.size || "請見正式產品資訊")}</p>

        ${ingredients.length ? `<div class="modal-section"><h3>成分</h3><p>${escapeHtml(ingredients.join("、"))}</p></div>` : ""}
        ${usage.length ? `<div class="modal-section"><h3>使用方式</h3><ul>${usage.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : ""}
        ${storage.length ? `<div class="modal-section"><h3>保存方式</h3><ul>${storage.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : ""}

        <div class="modal-actions final-cta__actions">
          <a class="btn btn-primary" href="${escapeAttribute(product.page || product.detailPage || "products.html")}">查看完整介紹</a>
          ${lineButton("LINE 詢問產品", `我想了解${name}的規格與購買方式。`)}
        </div>
      </div>
    </div>
  `;

  modal.classList.add("show");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  document.getElementById("product-modal-close")?.focus();
}

function closeModal() {
  const modal = document.getElementById("product-modal");
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  if (lastFocusedElement?.focus) lastFocusedElement.focus();
}

function openMenu() {
  const drawer = document.getElementById("menu-drawer");
  const button = document.getElementById("menu-btn");
  drawer?.classList.add("open");
  drawer?.setAttribute("aria-hidden", "false");
  button?.setAttribute("aria-expanded", "true");
  document.body.classList.add("menu-open");
  document.getElementById("menu-close")?.focus();
}

function closeMenu() {
  const drawer = document.getElementById("menu-drawer");
  const button = document.getElementById("menu-btn");
  drawer?.classList.remove("open");
  drawer?.setAttribute("aria-hidden", "true");
  button?.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
}

function bindGlobalEvents() {
  document.addEventListener("click", event => {
    if (event.target.closest("#menu-btn")) {
      const open = document.getElementById("menu-drawer")?.classList.contains("open");
      open ? closeMenu() : openMenu();
      return;
    }

    if (event.target.closest("#menu-close") || event.target.closest('[data-close-menu="1"]') || event.target.closest(".site-menu__panel a")) {
      closeMenu();
    }

    if (event.target.closest("#product-modal-close") || event.target.closest('[data-close-modal="1"]')) {
      closeModal();
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    closeMenu();
    closeModal();
  });

  let lastScrollY = window.scrollY;
  window.addEventListener("scroll", () => {
    const moved = Math.abs(window.scrollY - lastScrollY) > 20;
    if (moved && document.body.classList.contains("menu-open")) closeMenu();
    lastScrollY = window.scrollY;
  }, { passive: true });
}

function renderFloatingLineCta() {
  const allowed = ["products", "product-detail", "choose", "combo", "contact", "dm"];
  const page = currentPageKey();
  if (!allowed.includes(page) || document.getElementById("floating-line-cta")) return;

  const link = document.createElement("a");
  link.id = "floating-line-cta";
  link.className = "floating-line-cta";
  link.href = buildLineAutoLink(pageLineMessage(page));
  link.target = "_blank";
  link.rel = "noopener";
  link.setAttribute("aria-label", "前往仙加味官方 LINE");
  link.innerHTML = '<span class="floating-line-cta__dot" aria-hidden="true">LINE</span><span>詢問產品</span>';
  document.body.appendChild(link);
}

function initReveal() {
  const elements = Array.from(document.querySelectorAll(".reveal"));
  if (!elements.length) return;

  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    elements.forEach(element => element.classList.add("show"));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("show");
      observer.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -45px 0px", threshold: .04 });

  elements.forEach(element => observer.observe(element));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

window.openMenu = openMenu;
window.closeMenu = closeMenu;
window.closeModal = closeModal;
window.openProductModal = openProductModal;
window.buildLineAutoLink = buildLineAutoLink;
window.lineButton = lineButton;
