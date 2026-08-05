"use strict";

/* 相容層：全站導覽由 site.js 管理；本檔另負責阻擋30cc舊版「瓶」圖。 */
(function(){
  const CLEAN_30CC_IMAGE = "images/products-v3/guilu-drink-30-clean.svg?v=411.0";
  const LEGACY_30CC_IMAGE = /(?:images\/products-v3\/guilu-drink-30\.jpg|images\/dm-final\/02_guilu-drink-30cc-dm\.jpg)/i;

  function repair30ccArtwork(root){
    const scope = root && root.querySelectorAll ? root : document;

    scope.querySelectorAll('img[src], source[srcset]').forEach((node) => {
      const value = node.getAttribute('src') || node.getAttribute('srcset') || '';
      if (!LEGACY_30CC_IMAGE.test(value)) return;
      if (node.tagName === 'SOURCE') node.setAttribute('srcset', CLEAN_30CC_IMAGE);
      else {
        node.setAttribute('src', CLEAN_30CC_IMAGE);
        node.setAttribute('alt', '龜鹿飲30cc／罐（小玻璃罐）正式產品圖');
        node.style.objectFit = 'contain';
      }
      node.dataset.xjwOfficial30cc = '1';
    });

    scope.querySelectorAll('a[href], [data-dm-src]').forEach((node) => {
      const href = node.getAttribute('href') || '';
      const dm = node.getAttribute('data-dm-src') || '';
      if (LEGACY_30CC_IMAGE.test(href)) node.setAttribute('href', CLEAN_30CC_IMAGE);
      if (LEGACY_30CC_IMAGE.test(dm)) node.setAttribute('data-dm-src', CLEAN_30CC_IMAGE);
      if ((LEGACY_30CC_IMAGE.test(href) || LEGACY_30CC_IMAGE.test(dm)) && /看產品DM|開啟正式DM|開啟完整DM/.test(node.textContent || '')) {
        node.textContent = '看正確產品圖';
      }
    });
  }

  function startArtworkGuard(){
    repair30ccArtwork(document);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === 1) {
            repair30ccArtwork(node);
            if (node.matches?.('img[src], source[srcset], a[href], [data-dm-src]')) repair30ccArtwork(node.parentElement || document);
          }
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startArtworkGuard, { once: true });
  else startArtworkGuard();

  if (window.__XJW_V410__ || window.__XJW_SITE_WRAPPER__) return;
  if (document.querySelector('script[data-xjw-v410-fallback]')) return;
  const script = document.createElement('script');
  script.src = 'site.js?v=411.0';
  script.async = false;
  script.dataset.xjwV410Fallback = '1';
  document.head.appendChild(script);
})();
