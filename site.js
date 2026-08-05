"use strict";

/* 全站入口 v412.3：正式資料已在來源檔統一，只載入完整核心與產品原圖安全層。 */
(function () {
  if (window.__XJW_SITE_WRAPPER__) return;
  window.__XJW_SITE_WRAPPER__ = true;

  const CORE = "site-core-v410.js?v=412.3";
  const SAFETY = "site-product-image-safety.js?v=412.3";

  function appendScript(src, onload) {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    if (typeof onload === "function") script.onload = onload;
    document.head.appendChild(script);
  }

  function loadSequentially() {
    appendScript(CORE, function () {
      appendScript(SAFETY);
    });
  }

  if (document.readyState === "loading") {
    document.write('<script src="' + CORE + '"><\/script>');
    document.write('<script src="' + SAFETY + '"><\/script>');
  } else {
    loadSequentially();
  }
})();
