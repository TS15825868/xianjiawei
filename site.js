"use strict";

/* 仙加味網站穩定啟動器｜2026-08-14 iOS/Safari stability v5
 * 不使用 document.write；單一附加層失敗不影響主內容。
 * data.json 逾時／失敗時使用正式六項產品安全備援，不讓產品區或跳窗變空白。
 */
(function () {
  if (window.__XJW_SITE_WRAPPER_V5__) return;
  window.__XJW_SITE_WRAPPER_V5__ = true;

  const VERSION = "20260814-ios-safari-stability-v5";
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

  const SAFE_DATA = Object.freeze({
    version: VERSION + "-fallback",
    brand: "仙加味",
    lineId: "@762jybnm",
    products: [
      {id:"guilu-drink-30",series:"仙加味・龜鹿",name:"龜鹿飲30cc玻璃罐",displayName:"龜鹿飲30cc玻璃罐",size:"30cc／罐（小玻璃罐）",image:`images/customer-display-v20260812/guilu-drink-30cc.avif?v=${VERSION}`,description:"30cc小玻璃罐，裸罐、無貼紙，適合希望準備步驟少或外出攜帶的人。",ingredients:["水","龜板萃取物","鹿角萃取物","粉光蔘","枸杞","紅棗","黃耆"],usage:["每日1罐","可隔水加熱或溫熱飲用","建議白天飲用","避免冰飲"],storage:["未開封置於陰涼乾燥處","開罐後請儘速飲用完畢"],purpose:"輕巧即飲",page:"product-guilu-drink-30cc.html",detailPage:"product-guilu-drink-30cc.html"},
      {id:"guilu-drink-180",series:"仙加味・龜鹿",name:"龜鹿飲180cc鋁袋",displayName:"龜鹿飲180cc鋁袋",size:"180cc／包（鋁袋）",image:`images/customer-display-v20260812/guilu-drink-180cc-product.jpg?v=${VERSION}`,description:"180cc鋁袋即飲型態，維持正式狹長鋁袋比例。",ingredients:["水","龜板萃取物","鹿角萃取物","粉光蔘","枸杞","紅棗","黃耆"],usage:["每日1包","可隔水加熱或溫熱飲用","建議白天飲用","避免冰飲"],storage:["未開封置於陰涼乾燥處","開封後請儘速飲用完畢"],purpose:"完整份量即飲",page:"product-guilu-drink-180cc.html",detailPage:"product-guilu-drink-180cc.html"},
      {id:"guilu-gao",series:"仙加味・龜鹿",name:"龜鹿膏",displayName:"龜鹿膏",size:"100g／罐",image:`images/customer-display-v20260812/guilu-gao.avif?v=${VERSION}`,description:"100g罐裝膏狀型態，可直接取用或以溫熱水化開。",ingredients:["鹿角萃取物","龜板萃取物","枸杞","紅棗","黃耆","粉光蔘"],usage:["可直接食用或加入溫熱水化開","建議安排於白天"],storage:["未開封置於陰涼乾燥處","開罐後密封冷藏"],purpose:"固定日常安排",page:"product-guilu-gao.html",detailPage:"product-guilu-gao.html"},
      {id:"guilu-tangkuai",series:"仙加味・龜鹿",name:"龜鹿湯塊",displayName:"龜鹿湯塊",size:"75g／盒｜8塊裝",image:`images/customer-display-v20260812/guilu-tangkuai.avif?v=${VERSION}`,description:"75g／盒、8塊裝，可搭配熱水、保溫壺或家常燉湯。",ingredients:["龜板萃取物","鹿角萃取物"],usage:["取適量以熱水化開","可搭配雞湯、排骨湯等家常料理"],storage:["依實際包裝標示保存"],purpose:"沖泡與燉湯",page:"product-guilu-tangkuai.html",detailPage:"product-guilu-tangkuai.html"},
      {id:"guilu-jiao",series:"仙加味・龜鹿",name:"龜鹿膠",displayName:"龜鹿膠",size:"600g（1斤）／盒｜32塊裝",image:`images/customer-display-v20260812/guilu-jiao.avif?v=${VERSION}`,description:"600g（1斤）／盒、32塊裝，適合家庭大規格安排。",ingredients:["龜板萃取物","鹿角萃取物"],usage:["取適量以熱水化開","可搭配家常燉湯"],storage:["依實際包裝標示保存"],purpose:"家庭大規格",page:"product-guilu-jiao.html",detailPage:"product-guilu-jiao.html"},
      {id:"luerong-fen",series:"仙加味・鹿茸",name:"鹿茸粉",displayName:"鹿茸粉",size:"75g／罐",image:`images/customer-display-v20260812/luerong-fen.avif?v=${VERSION}`,description:"75g罐裝鹿茸粉，可依日常習慣自行搭配溫熱飲品。",ingredients:["鹿茸"],usage:["依實際產品說明取用","可搭配溫熱飲品"],storage:["置於陰涼乾燥處","使用後密封保存"],purpose:"粉狀自行搭配",page:"product-luerong-fen.html",detailPage:"product-luerong-fen.html"}
    ],
    combos: [], offers: {comboOffers: []}, recommend: [], recipes: [], videos: [], faqs: [], pageContent: {}
  });

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

  function loadStyles() { STYLES.forEach(appendStyle); }

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

  function loadScript(src, timeoutMs = 4500) {
    return new Promise(resolve => {
      const script = document.createElement("script");
      let settled = false;
      const finish = ok => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve({src, ok});
      };
      const timer = setTimeout(() => {
        console.warn("仙加味附加層載入逾時，已略過：", src);
        finish(false);
      }, timeoutMs);
      script.src = src;
      script.async = false;
      script.onload = () => finish(true);
      script.onerror = () => {
        console.warn("仙加味附加層載入失敗，已略過：", src);
        finish(false);
      };
      document.head.appendChild(script);
    });
  }

  function isDataRequest(input) {
    const raw = typeof input === "string" ? input : String(input?.url || "");
    try { return /(?:^|\/)data\.json(?:[?#]|$)/i.test(new URL(raw, location.href).pathname); }
    catch (_) { return false; }
  }

  function safeDataResponse(reason) {
    console.warn("仙加味資料改用安全備援：", reason);
    document.documentElement.dataset.xjwDataMode = "fallback";
    return new Response(JSON.stringify(SAFE_DATA), {status:200, headers:{"Content-Type":"application/json; charset=utf-8","X-XJW-Fallback":"1"}});
  }

  function installDataFetchTimeout() {
    if (window.__XJW_DATA_FETCH_TIMEOUT_V5__) return;
    window.__XJW_DATA_FETCH_TIMEOUT_V5__ = true;
    const previousFetch = window.fetch.bind(window);
    window.fetch = async function (input, init) {
      if (!isDataRequest(input)) return previousFetch(input, init);
      window.__XJW_DATA_REQUESTED__ = true;
      let timer = null;
      try {
        const request = previousFetch(input, init);
        const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("data.json timeout")), 5000); });
        const response = await Promise.race([request, timeout]);
        if (!response?.ok) return safeDataResponse(`HTTP ${response?.status || "error"}`);
        document.documentElement.dataset.xjwDataMode = "live";
        return response;
      } catch (error) {
        return safeDataResponse(error?.message || "request failed");
      } finally {
        if (timer) clearTimeout(timer);
      }
    };
  }

  function ensureCoreBooted() {
    if (document.readyState === "loading") return;
    if (document.body?.classList.contains("ux-v410")) return;
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
    if (header?.dataset?.xjwEmergency === "1" && document.body?.classList.contains("ux-v410")) delete header.dataset.xjwEmergency;
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

    // 避免 dynamic script 在 DOMContentLoaded 邊界重複啟動：先讓原本 listener 有時間執行，再補啟動。
    setTimeout(ensureCoreBooted, 120);

    await Promise.all([
      loadScript(MEDIA_MODAL),
      loadScript(SAFETY),
      loadScript(VARIANTS),
      loadScript(PUBLIC_CLEANUP),
      loadScript(IMAGE_RETIREMENT),
      loadScript(MASCOT)
    ]);

    setTimeout(clearEmergencyMarker, 180);
    document.documentElement.dataset.xjwRuntime = VERSION;
    delete document.documentElement.dataset.xjwRuntimeLoading;
    document.querySelectorAll(".reveal").forEach(element => element.classList.add("show"));
  }

  boot().catch(error => {
    console.error("仙加味網站啟動器發生未預期錯誤", error);
    document.querySelectorAll(".reveal").forEach(element => element.classList.add("show"));
    document.documentElement.dataset.xjwRuntime = `${VERSION}-fallback`;
  });
})();
