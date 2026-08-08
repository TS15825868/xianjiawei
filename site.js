"use strict";

/* 全站入口 2026-08-09：產品實際照片資料權威 → 核心 → 安全層 → 正式規格 → 舊相容層 → 正式上線視覺層。 */
(function () {
  if (window.__XJW_SITE_WRAPPER__) return;
  window.__XJW_SITE_WRAPPER__ = true;

  const VERSION = "20260809-02";
  const AUTHORITY = `site-product-data-authority.js?v=${VERSION}`;
  const CORE = `site-core-v410.js?v=${VERSION}`;
  const SAFETY = `site-product-image-safety.js?v=${VERSION}`;
  const VARIANTS = `site-official-product-variants.js?v=${VERSION}`;
  const HOTFIX = `site-ux-v4104.css?v=${VERSION}`;
  const FORMAL = `site-formal-v20260809.css?v=${VERSION}`;

  function appendScript(src, onload) {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    if (typeof onload === "function") script.onload = onload;
    document.head.appendChild(script);
  }
  function appendStyle(href, marker) {
    if (marker && document.querySelector(`link[href*="${marker}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }
  function loadSequentially() {
    appendScript(AUTHORITY, function () {
      appendScript(CORE, function () {
        appendScript(SAFETY, function () {
          appendScript(VARIANTS, function () {
            appendStyle(HOTFIX, "site-ux-v4104.css");
            appendStyle(FORMAL, "site-formal-v20260809.css");
          });
        });
      });
    });
  }
  if (document.readyState === "loading") {
    document.write('<script src="' + AUTHORITY + '"><\/script>');
    document.write('<script src="' + CORE + '"><\/script>');
    document.write('<script src="' + SAFETY + '"><\/script>');
    document.write('<script src="' + VARIANTS + '"><\/script>');
    document.write('<link rel="stylesheet" href="' + HOTFIX + '">');
    document.write('<link rel="stylesheet" href="' + FORMAL + '">');
  } else loadSequentially();
})();