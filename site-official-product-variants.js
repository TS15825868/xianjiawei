"use strict";

/*
 * 仙加味正式產品規格顯示層 v2
 * 龜鹿湯塊的 75g／300g／600g 都是正式規格，但一般列表只做精簡提示；
 * 完整盒數、塊數與每塊重量只在龜鹿湯塊詳細頁展開，避免首頁／總覽重複堆疊規格。
 */
(function () {
  if (window.__XJW_OFFICIAL_VARIANTS_V2__) return;
  window.__XJW_OFFICIAL_VARIANTS_V2__ = true;

  const SOUP_ID = "guilu-tangkuai";
  const SOUP_SPECS = ["75g", "300g", "600g"];
  const SOUP_OVERVIEW_SPEC = "75g／300g／600g（三種正式規格）";
  const SOUP_DESCRIPTION = "龜鹿湯塊為同一產品分類，提供三種正式規格；完整塊數、單塊重量與使用方式請查看產品詳細頁。";

  function setCompactSpec(element, prefix = "規格：") {
    if (!element) return;
    const expected = `${prefix}${SOUP_OVERVIEW_SPEC}`;
    if (element.textContent === expected) return;
    element.textContent = expected;
    element.style.whiteSpace = "normal";
    element.dataset.officialSoupVariants = "compact";
  }

  function normalizeProductCards(root = document) {
    root.querySelectorAll?.(`[data-product-id="${SOUP_ID}"]`).forEach((card) => {
      const name = card.querySelector("h3")?.textContent || "";
      if (!name.includes("龜鹿湯塊")) return;
      const muted = Array.from(card.querySelectorAll(".muted")).find((item) => item.textContent.includes("規格"));
      setCompactSpec(muted);
      const description = Array.from(card.querySelectorAll(".product-card__body > p"))
        .find((item) => !item.classList.contains("eyebrow") && !item.classList.contains("muted") && !item.classList.contains("product-purpose"));
      if (description) description.textContent = SOUP_DESCRIPTION;
    });
  }

  function normalizeModal(root = document) {
    const modal = root.querySelector?.("#product-modal") || document.getElementById("product-modal");
    if (!modal || !modal.classList.contains("show")) return;
    const title = modal.querySelector("#product-modal-title")?.textContent || "";
    if (!title.includes("龜鹿湯塊")) return;
    const muted = Array.from(modal.querySelectorAll(".modal-copy .muted")).find((item) => item.textContent.includes("規格"));
    setCompactSpec(muted);
    const description = modal.querySelector(".modal-copy > p:not(.eyebrow):not(.product-purpose):not(.muted)");
    if (description) description.textContent = SOUP_DESCRIPTION;
    const lineLink = modal.querySelector(".modal-actions .btn-line");
    if (lineLink && typeof window.buildLineAutoLink === "function") {
      lineLink.href = window.buildLineAutoLink("我想了解龜鹿湯塊三種正式規格與購買方式。");
    }
  }

  function normalizeMobileCompare(root = document) {
    root.querySelectorAll?.(".mobile-compare-card").forEach((card) => {
      if (!String(card.querySelector("h3")?.textContent || "").includes("龜鹿湯塊")) return;
      const terms = Array.from(card.querySelectorAll("dt"));
      const specTerm = terms.find((item) => item.textContent.trim() === "規格");
      const spec = specTerm?.nextElementSibling;
      if (!spec) return;
      spec.textContent = SOUP_OVERVIEW_SPEC;
      spec.style.whiteSpace = "normal";
      spec.dataset.officialSoupVariants = "compact";
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
    overviewDisplay: SOUP_OVERVIEW_SPEC,
    fullSpecificationPage: "product-guilu-tangkuai.html"
  });
})();