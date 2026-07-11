"use strict";

(() => {
  const VERSION = "324.0";
  const SPRITE = `images/brand/xianjiawei-web-scenes-v324.webp?v=${VERSION}`;

  const SCENES = {
    home: { position: "0% 0%", alt: "仙加味小老闆揮手歡迎" },
    products: { position: "33.333% 0%", alt: "仙加味小老闆展示全系列產品" },
    choose: { position: "66.667% 0%", alt: "仙加味小老闆指引產品選擇" },
    combo: { position: "100% 0%", alt: "仙加味小老闆比讚介紹搭配組合" },
    guide: { position: "0% 100%", alt: "仙加味小老闆示範倒入熱飲" },
    recipes: { position: "33.333% 100%", alt: "仙加味小老闆示範家常燉湯" },
    faq: { position: "66.667% 100%", alt: "仙加味小老闆思考常見問題" },
    contact: { position: "100% 100%", alt: "仙加味小老闆戴耳機提供人工客服" },
    brand: { position: "0% 0%", alt: "仙加味小老闆介紹品牌故事" }
  };

  function applyScene() {
    const page = document.body?.dataset?.page || "home";
    const media = document.querySelector("#mascot-guide .mascot-guide-card__media");
    if (!media) return false;

    const config = SCENES[page] || SCENES.home;
    let scene = media.querySelector(".mascot-guide-card__scene");

    if (!scene) {
      scene = document.createElement("div");
      media.replaceChildren(scene);
    }

    scene.className = "mascot-guide-card__scene";
    scene.setAttribute("role", "img");
    scene.setAttribute("aria-label", config.alt);
    Object.assign(scene.style, {
      display: "block",
      width: "100%",
      height: "100%",
      minHeight: "0",
      aspectRatio: "4 / 3",
      backgroundImage: `url("${SPRITE}")`,
      backgroundSize: "400% 200%",
      backgroundPosition: config.position,
      backgroundRepeat: "no-repeat",
      backgroundColor: "#efe4d2",
      imageRendering: "auto"
    });

    media.style.background = "#efe4d2";
    media.dataset.mascotVersion = VERSION;
    media.dataset.mascotPage = page;
    return true;
  }

  function installStyles() {
    if (document.getElementById("mascot-static-sprite-v324")) return;
    const style = document.createElement("style");
    style.id = "mascot-static-sprite-v324";
    style.textContent = `
      .mascot-guide-card__media {
        position: relative !important;
        width: 100% !important;
        aspect-ratio: 4 / 3 !important;
        min-height: 0 !important;
        overflow: hidden !important;
        background: #efe4d2 !important;
      }
      .mascot-guide-card__scene {
        display: block !important;
        width: 100% !important;
        height: 100% !important;
        aspect-ratio: 4 / 3 !important;
        filter: none !important;
        opacity: 1 !important;
        transform: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function start() {
    installStyles();
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
