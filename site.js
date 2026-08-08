"use strict";

/* 全站入口 2026-08-08：載入核心、六項正式產品原圖安全層與正式規格顯示層。 */
(function () {
  if (window.__XJW_SITE_WRAPPER__) return;
  window.__XJW_SITE_WRAPPER__ = true;

  const VERSION = "20260808-18";
  const CORE = `site-core-v410.js?v=${VERSION}`;
  const SAFETY = `site-product-image-safety.js?v=${VERSION}`;
  const VARIANTS = `site-official-product-variants.js?v=${VERSION}`;

  function appendScript(src, onload) {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    if (typeof onload === "function") script.onload = onload;
    document.head.appendChild(script);
  }
  function loadSequentially() {
    appendScript(CORE, function () {
      appendScript(SAFETY, function () { appendScript(VARIANTS); });
    });
  }
  if (document.readyState === "loading") {
    document.write('<script src="' + CORE + '"><\/script>');
    document.write('<script src="' + SAFETY + '"><\/script>');
    document.write('<script src="' + VARIANTS + '"><\/script>');
  } else loadSequentially();
})();
