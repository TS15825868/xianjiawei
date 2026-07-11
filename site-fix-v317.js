"use strict";

(() => {
  const VERSION = "321.0";
  const SCENES = {
    home: `images/brand/xianjiawei-scene-welcome.jpg?v=${VERSION}`,
    products: `images/brand/xianjiawei-scene-products.jpg?v=${VERSION}`,
    choose: `images/brand/xianjiawei-scene-guide.jpg?v=${VERSION}`,
    combo: `images/brand/xianjiawei-scene-combo.jpg?v=${VERSION}`,
    guide: `images/brand/xianjiawei-scene-usage.jpg?v=${VERSION}`,
    recipes: `images/brand/xianjiawei-scene-usage.jpg?v=${VERSION}`,
    faq: `images/brand/xianjiawei-scene-service.jpg?v=${VERSION}`,
    contact: `images/brand/xianjiawei-scene-service.jpg?v=${VERSION}`,
    brand: `images/brand/xianjiawei-scene-brand.jpg?v=${VERSION}`
  };

  const FALLBACK_SCENE = `images/brand/xianjiawei-scene-guide.jpg?v=${VERSION}`;

  function ensureStylesheet() {
    if (document.querySelector('link[data-site-v321="1"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `site-v321.css?v=${VERSION}`;
    link.dataset.siteV321 = "1";
    document.head.appendChild(link);
  }

  function configureImage(image, page) {
    const expected = SCENES[page] || SCENES.home;
    image.className = "mascot-guide-card__image";
    image.src = expected;
    image.alt = "仙加味小老闆情境導覽";
    image.width = 1600;
    image.height = 1200;
    image.loading = page === "home" ? "eager" : "lazy";
    image.decoding = "async";
    image.fetchPriority = page === "home" ? "high" : "auto";
    image.removeAttribute("style");
    image.onerror = () => {
      if (image.dataset.fallbackApplied === "1") return;
      image.dataset.fallbackApplied = "1";
      image.src = FALLBACK_SCENE;
    };
    return image;
  }

  function applyMascotFix() {
    const page = document.body?.dataset?.page || "home";
    const media = document.querySelector("#mascot-guide .mascot-guide-card__media");
    if (!media) return false;

    let image = media.querySelector("img");
    if (!image) {
      image = document.createElement("img");
      media.replaceChildren(image);
    }

    configureImage(image, page);
    media.querySelectorAll(".mascot-guide-card__scene").forEach(node => node.remove());
    media.dataset.mascotVersion = VERSION;
    return true;
  }

  function start() {
    ensureStylesheet();

    if (applyMascotFix()) return;

    const observer = new MutationObserver(() => {
      if (applyMascotFix()) observer.disconnect();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    window.setTimeout(() => {
      applyMascotFix();
      observer.disconnect();
    }, 10000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
