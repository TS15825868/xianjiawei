"use strict";

// v403.0：先載入官網專用小老闆場景，再載入網站核心內容。
document.write('<link rel="stylesheet" href="site-v321.css?v=403.0" data-site-version="403.0">');
document.write('<script src="site-fix-v317.js?v=403.0"><\/script>');
document.write('<script src="site-core.js?v=403.0"><\/script>');

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('img[src^="images/hero/home-brand-guilu-series.jpg"], img[src^="images/brand/scene-brand-all.svg"]').forEach((image) => {
    image.src = 'images/brand/scene-brand-all.svg?v=403.0';
    image.width = 1440;
    image.height = 1080;
  });
});
