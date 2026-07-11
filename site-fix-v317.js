"use strict";

(() => {
  // 先以已確認可正常顯示的網站專用小老闆圖統一套用，
  // 避免部分情境圖檔損壞時在 iPhone Safari 顯示黑色區塊。
  const STABLE_SCENE = "images/brand/xianjiawei-scene-guide.jpg?v=318.0";

  function makeImage(page) {
    const image = document.createElement("img");
    image.src = STABLE_SCENE;
    image.alt = "仙加味小老闆情境導覽";
    image.width = 1000;
    image.height = 750;
    image.loading = page === "home" ? "eager" : "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    Object.assign(image.style, {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block",
      background: "#efe4d2"
    });
    return image;
  }

  function applyMascotFix() {
    const page = document.body?.dataset?.page || "home";
    const media = document.querySelector("#mascot-guide .mascot-guide-card__media");
    if (!media) return false;

    const currentImage = media.querySelector("img");
    const currentSrc = currentImage?.getAttribute("src") || "";
    const hasBrokenSprite = Boolean(media.querySelector(".mascot-guide-card__scene"));

    if (hasBrokenSprite || !currentImage || !currentSrc.includes("xianjiawei-scene-guide.jpg")) {
      media.replaceChildren(makeImage(page));
    } else {
      currentImage.src = STABLE_SCENE;
      Object.assign(currentImage.style, {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        background: "#efe4d2"
      });
    }

    media.style.background = "#efe4d2";
    media.style.minHeight = "240px";
    media.dataset.mascotFixed = "1";
    return true;
  }

  function installStyles() {
    if (document.getElementById("site-fix-v318-style")) return;
    const style = document.createElement("style");
    style.id = "site-fix-v318-style";
    style.textContent = `
      .mascot-guide-card__media {
        overflow: hidden;
        background: #efe4d2 !important;
        min-height: 240px;
      }
      .mascot-guide-card__media img {
        width: 100% !important;
        height: 100% !important;
        min-height: 240px;
        object-fit: cover !important;
        display: block !important;
        background: #efe4d2 !important;
      }
      @media (max-width: 760px) {
        .mascot-guide-card__copy { padding-bottom: 5.5rem; }
        .floating-line-cta {
          right: 0.85rem;
          bottom: calc(0.85rem + env(safe-area-inset-bottom));
          transform: scale(.92);
          transform-origin: right bottom;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function start() {
    installStyles();
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
