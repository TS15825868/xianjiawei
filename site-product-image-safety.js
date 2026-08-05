"use strict";

/* 30cc正式原圖相容層：只把舊SVG／舊瓶圖導向裸小玻璃罐原圖與正確DM。 */
(function(){
  const VERSION = "412.2";
  const PRODUCT_IMAGE = `images/products-v3/guilu-drink-30.jpg?v=${VERSION}`;
  const DM_IMAGE = `images/dm-final/02_guilu-drink-30cc-dm.jpg?v=${VERSION}`;
  const LEGACY = /(?:guilu-drink-30-clean\.svg|guilu-drink-30cc-glass\.jpg|30cc[^/]*bottle|30cc[^/]*瓶)/i;

  function isDmNode(node){
    return Boolean(node?.closest?.('.dm-image-v2, .product-dm-compact, .product-dm-thumb, [data-dm-src]'));
  }

  function repair(root){
    const scope = root?.querySelectorAll ? root : document;

    scope.querySelectorAll('img[src], source[srcset]').forEach((node) => {
      const attr = node.tagName === 'SOURCE' ? 'srcset' : 'src';
      const value = node.getAttribute(attr) || '';
      if (!LEGACY.test(value)) return;
      const replacement = isDmNode(node) ? DM_IMAGE : PRODUCT_IMAGE;
      node.setAttribute(attr, replacement);
      if (node.tagName !== 'SOURCE') {
        node.alt = isDmNode(node)
          ? '龜鹿飲30cc玻璃罐正式產品DM'
          : '龜鹿飲30cc小玻璃裸罐正式原圖';
        node.style.objectFit = 'contain';
        node.style.objectPosition = 'center';
      }
      node.dataset.xjwOfficial30cc = VERSION;
    });

    scope.querySelectorAll('a[href], [data-dm-src]').forEach((node) => {
      const href = node.getAttribute('href') || '';
      const dm = node.getAttribute('data-dm-src') || '';
      if (LEGACY.test(href)) node.setAttribute('href', DM_IMAGE);
      if (LEGACY.test(dm)) node.setAttribute('data-dm-src', DM_IMAGE);
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

  window.XJWProductImageSafety = Object.freeze({
    version: VERSION,
    productImage: PRODUCT_IMAGE,
    dmImage: DM_IMAGE,
    repair,
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
