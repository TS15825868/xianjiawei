"use strict";

(() => {
  const SCENES = {
    home: "images/brand/xianjiawei-scene-welcome.jpg?v=317.2",
    products: "images/brand/xianjiawei-scene-products.jpg?v=317.2",
    choose: "images/brand/xianjiawei-scene-guide.jpg?v=317.2",
    combo: "images/brand/xianjiawei-scene-combo.jpg?v=317.2",
    guide: "images/brand/xianjiawei-scene-usage.jpg?v=317.2",
    recipes: "images/brand/xianjiawei-scene-usage.jpg?v=317.2",
    faq: "images/brand/xianjiawei-scene-service.jpg?v=317.2",
    contact: "images/brand/xianjiawei-scene-service.jpg?v=317.2",
    brand: "images/brand/xianjiawei-scene-brand.jpg?v=317.2"
  };

  function makeImage(page) {
    const image = document.createElement("img");
    image.src = SCENES[page] || SCENES.home;
    image.alt = "仙加味小老闆情境導覽";
    image.width = 1000;
    image.height = 750;
    image.loading = page === "home" ? "eager" : "lazy";
    image.decoding = "async";
    Object.assign(image.style, {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block"
    });
    image.addEventListener("error", () => {
      if (!image.dataset.fallback) {
        image.dataset.fallback = "1";
        image.src = "images/brand/xianjiawei-scene-guide.jpg?v=317.2";
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
      Object.assign(image.style, {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block"
      });
    }

    media.style.background = "#efe4d2";
    return true;
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

  function start() {
    installMobileSpacing();
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
