"use strict";

(() => {
  const VERSION = "322.0";
  const SHARP_SCENE = `images/brand/xianjiawei-scene-guide.jpg?v=${VERSION}`;

  function ensureStylesheet() {
    if (document.querySelector('link[data-site-v322="1"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `site-v321.css?v=${VERSION}`;
    link.dataset.siteV322 = "1";
    document.head.appendChild(link);
  }

  function configureImage(image, page) {
    image.className = "mascot-guide-card__image";
    image.src = SHARP_SCENE;
    image.alt = "仙加味小老闆情境導覽";
    image.width = 1920;
    image.height = 1440;
    image.loading = page === "home" ? "eager" : "lazy";
    image.decoding = "async";
    image.fetchPriority = page === "home" ? "high" : "auto";
    image.removeAttribute("style");
    image.onerror = null;
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
    observer.observe(document.documentElement, { childList: true, subtree: true });
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
