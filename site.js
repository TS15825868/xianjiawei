"use strict";

// 先載入網站專用高解析小老闆情境圖，再載入網站核心內容。
document.write('<link rel="stylesheet" href="site-v321.css?v=402.0" data-site-version="402.0">');
document.write('<script src="site-fix-v317.js?v=402.0"><\/script>');
document.write('<script src="site-core.js?v=402.0"><\/script>');

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('img[src^="images/hero/home-brand-guilu-series.jpg"]').forEach((image) => {
    image.src = 'images/hero/home-brand-guilu-series.jpg?v=402.0';
  });
});
