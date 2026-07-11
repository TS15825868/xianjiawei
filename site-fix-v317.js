"use strict";

(() => {
  const VERSION = "323.0";

  // 網站固定使用既有清楚原圖，不再由程式把所有頁面強制換成同一張。
  // 新情境圖尚未放入時，會使用最接近的既有原圖備援，避免黑圖或破圖。
  const PAGE_IMAGES = {
    home: {
      src: "images/brand/xianjiawei-scene-welcome.jpg",
      fallback: "images/brand/xianjiawei-scene-guide.jpg",
      alt: "仙加味小老闆揮手歡迎"
    },
    products: {
      src: "images/brand/xianjiawei-scene-products.jpg",
      fallback: "images/brand/xianjiawei-scene-guide.jpg",
      alt: "仙加味小老闆展示全系列產品"
    },
    choose: {
      src: "images/brand/xianjiawei-scene-guide.jpg",
      fallback: "images/brand/xianjiawei-scene-welcome.jpg",
      alt: "仙加味小老闆指向產品選擇看板"
    },
    combo: {
      src: "images/brand/xianjiawei-scene-combo.jpg",
      fallback: "images/brand/xianjiawei-scene-products.jpg",
      alt: "仙加味小老闆比讚介紹搭配組合"
    },
    guide: {
      src: "images/brand/xianjiawei-scene-usage.jpg",
      fallback: "images/brand/xianjiawei-scene-guide.jpg",
      alt: "仙加味小老闆示範倒入熱飲"
    },
    recipes: {
      src: "images/brand/xianjiawei-scene-recipes.jpg",
      fallback: "images/brand/xianjiawei-scene-usage.jpg",
      alt: "仙加味小老闆示範家常燉湯"
    },
    faq: {
      src: "images/brand/xianjiawei-scene-faq.jpg",
      fallback: "images/brand/xianjiawei-scene-service.jpg",
      alt: "仙加味小老闆思考常見問題"
    },
    contact: {
      src: "images/brand/xianjiawei-scene-service.jpg",
      fallback: "images/brand/xianjiawei-scene-welcome.jpg",
      alt: "仙加味小老闆戴耳機提供人工客服"
    },
    brand: {
      src: "images/brand/xianjiawei-scene-welcome.jpg",
      fallback: "images/brand/xianjiawei-scene-guide.jpg",
      alt: "仙加味小老闆介紹品牌故事"
    }
  };

  function ensureStylesheet() {
    if (document.querySelector('link[data-site-v323="1"]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `site-v321.css?v=${VERSION}`;
    link.dataset.siteV323 = "1";
    document.head.appendChild(link);
  }

  function configureImage(image, page) {
    const config = PAGE_IMAGES[page] || PAGE_IMAGES.home;
    image.className = "mascot-guide-card__image";
    image.src = `${config.src}?v=${VERSION}`;
    image.alt = config.alt;
    image.width = 1920;
    image.height = 1440;
    image.loading = page === "home" ? "eager" : "lazy";
    image.decoding = "async";
    image.fetchPriority = page === "home" ? "high" : "auto";
    image.removeAttribute("style");
    image.onerror = () => {
      if (image.dataset.fallbackApplied === "1") return;
      image.dataset.fallbackApplied = "1";
      image.src = `${config.fallback}?v=${VERSION}`;
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
    media.dataset.mascotPage = page;
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