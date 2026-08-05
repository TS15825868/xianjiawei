"use strict";

/* 30cc正式原圖相容層：舊SVG、舊瓶字樣圖與錯誤DM一律導向裸小玻璃罐正式原圖。 */
(function(){
  const VERSION = "412.2";
  const OFFICIAL_IMAGE = `images/guilu-drink-30cc-glass.jpg?v=${VERSION}`;
  const LEGACY = /(?:images\/products-v3\/guilu-drink-30\.jpg|images\/dm-final\/02_guilu-drink-30cc-dm\.jpg|guilu-drink-30-clean\.svg|30cc[^/]*bottle|30cc[^/]*瓶)/i;

  function repair(root){
    const scope = root?.querySelectorAll ? root : document;

    scope.querySelectorAll('img[src], source[srcset]').forEach((node) => {
      const attr = node.tagName === 'SOURCE' ? 'srcset' : 'src';
      const value = node.getAttribute(attr) || '';
      if (!LEGACY.test(value)) return;
      node.setAttribute(attr, OFFICIAL_IMAGE);
      if (node.tagName !== 'SOURCE') {
        node.alt = '龜鹿飲30cc小玻璃裸罐正式原圖';
        node.style.objectFit = 'contain';
        node.style.objectPosition = 'center';
      }
      node.dataset.xjwOfficial30cc = VERSION;
    });

    scope.querySelectorAll('a[href], [data-dm-src]').forEach((node) => {
      const href = node.getAttribute('href') || '';
      const dm = node.getAttribute('data-dm-src') || '';
      if (LEGACY.test(href)) node.setAttribute('href', OFFICIAL_IMAGE);
      if (LEGACY.test(dm)) node.setAttribute('data-dm-src', OFFICIAL_IMAGE);
    });
  }

  function start(){
    repair(document);
    const observer = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        repair(node);
        if (node.matches?.('img[src], source[srcset], a[href], [data-dm-src]')) repair(node.parentElement || document);
      }));
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.XJWProductImageSafety = Object.freeze({ version: VERSION, officialImage: OFFICIAL_IMAGE, repair });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
