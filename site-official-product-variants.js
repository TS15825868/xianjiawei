"use strict";

/* 仙加味正式產品規格顯示層 v4
 * 使用者確認：六個正式產品各只保留目前正式規格；龜鹿湯塊深藍盒只有75g／盒。
 */
(function () {
  if (window.__XJW_OFFICIAL_VARIANTS_V4__) return;
  window.__XJW_OFFICIAL_VARIANTS_V4__ = true;

  const SOUP_ID = "guilu-tangkuai";
  const SOUP_SPEC = "75g／盒";
  const SOUP_DESCRIPTION = "龜鹿湯塊深藍盒目前唯一正式規格為75g／盒，可搭配熱水、保溫壺或家常燉湯。";

  function setSpec(element, prefix = "規格：") {
    if (!element) return;
    element.textContent = `${prefix}${SOUP_SPEC}`;
    element.style.whiteSpace = "normal";
    element.dataset.officialSoupSpec = "75g-only";
  }

  function normalizeProductCards(root = document) {
    root.querySelectorAll?.(`[data-product-id="${SOUP_ID}"]`).forEach((card) => {
      if (!String(card.querySelector("h3")?.textContent || "").includes("龜鹿湯塊")) return;
      const muted = Array.from(card.querySelectorAll(".muted")).find((item) => item.textContent.includes("規格"));
      setSpec(muted);
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
    setSpec(muted);
    const description = modal.querySelector(".modal-copy > p:not(.eyebrow):not(.product-purpose):not(.muted)");
    if (description) description.textContent = SOUP_DESCRIPTION;
    const lineLink = modal.querySelector(".modal-actions .btn-line");
    if (lineLink && typeof window.buildLineAutoLink === "function") {
      lineLink.href = window.buildLineAutoLink("我想了解龜鹿湯塊75g／盒的使用方式與購買方式。");
    }
  }

  function normalizeMobileCompare(root = document) {
    root.querySelectorAll?.(".mobile-compare-card").forEach((card) => {
      if (!String(card.querySelector("h3")?.textContent || "").includes("龜鹿湯塊")) return;
      const specTerm = Array.from(card.querySelectorAll("dt")).find((item) => item.textContent.trim() === "規格");
      const spec = specTerm?.nextElementSibling;
      if (spec) {
        spec.textContent = SOUP_SPEC;
        spec.dataset.officialSoupSpec = "75g-only";
      }
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
    observer.observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:["class"]});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, {once:true});
  else start();

  window.XJW_OFFICIAL_PRODUCT_VARIANTS = Object.freeze({
    soupProductId: SOUP_ID,
    soupSpecifications: [SOUP_SPEC],
    overviewDisplay: SOUP_SPEC,
    singleSpecOnly: true
  });
})();
