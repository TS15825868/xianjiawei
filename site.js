"use strict";

/* 全站入口 v412.2：先載入六項正式產品權威，再載入完整核心與30cc正式原圖。 */
(function(){
  if (window.__XJW_SITE_WRAPPER__) return;
  window.__XJW_SITE_WRAPPER__ = true;

  const AUTHORITY = "site-product-authority.js?v=412.2";
  const CORE = "site-core-v410.js?v=412.2";
  const SAFETY = "site-product-image-safety.js?v=412.2";

  function appendScript(src, onload){
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    if (typeof onload === "function") script.onload = onload;
    document.head.appendChild(script);
  }

  function loadSequentially(){
    appendScript(AUTHORITY, function(){
      appendScript(CORE, function(){
        appendScript(SAFETY);
      });
    });
  }

  if (document.readyState === "loading") {
    document.write('<script src="' + AUTHORITY + '"><\/script>');
    document.write('<script src="' + CORE + '"><\/script>');
    document.write('<script src="' + SAFETY + '"><\/script>');
  } else {
    loadSequentially();
  }
})();
