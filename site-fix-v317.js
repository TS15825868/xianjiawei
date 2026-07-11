"use strict";

(() => {
  const VERSION = "324.2";
  const SCENES = {
    home: { src: "images/brand/website-mascot-home.svg", alt: "仙加味小老闆揮手歡迎", eyebrow: "歡迎認識仙加味", title: "先從平常想怎麼使用開始" },
    products: { src: "images/brand/website-mascot-products.svg", alt: "仙加味小老闆展示全系列產品", eyebrow: "產品導覽", title: "先看產品型態，再比較規格與使用方式" },
    choose: { src: "images/brand/website-mascot-choose.svg", alt: "仙加味小老闆指引產品選擇", eyebrow: "怎麼選", title: "依使用情境比較會更清楚" },
    combo: { src: "images/brand/website-mascot-combo.svg", alt: "仙加味小老闆介紹搭配組合", eyebrow: "搭配組合", title: "依生活節奏查看產品搭配" },
    guide: { src: "images/brand/website-mascot-guide.svg", alt: "仙加味小老闆介紹使用方式", eyebrow: "使用方式", title: "沖泡、即飲與燉湯方式一次整理" },
    recipes: { src: "images/brand/website-mascot-recipes.svg", alt: "仙加味小老闆介紹料理搭配", eyebrow: "料理搭配", title: "把產品放進熟悉的飲食節奏" },
    faq: { src: "images/brand/website-mascot-faq.svg", alt: "仙加味小老闆整理常見問題", eyebrow: "常見問題", title: "產品、使用與購買問題一次整理" },
    contact: { src: "images/brand/website-mascot-contact.svg", alt: "仙加味小老闆提供人工客服", eyebrow: "官方 LINE 與門市", title: "需要協助時，直接留下訊息" },
    brand: { src: "images/brand/website-mascot-home.svg", alt: "仙加味小老闆介紹品牌故事", eyebrow: "品牌故事", title: "從萬華出發，延續四代工序" }
  };

  function ensureSection() {
    const page = document.body?.dataset?.page || "home";
    const config = SCENES[page] || SCENES.home;
    let section = document.getElementById("mascot-guide");
    if (section) return section;

    const hero = document.querySelector("main .hero");
    if (!hero) return null;

    section = document.createElement("section");
    section.id = "mascot-guide";
    section.className = "section mascot-guide-section";
    section.innerHTML = `
      <article class="mascot-guide-card reveal">
        <div class="mascot-guide-card__media"></div>
        <div class="mascot-guide-card__copy">
          <p class="eyebrow">${config.eyebrow}</p>
          <h2>${config.title}</h2>
          <p>小老闆會依這一頁的內容，帶你查看產品型態、使用方式與下一步操作。</p>
        </div>
      </article>`;
    hero.insertAdjacentElement("afterend", section);
    return section;
  }

  function applyScene() {
    const page = document.body?.dataset?.page || "home";
    const config = SCENES[page] || SCENES.home;
    const section = ensureSection();
    const media = section?.querySelector(".mascot-guide-card__media");
    if (!media) return false;

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
    image.onerror = () => {
      if (image.dataset.fallbackApplied === "1") return;
      image.dataset.fallbackApplied = "1";
      image.src = `images/brand/xianjiawei-scene-guide.jpg?v=${VERSION}`;
    };
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

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();