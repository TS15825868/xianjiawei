"use strict";

// v403.1：首頁只保留一張品牌小老闆圖，其餘核心頁各用一張不重複場景。
document.write('<link rel="stylesheet" href="site-v321.css?v=403.1" data-site-version="403.1">');
document.write('<script src="site-fix-v317.js?v=403.1"><\/script>');
document.write('<script src="site-core.js?v=403.1"><\/script>');

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('img[src^="images/hero/home-brand-guilu-series.jpg"], img[src^="images/brand/scene-brand-all.svg"]').forEach((image) => {
    image.src = 'images/brand/scene-brand-all.svg?v=403.1';
    image.width = 1440;
    image.height = 1080;
  });
});
