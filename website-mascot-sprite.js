"use strict";

(() => {
  const POSITIONS = {
    home: "0% 0%",
    products: "33.333% 0%",
    choose: "66.666% 0%",
    combo: "100% 0%",
    guide: "0% 100%",
    recipes: "33.333% 100%",
    faq: "66.666% 100%",
    contact: "100% 100%",
    brand: "0% 0%"
  };

  let spriteUrlPromise = null;

  function getSpriteUrl() {
    if (spriteUrlPromise) return spriteUrlPromise;

    spriteUrlPromise = Promise.all([
      fetch("assets/website-sprite-part01.txt?v=316.1").then(response => {
        if (!response.ok) throw new Error(`sprite part01: ${response.status}`);
        return response.text();
      }),
      fetch("assets/website-sprite-part02.txt?v=316.1").then(response => {
        if (!response.ok) throw new Error(`sprite part02: ${response.status}`);
        return response.text();
      })
    ]).then(parts => {
      const base64 = parts.join("").replace(/\s+/g, "");
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      return URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
    });

    return spriteUrlPromise;
  }

  async function applyWebsiteMascot() {
    const media = document.querySelector("#mascot-guide .mascot-guide-card__media");
    const image = media?.querySelector("img");
    if (!media || !image || media.dataset.spriteApplied === "1") return;

    try {
      const spriteUrl = await getSpriteUrl();
      const page = document.body?.dataset?.page || "home";
      const scene = document.createElement("div");
      scene.className = "mascot-guide-card__scene";
      scene.setAttribute("role", "img");
      scene.setAttribute("aria-label", image.alt || "仙加味小老闆情境導覽");
      Object.assign(scene.style, {
        width: "100%",
        aspectRatio: "4 / 3",
        backgroundImage: `url("${spriteUrl}")`,
        backgroundSize: "400% 200%",
        backgroundPosition: POSITIONS[page] || "0% 0%",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#efe4d2"
      });
      media.dataset.spriteApplied = "1";
      image.replaceWith(scene);
    } catch (error) {
      console.error("網站小老闆圖片載入失敗：", error);
    }
  }

  function start() {
    applyWebsiteMascot();
    const observer = new MutationObserver(() => applyWebsiteMascot());
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 8000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
