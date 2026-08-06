"use strict";

/* 全站入口 v412.4：載入完整核心、產品原圖安全層與正式規格顯示層。 */
(function () {
  if (window.__XJW_SITE_WRAPPER__) return;
  window.__XJW_SITE_WRAPPER__ = true;

  const CORE = "site-core-v410.js?v=412.4";
  const SAFETY = "site-product-image-safety.js?v=412.4";
  const VARIANTS = "site-official-product-variants.js?v=412.4";

  function appendScript(src, onload) {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    if (typeof onload === "function") script.onload = onload;
    document.head.appendChild(script);
  }

  function loadSequentially() {
    appendScript(CORE, function () {
      appendScript(SAFETY, function () {
        appendScript(VARIANTS);
      });
    });
  }

  if (document.readyState === "loading") {
    document.write('<script src="' + CORE + '"><\/script>');
    document.write('<script src="' + SAFETY + '"><\/script>');
    document.write('<script src="' + VARIANTS + '"><\/script>');
  } else {
    loadSequentially();
  }
})();
