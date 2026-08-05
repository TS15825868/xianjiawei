"use strict";

/*
 * 官網六項正式產品資料執行層。
 * 僅修正已被使用者明確廢止的舊規格；不更動價格、圖片比例或其他內容。
 */
(function () {
  if (window.__XJW_PRODUCT_AUTHORITY__) return;
  window.__XJW_PRODUCT_AUTHORITY__ = true;

  const OLD_JIAO = "600g／盒（1斤）｜32塊裝｜每塊約18.75g";
  const NEW_JIAO = "600g（1斤）／盒｜32塊裝｜每塊約18.75g";
  const replacements = new Map([
    [OLD_JIAO, NEW_JIAO],
    ["600g／盒（1斤）", "600g（1斤）／盒"],
    ["龜鹿飲30cc玻璃瓶", "龜鹿飲30cc玻璃罐"],
    ["30cc／瓶（小玻璃瓶）", "30cc／罐（小玻璃罐）"],
  ]);

  function normalizeString(value) {
    let output = String(value ?? "");
    for (const [before, after] of replacements) output = output.split(before).join(after);
    return output;
  }

  function normalizeValue(value) {
    if (typeof value === "string") return normalizeString(value);
    if (Array.isArray(value)) return value.map(normalizeValue);
    if (value && typeof value === "object") {
      for (const key of Object.keys(value)) value[key] = normalizeValue(value[key]);
    }
    return value;
  }

  const nativeFetch = window.fetch?.bind(window);
  if (nativeFetch) {
    window.fetch = async function authorityFetch(input, init) {
      const response = await nativeFetch(input, init);
      const url = String(typeof input === "string" ? input : input?.url || "");
      if (!/(?:data|catalog-public|geo-data)\.json(?:[?#]|$)/i.test(url)) return response;
      try {
        const data = normalizeValue(await response.clone().json());
        const headers = new Headers(response.headers);
        headers.set("content-type", "application/json; charset=utf-8");
        headers.set("x-xjw-product-authority", "2026-08-05-v4");
        return new Response(JSON.stringify(data), {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      } catch (_) {
        return response;
      }
    };
  }

  function normalizeTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE) return;
    const next = normalizeString(node.nodeValue);
    if (next !== node.nodeValue) node.nodeValue = next;
  }

  function normalizeDom(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) normalizeTextNode(node);
  }

  function startDomAuthority() {
    normalizeDom(document.body);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) normalizeTextNode(node);
          else if (node.nodeType === Node.ELEMENT_NODE) normalizeDom(node);
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startDomAuthority, { once: true });
  else startDomAuthority();
})();
