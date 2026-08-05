"use strict";

/* 舊頁相容入口：不再改寫產品圖片，只在舊頁未載入正式核心時補載 site.js。 */
(function(){
  if (window.__XJW_V410__ || window.__XJW_SITE_WRAPPER__) return;
  if (document.querySelector('script[data-xjw-v410-fallback]')) return;

  const script = document.createElement('script');
  script.src = 'site.js?v=412.2';
  script.async = false;
  script.dataset.xjwV410Fallback = '1';
  document.head.appendChild(script);
})();
