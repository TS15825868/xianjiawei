"use strict";

(() => {
  const SCENES = {
    home: "images/brand/xianjiawei-scene-welcome.jpg?v=317.1",
    products: "images/brand/xianjiawei-scene-products.jpg?v=317.1",
    choose: "images/brand/xianjiawei-scene-guide.jpg?v=317.1",
    combo: "images/brand/xianjiawei-scene-combo.jpg?v=317.1",
    guide: "images/brand/xianjiawei-scene-usage.jpg?v=317.1",
    recipes: "images/brand/xianjiawei-scene-usage.jpg?v=317.1",
    faq: "images/brand/xianjiawei-scene-service.jpg?v=317.1",
    contact: "images/brand/xianjiawei-scene-service.jpg?v=317.1",
    brand: "images/brand/xianjiawei-scene-brand.jpg?v=317.1"
  };

  const COPY = {
    products: {
      text: "龜鹿膏、龜鹿飲30cc、龜鹿湯塊、龜鹿膠與鹿茸粉，各有不同的日常使用情境。"
    }
  };

  function makeImage(page) {
    const image = document.createElement("img");
    image.src = SCENES[page] || SCENES.home;
    image.alt = "仙加味小老闆情境導覽";
    image.width = 1000;
    image.height = 750;
    image.loading = page === "home" ? "eager" : "lazy";
    image.decoding = "async";
    image.style.width = "100%";
    image.style.height = "100%";
    image.style.objectFit = "cover";
    image.style.display = "block";
    image.addEventListener("error", () => {
      if (!image.dataset.fallback) {
        image.dataset.fallback = "1";
        image.src = "images/brand/xianjiawei-scene-guide.jpg?v=317.1";
      }
    });
    return image;
  }

  function applyMascotFix() {
    const page = document.body?.dataset?.page || "home";
    const media = document.querySelector("#mascot-guide .mascot-guide-card__media");
    if (!media) return false;

    let image = media.querySelector("img");
    const spriteScene = media.querySelector(".mascot-guide-card__scene");
    if (spriteScene || !image) {
      media.replaceChildren(makeImage(page));
      image = media.querySelector("img");
    } else {
      const expected = SCENES[page] || SCENES.home;
      if (!image.getAttribute("src")?.includes(expected.split("?")[0])) image.src = expected;
      image.style.width = "100%";
      image.style.height = "100%";
      image.style.objectFit = "cover";
      image.style.display = "block";
    }

    media.style.background = "#efe4d2";
    const pageCopy = COPY[page];
    if (pageCopy?.text) {
      const paragraph = document.querySelector("#mascot-guide .mascot-guide-card__copy > p:not(.eyebrow)");
      if (paragraph) paragraph.textContent = pageCopy.text;
    }
    return true;
  }

  function cleanRetiredWebsiteProduct() {
    const replacements = [
      ["看六大產品", "看五大產品"],
      ["六大產品", "五大產品"],
      ["龜鹿飲30cc、龜鹿飲180cc鋁袋、", "龜鹿飲30cc、"],
      ["龜鹿飲30cc、龜鹿飲180cc、", "龜鹿飲30cc、"],
      ["、龜鹿飲180cc鋁袋", ""],
      ["、龜鹿飲180cc", ""]
    ];

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      let value = node.nodeValue || "";
      replacements.forEach(([from, to]) => { value = value.split(from).join(to); });
      node.nodeValue = value;
    });

    document.querySelectorAll("article, .product-card, [data-product-id]").forEach(card => {
      const id = String(card.getAttribute("data-product-id") || "");
      const text = String(card.textContent || "");
      if (id === "guilu-drink-180" || text.includes("龜鹿飲180cc鋁袋")) card.remove();
    });
  }

  function installMobileSpacing() {
    if (document.getElementById("site-fix-v317-style")) return;
    const style = document.createElement("style");
    style.id = "site-fix-v317-style";
    style.textContent = `
      .mascot-guide-card__media { overflow: hidden; background: #efe4d2; }
      .mascot-guide-card__media img { width: 100%; height: 100%; object-fit: cover; display: block; }
      @media (max-width: 760px) {
        .mascot-guide-card__copy { padding-bottom: 5.5rem; }
        .floating-line-cta { right: 0.85rem; bottom: calc(0.85rem + env(safe-area-inset-bottom)); transform: scale(.92); transform-origin: right bottom; }
      }
    `;
    document.head.appendChild(style);
  }

  function applyAll() {
    installMobileSpacing();
    cleanRetiredWebsiteProduct();
    return applyMascotFix();
  }

  function start() {
    if (applyAll()) return;
    const observer = new MutationObserver(() => {
      cleanRetiredWebsiteProduct();
      if (applyMascotFix()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => {
      applyAll();
      observer.disconnect();
    }, 10000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
