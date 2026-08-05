"use strict";

(function(){
  const CLEAN_30CC_IMAGE = "images/products-v3/guilu-drink-30-clean.svg?v=411.0";
  const LEGACY_30CC_IMAGE = /(?:images\/products-v3\/guilu-drink-30\.jpg|images\/dm-final\/02_guilu-drink-30cc-dm\.jpg)/i;

  function repair(root){
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
      const affected = LEGACY_30CC_IMAGE.test(href) || LEGACY_30CC_IMAGE.test(dm);
      if (!affected) return;
      if (LEGACY_30CC_IMAGE.test(href)) node.setAttribute('href', CLEAN_30CC_IMAGE);
      if (LEGACY_30CC_IMAGE.test(dm)) node.setAttribute('data-dm-src', CLEAN_30CC_IMAGE);
      if (/看產品DM|開啟正式DM|開啟完整DM/.test(node.textContent || '')) node.textContent = '看正確產品圖';
    });
  }

  function start(){
    repair(document);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType !== 1) continue;
          repair(node);
          if (node.matches?.('img[src], source[srcset], a[href], [data-dm-src]')) repair(node.parentElement || document);
        }
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
