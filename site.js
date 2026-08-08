"use strict";

/* 全站入口 2026-08-08：先套產品實際照片資料權威，再載入核心、安全層、正式規格與手機比例修正。 */
(function () {
  if (window.__XJW_SITE_WRAPPER__) return;
  window.__XJW_SITE_WRAPPER__ = true;

  const VERSION = "20260808-24";
  const AUTHORITY = `site-product-data-authority.js?v=${VERSION}`;
  const CORE = `site-core-v410.js?v=${VERSION}`;
  const SAFETY = `site-product-image-safety.js?v=${VERSION}`;
  const VARIANTS = `site-official-product-variants.js?v=${VERSION}`;
  const HOTFIX = `site-ux-v4104.css?v=${VERSION}`;

  function appendScript(src, onload) {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    if (typeof onload === "function") script.onload = onload;
    document.head.appendChild(script);
  }
  function appendStyle(href) {
    if (document.querySelector(`link[href*="site-ux-v4104.css"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }
  function loadSequentially() {
    appendScript(AUTHORITY, function () {
      appendScript(CORE, function () {
        appendScript(SAFETY, function () {
          appendScript(VARIANTS, function () { appendStyle(HOTFIX); });
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
  } else loadSequentially();
})();
