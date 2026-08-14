"use strict";

/* 仙加味網站穩定啟動器｜2026-08-14 iOS/Safari stability v4
 * 目標：不再使用 document.write；任何單一附加層失敗時仍可顯示內容與基本導覽。
 * data.json 最多等待 5 秒，避免 Safari 因 fetch 卡住造成空白頁。
 */
(function () {
  if (window.__XJW_SITE_WRAPPER_V4__) return;
  window.__XJW_SITE_WRAPPER_V4__ = true;

  const VERSION = "20260814-ios-safari-stability-v4";
  const AUTHORITY = `site-product-data-authority.js?v=${VERSION}`;
  const PRODUCT_DISPLAY = `site-customer-display-v20260812.js?v=${VERSION}`;
  const DM_AUTHORITY = `site-dm-authority-v20260811.js?v=${VERSION}`;
  const CORE = `site-core-v410.js?v=${VERSION}`;
  const MEDIA_MODAL = `site-media-modal-final-v20260814.js?v=${VERSION}`;
  const SAFETY = `site-product-image-safety.js?v=${VERSION}`;
  const VARIANTS = `site-official-product-variants.js?v=${VERSION}`;
  const PUBLIC_CLEANUP = `site-public-content-cleanup-v20260809.js?v=${VERSION}`;
  const IMAGE_RETIREMENT = `site-public-image-retirement-v20260812.js?v=${VERSION}`;
  const MASCOT = `site-mascot-placement-v20260812.js?v=${VERSION}`;

  const STYLES = [
    `site-ux-v4104.css?v=${VERSION}`,
    `site-formal-v20260809.css?v=${VERSION}`,
    `site-customer-polish-v20260811.css?v=${VERSION}`,
    `site-home-final-v20260811.css?v=${VERSION}`,
    `site-mascot-placement-v20260812.css?v=${VERSION}`,
    `site-stability-v20260814.css?v=${VERSION}`
  ];

  function installFailsafeStyle() {
    if (document.getElementById("xjw-stability-failsafe")) return;
    const style = document.createElement("style");
    style.id = "xjw-stability-failsafe";
    style.textContent = `
      .reveal{opacity:1!important;transform:none!important;visibility:visible!important}
      .site-header:empty{min-height:64px;background:#f7f4ed;border-bottom:1px solid rgba(11,31,59,.08)}
      @media(max-width:640px){
        body[data-page="home"] .home-brand-signature{min-height:0!important;padding:16px 18px!important;display:flex!important;flex-direction:row!important;align-items:center!important;justify-content:center!important;gap:16px!important}
        body[data-page="home"] .home-brand-signature img{width:auto!important;height:auto!important;max-width:70px!important;max-height:118px!important;flex:0 0 auto!important}
        body[data-page="home"] .home-brand-signature p{margin:0!important;text-align:left!important;font-size:16px!important;line-height:1.55!important}
      }
    `;
    document.head.appendChild(style);
  }

  function appendStyle(href) {
    const clean = href.split("?")[0];
    const existing = [...document.querySelectorAll('link[rel="stylesheet"]')].find(link => String(link.getAttribute("href") || "").split("?")[0] === clean);
    if (existing) {
      if (existing.getAttribute("href") !== href) existing.setAttribute("href", href);
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function loadStyles() {
    STYLES.forEach(appendStyle);
  }

  function installEmergencyHeader() {
    const header = document.getElementById("site-header");
    if (!header || header.children.length) return;
    header.dataset.xjwEmergency = "1";
    header.innerHTML = `
      <div class="header-inner">
        <a class="brand-mark" href="index.html" aria-label="仙加味首頁">
          <img src="images/logo.png?v=${VERSION}" alt="仙加味" decoding="async">
          <span class="brand-mark__copy"><span class="brand-mark__name">仙加味</span><span class="brand-mark__tagline">補養，是一種節奏。</span></span>
        </a>
        <a class="btn btn-outline" href="products.html" aria-label="查看仙加味產品">產品</a>
      </div>`;
  }

  function loadScript(src) {
    return new Promise(resolve => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = () => resolve({ src, ok: true });
      script.onerror = () => {
        console.warn("仙加味附加層載入失敗，已略過：", src);
        resolve({ src, ok: false });
      };
      document.head.appendChild(script);
    });
  }

  function isDataRequest(input) {
    const raw = typeof input === "string" ? input : String(input?.url || "");
    try {
      return /(?:^|\/)data\.json(?:[?#]|$)/i.test(new URL(raw, location.href).pathname);
    } catch (_) {
      return false;
    }
  }

  function installDataFetchTimeout() {
    if (window.__XJW_DATA_FETCH_TIMEOUT_V4__) return;
    window.__XJW_DATA_FETCH_TIMEOUT_V4__ = true;
    const previousFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      if (!isDataRequest(input)) return previousFetch(input, init);
      window.__XJW_DATA_REQUESTED__ = true;
      const request = previousFetch(input, init);
      let timer = null;
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("data.json 載入逾時，改用網站備援資料。")), 5000);
      });
      return Promise.race([request, timeout]).finally(() => {
        if (timer) clearTimeout(timer);
      });
    };
  }

  function ensureCoreBooted() {
    if (document.readyState === "loading") return;
    if (window.__XJW_DATA_REQUESTED__) return;
    if (typeof window.initSite !== "function") return;
    try {
      const result = window.initSite();
      if (result && typeof result.catch === "function") result.catch(error => console.warn("仙加味核心備援啟動失敗", error));
    } catch (error) {
      console.warn("仙加味核心備援啟動失敗", error);
    }
  }

  function clearEmergencyMarker() {
    const header = document.getElementById("site-header");
    if (header?.dataset?.xjwEmergency === "1" && window.__XJW_DATA_REQUESTED__) delete header.dataset.xjwEmergency;
  }

  async function boot() {
    document.documentElement.dataset.xjwRuntimeLoading = VERSION;
    installFailsafeStyle();
    loadStyles();
    installEmergencyHeader();

    await loadScript(AUTHORITY);
    await loadScript(PRODUCT_DISPLAY);
    await loadScript(DM_AUTHORITY);
    installDataFetchTimeout();
    await loadScript(CORE);

    // 動態載入的核心若錯過 DOMContentLoaded，主動補啟動；若核心已開始 fetch 則不重複執行。
    setTimeout(ensureCoreBooted, 0);

    await loadScript(MEDIA_MODAL);
    await loadScript(SAFETY);
    await loadScript(VARIANTS);
    await loadScript(PUBLIC_CLEANUP);
    await loadScript(IMAGE_RETIREMENT);
    await loadScript(MASCOT);

    clearEmergencyMarker();
    document.documentElement.dataset.xjwRuntime = VERSION;
    delete document.documentElement.dataset.xjwRuntimeLoading;

    // 最後保險：不論 IntersectionObserver 或附加層是否成功，公開內容不可維持透明。
    document.querySelectorAll(".reveal").forEach(element => element.classList.add("show"));
  }

  boot().catch(error => {
    console.error("仙加味網站啟動器發生未預期錯誤", error);
    document.querySelectorAll(".reveal").forEach(element => element.classList.add("show"));
    document.documentElement.dataset.xjwRuntime = `${VERSION}-fallback`;
  });
})();
