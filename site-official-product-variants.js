"use strict";

/*
 * 仙加味正式產品規格顯示層 v1
 * 將龜鹿湯塊75g／300g／600g三種正式規格同步到動態產品卡、快速查看與行動版比較。
 * 不改產品圖、不改售價，也不把三種規格拆成額外產品分類。
 */
(function () {
  if (window.__XJW_OFFICIAL_VARIANTS_V1__) return;
  window.__XJW_OFFICIAL_VARIANTS_V1__ = true;

  const SOUP_ID = "guilu-tangkuai";
  const SOUP_SPECS = [
    "75g／盒｜8塊裝｜每塊約9.375g",
    "300g／盒｜16塊裝｜每塊約18.75g",
    "600g／盒｜32塊裝｜每塊約18.75g",
  ];
  const SOUP_SPEC_TEXT = SOUP_SPECS.join("\n");
  const SOUP_DESCRIPTION = "龜鹿湯塊共有75g、300g、600g三種正式規格，可依使用量選擇，適合熱水沖泡、保溫壺或家常燉湯。";

  function setMultilineText(element, prefix = "規格：") {
    if (!element) return;
    const expected = `${prefix}${SOUP_SPEC_TEXT}`;
    if (element.textContent === expected) return;
    element.textContent = expected;
    element.style.whiteSpace = "pre-line";
    element.dataset.officialSoupVariants = "true";
  }

  function normalizeProductCards(root = document) {
    root.querySelectorAll?.(`[data-product-id="${SOUP_ID}"]`).forEach((card) => {
      const name = card.querySelector("h3")?.textContent || "";
      if (!name.includes("龜鹿湯塊")) return;
      const muted = Array.from(card.querySelectorAll(".muted")).find((item) => item.textContent.includes("規格"));
      setMultilineText(muted);
      const description = Array.from(card.querySelectorAll(".product-card__body > p"))
        .find((item) => !item.classList.contains("eyebrow") && !item.classList.contains("muted") && !item.classList.contains("product-purpose"));
      if (description && !description.textContent.includes("300g")) description.textContent = SOUP_DESCRIPTION;
    });
  }

  function normalizeModal(root = document) {
    const modal = root.querySelector?.("#product-modal") || document.getElementById("product-modal");
    if (!modal || !modal.classList.contains("show")) return;
    const title = modal.querySelector("#product-modal-title")?.textContent || "";
    if (!title.includes("龜鹿湯塊")) return;
    const muted = Array.from(modal.querySelectorAll(".modal-copy .muted")).find((item) => item.textContent.includes("規格"));
    setMultilineText(muted);
    const description = modal.querySelector(".modal-copy > p:not(.eyebrow):not(.product-purpose):not(.muted)");
    if (description && !description.textContent.includes("300g")) description.textContent = SOUP_DESCRIPTION;
    const lineLink = modal.querySelector(".modal-actions .btn-line");
    if (lineLink && typeof window.buildLineAutoLink === "function") {
      lineLink.href = window.buildLineAutoLink("我想了解龜鹿湯塊75g、300g、600g三種規格與購買方式。");
    }
  }

  function normalizeMobileCompare(root = document) {
    root.querySelectorAll?.(".mobile-compare-card").forEach((card) => {
      if (!String(card.querySelector("h3")?.textContent || "").includes("龜鹿湯塊")) return;
      const terms = Array.from(card.querySelectorAll("dt"));
      const specTerm = terms.find((item) => item.textContent.trim() === "規格");
      const spec = specTerm?.nextElementSibling;
      if (!spec || spec.textContent.includes("300g")) return;
      spec.textContent = SOUP_SPEC_TEXT;
      spec.style.whiteSpace = "pre-line";
      spec.dataset.officialSoupVariants = "true";
    });
  }

  let queued = false;
  function normalizeAll() {
    queued = false;
    normalizeProductCards();
    normalizeModal();
    normalizeMobileCompare();
  }

  function queueNormalize() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(normalizeAll);
  }

  const observer = new MutationObserver(queueNormalize);

  function start() {
    normalizeAll();
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  window.XJW_OFFICIAL_PRODUCT_VARIANTS = Object.freeze({
    soupProductId: SOUP_ID,
    soupSpecifications: [...SOUP_SPECS],
  });
})();
