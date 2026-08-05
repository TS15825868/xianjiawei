"use strict";

(function(){
  const VERSION = "412.1";
  const CLEAN_30CC_IMAGE = `images/products-v3/guilu-drink-30-clean.svg?v=${VERSION}`;
  const LEGACY_OR_OUTDATED_30CC_IMAGE = /(?:images\/products-v3\/guilu-drink-30\.jpg|images\/dm-final\/02_guilu-drink-30cc-dm\.jpg|images\/products-v3\/guilu-drink-30-clean\.svg(?:\?[^#"']*)?)/i;

  function isCurrent(value){
    return String(value || '').includes(`images/products-v3/guilu-drink-30-clean.svg?v=${VERSION}`);
  }

  function repair(root){
    const scope = root && root.querySelectorAll ? root : document;

    scope.querySelectorAll('img[src], source[srcset]').forEach((node) => {
      const value = node.getAttribute('src') || node.getAttribute('srcset') || '';
      if (!LEGACY_OR_OUTDATED_30CC_IMAGE.test(value) || isCurrent(value)) return;
      if (node.tagName === 'SOURCE') node.setAttribute('srcset', CLEAN_30CC_IMAGE);
      else {
        node.setAttribute('src', CLEAN_30CC_IMAGE);
        node.setAttribute('alt', '龜鹿飲30cc／罐（小玻璃罐）正式產品原圖');
        node.style.objectFit = 'contain';
        node.style.objectPosition = 'center';
      }
      node.dataset.xjwOfficial30cc = VERSION;
    });

    scope.querySelectorAll('a[href], [data-dm-src]').forEach((node) => {
      const href = node.getAttribute('href') || '';
      const dm = node.getAttribute('data-dm-src') || '';
      const affectedHref = LEGACY_OR_OUTDATED_30CC_IMAGE.test(href) && !isCurrent(href);
      const affectedDm = LEGACY_OR_OUTDATED_30CC_IMAGE.test(dm) && !isCurrent(dm);
      if (!affectedHref && !affectedDm) return;
      if (affectedHref) node.setAttribute('href', CLEAN_30CC_IMAGE);
      if (affectedDm) node.setAttribute('data-dm-src', CLEAN_30CC_IMAGE);
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

  window.XJWProductImageSafety = Object.freeze({ version: VERSION, clean30ccImage: CLEAN_30CC_IMAGE, repair });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
