"use strict";

(() => {
  const VERSION = "324.1";
  const SCENES = {
    home: { src: "images/brand/website-mascot-home.svg", alt: "仙加味小老闆揮手歡迎" },
    products: { src: "images/brand/website-mascot-products.svg", alt: "仙加味小老闆展示全系列產品" },
    choose: { src: "images/brand/website-mascot-choose.svg", alt: "仙加味小老闆指引產品選擇" },
    combo: { src: "images/brand/website-mascot-combo.svg", alt: "仙加味小老闆介紹搭配組合" },
    guide: { src: "images/brand/website-mascot-guide.svg", alt: "仙加味小老闆介紹使用方式" },
    recipes: { src: "images/brand/website-mascot-recipes.svg", alt: "仙加味小老闆介紹料理搭配" },
    faq: { src: "images/brand/website-mascot-faq.svg", alt: "仙加味小老闆整理常見問題" },
    contact: { src: "images/brand/website-mascot-contact.svg", alt: "仙加味小老闆提供人工客服" },
    brand: { src: "images/brand/website-mascot-home.svg", alt: "仙加味小老闆介紹品牌故事" }
  };

  function applyScene() {
    const page = document.body?.dataset?.page || "home";
    const media = document.querySelector("#mascot-guide .mascot-guide-card__media");
    if (!media) return false;

    const config = SCENES[page] || SCENES.home;
    let image = media.querySelector("img");
    if (!image) {
      image = document.createElement("img");
      media.replaceChildren(image);
    }

    image.className = "mascot-guide-card__image";
    image.src = `${config.src}?v=${VERSION}`;
    image.alt = config.alt;
    image.width = 1200;
    image.height = 900;
    image.loading = page === "home" ? "eager" : "lazy";
    image.decoding = "async";
    image.fetchPriority = page === "home" ? "high" : "auto";
    image.removeAttribute("style");
    image.onerror = () => {
      if (image.dataset.fallbackApplied === "1") return;
      image.dataset.fallbackApplied = "1";
      image.src = `images/brand/xianjiawei-scene-guide.jpg?v=${VERSION}`;
    };

    media.querySelectorAll(".mascot-guide-card__scene").forEach((node) => node.remove());
    media.dataset.mascotVersion = VERSION;
    media.dataset.mascotPage = page;
    return true;
  }

  function start() {
    if (applyScene()) return;
    const observer = new MutationObserver(() => {
      if (applyScene()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => {
      applyScene();
      observer.disconnect();
    }, 10000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();