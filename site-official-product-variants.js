"use strict";

/* 仙加味正式產品規格顯示層 v3
 * 使用者確認：產品只有6項正式規格；龜鹿湯塊只保留75g／盒。
 */
(function () {
  if (window.__XJW_OFFICIAL_VARIANTS_V3__) return;
  window.__XJW_OFFICIAL_VARIANTS_V3__ = true;

  const SOUP_ID = "guilu-tangkuai";
  const SOUP_SPEC = "75g／盒";
  const SOUP_DESCRIPTION = "龜鹿湯塊目前唯一正式規格為75g／盒，可搭配熱水、保溫壺或家常燉湯。";

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

  function normalizeLooseText(root = document) {
    const replacements = [
      [/75g\s*／\s*300g\s*／\s*600g(?:（三種正式規格）)?/g, SOUP_SPEC],
      [/75g、300g、600g三種正式規格/g, SOUP_SPEC + "唯一正式規格"],
      [/龜鹿湯塊75g／300g／600g/g, "龜鹿湯塊75g／盒"],
      [/龜鹿湯塊有75g、300g、600g三種規格/g, "龜鹿湯塊目前只有75g／盒一種正式規格"]
    ];
    const walker = document.createTreeWalker(root.body || root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    nodes.forEach((textNode) => {
      const parent = textNode.parentElement;
      if (!parent || ["SCRIPT", "STYLE"].includes(parent.tagName)) return;
      let value = textNode.nodeValue;
      replacements.forEach(([pattern, replacement]) => { value = value.replace(pattern, replacement); });
      if (value !== textNode.nodeValue) textNode.nodeValue = value;
    });
  }

  let queued = false;
  function normalizeAll() {
    queued = false;
    normalizeProductCards();
    normalizeModal();
    normalizeMobileCompare();
    normalizeLooseText();
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
    deprecatedSoupSpecifications: ["300g／盒", "600g／盒"]
  });
})();
