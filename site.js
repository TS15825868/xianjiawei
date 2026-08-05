"use strict";

/* 全站入口 v412.1：保留完整核心，並在所有頁面套用30cc正式原圖守門。 */
(function(){
  if (window.__XJW_SITE_WRAPPER__) return;
  window.__XJW_SITE_WRAPPER__ = true;

  const CORE = "site-core-v410.js?v=412.1";
  const SAFETY = "site-product-image-safety.js?v=412.1";

  function loadSequentially(){
    const core = document.createElement("script");
    core.src = CORE;
    core.async = false;
    core.onload = function(){
      const safety = document.createElement("script");
      safety.src = SAFETY;
      safety.async = false;
      document.head.appendChild(safety);
    };
    document.head.appendChild(core);
  }

  if (document.readyState === "loading") {
    document.write('<script src="' + CORE + '"><\/script>');
    document.write('<script src="' + SAFETY + '"><\/script>');
  } else {
    loadSequentially();
  }
})();
