"use strict";

/* 全站入口：正式資料 → 產品圖 → DM → 核心 → Modal → 圖片安全 → 規格 → 顧客內容 → 視覺 → 穩定層。 */
(function () {
  if (window.__XJW_SITE_WRAPPER__) return;
  window.__XJW_SITE_WRAPPER__ = true;

  const VERSION = "20260814-site-refresh-v4";
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
  const STABILITY = `site-stability-v20260814.js?v=${VERSION}`;

  const HOTFIX = `site-ux-v4104.css?v=${VERSION}`;
  const FORMAL = `site-formal-v20260809.css?v=${VERSION}`;
  const CUSTOMER_POLISH = `site-customer-polish-v20260811.css?v=${VERSION}`;
  const HOME_FINAL = `site-home-final-v20260811.css?v=${VERSION}`;
  const MASCOT_STYLE = `site-mascot-placement-v20260812.css?v=${VERSION}`;
  const REFRESH = `site-refresh-v20260814.css?v=${VERSION}`;

  function appendScript(src, onload) {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    if (typeof onload === "function") script.onload = onload;
    script.onerror = function(){
      console.warn("仙加味資源載入失敗：", src);
      if (typeof onload === "function") onload();
    };
    document.head.appendChild(script);
  }

  function appendStyle(href, marker) {
    if (marker && document.querySelector(`link[href*="${marker}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }

  function loadStyles(){
    appendStyle(HOTFIX, "site-ux-v4104.css");
    appendStyle(FORMAL, "site-formal-v20260809.css");
    appendStyle(CUSTOMER_POLISH, "site-customer-polish-v20260811.css");
    appendStyle(HOME_FINAL, "site-home-final-v20260811.css");
    appendStyle(MASCOT_STYLE, "site-mascot-placement-v20260812.css");
    appendStyle(REFRESH, "site-refresh-v20260814.css");
    appendScript(STABILITY);
  }

  function loadSequentially() {
    appendScript(AUTHORITY, function () {
      appendScript(PRODUCT_DISPLAY, function () {
        appendScript(DM_AUTHORITY, function () {
          appendScript(CORE, function () {
            appendScript(MEDIA_MODAL, function () {
              appendScript(SAFETY, function () {
                appendScript(VARIANTS, function () {
                  appendScript(PUBLIC_CLEANUP, function () {
                    appendScript(IMAGE_RETIREMENT, function () {
                      appendScript(MASCOT, loadStyles);
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.write('<script src="' + AUTHORITY + '"><\/script>');
    document.write('<script src="' + PRODUCT_DISPLAY + '"><\/script>');
    document.write('<script src="' + DM_AUTHORITY + '"><\/script>');
    document.write('<script src="' + CORE + '"><\/script>');
    document.write('<script src="' + MEDIA_MODAL + '"><\/script>');
    document.write('<script src="' + SAFETY + '"><\/script>');
    document.write('<script src="' + VARIANTS + '"><\/script>');
    document.write('<script src="' + PUBLIC_CLEANUP + '"><\/script>');
    document.write('<script src="' + IMAGE_RETIREMENT + '"><\/script>');
    document.write('<script src="' + MASCOT + '"><\/script>');
    document.write('<link rel="stylesheet" href="' + HOTFIX + '">');
    document.write('<link rel="stylesheet" href="' + FORMAL + '">');
    document.write('<link rel="stylesheet" href="' + CUSTOMER_POLISH + '">');
    document.write('<link rel="stylesheet" href="' + HOME_FINAL + '">');
    document.write('<link rel="stylesheet" href="' + MASCOT_STYLE + '">');
    document.write('<link rel="stylesheet" href="' + REFRESH + '">');
    document.write('<script src="' + STABILITY + '"><\/script>');
  } else loadSequentially();
})();
