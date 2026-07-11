"use strict";

(() => {
  const VERSION = "400.2";
  const SCENES = {
    home: {
      src: "images/brand/website-mascot-home.jpg",
      alt: "仙加味小老闆揮手歡迎",
      eyebrow: "歡迎認識仙加味",
      title: "先從平常想怎麼使用開始",
      text: "固定安排、方便即飲、沖泡燉湯、家庭規格或自行調飲，都可以從日常習慣開始比較。",
      primary: ["認識產品", "products.html"],
      secondary: ["怎麼選", "choose.html"]
    },
    products: {
      src: "images/brand/website-mascot-products.jpg",
      alt: "仙加味小老闆展示全系列產品",
      eyebrow: "產品導覽",
      title: "先看產品型態，再比較規格與使用方式",
      text: "從龜鹿膏、龜鹿飲、龜鹿湯塊、龜鹿膠與鹿茸粉，依使用方式查看適合的產品資訊。",
      primary: ["怎麼選", "choose.html"],
      secondary: ["使用方式", "guide.html"]
    },
    choose: {
      src: "images/brand/website-mascot-choose.jpg",
      alt: "仙加味小老闆指向選擇看板",
      eyebrow: "怎麼選",
      title: "依使用情境比較會更清楚",
      text: "先從固定取用、方便即飲、沖泡燉湯、家庭使用或自行調飲開始選擇。",
      primary: ["看全部產品", "products.html"],
      secondary: ["搭配組合", "combo.html"]
    },
    combo: {
      src: "images/brand/website-mascot-combo.jpg",
      alt: "仙加味小老闆比讚介紹搭配組合",
      eyebrow: "搭配組合",
      title: "依生活節奏查看產品搭配",
      text: "先確認產品型態、使用方式與份量，再依實際需求選擇組合。",
      primary: ["看產品", "products.html"],
      secondary: ["怎麼使用", "guide.html"]
    },
    guide: {
      src: "images/brand/website-mascot-guide.jpg",
      alt: "仙加味小老闆示範倒入熱飲",
      eyebrow: "使用方式",
      title: "沖泡、即飲與燉湯方式一次整理",
      text: "依產品型態查看取用方式、使用時段、搭配方式與保存資訊。",
      primary: ["料理搭配", "recipes.html"],
      secondary: ["常見問題", "faq.html"]
    },
    recipes: {
      src: "images/brand/website-mascot-recipes.jpg",
      alt: "仙加味小老闆示範料理搭配",
      eyebrow: "料理搭配",
      title: "把產品放進熟悉的飲食節奏",
      text: "從熱飲、調飲到家常燉湯，依產品型態查看適合的料理與搭配方式。",
      primary: ["使用方式", "guide.html"],
      secondary: ["看產品", "products.html"]
    },
    faq: {
      src: "images/brand/website-mascot-faq.jpg",
      alt: "仙加味小老闆思考常見問題",
      eyebrow: "常見問題",
      title: "產品、使用與購買問題一次整理",
      text: "產品差異、使用方式、保存、付款、配送與門市資訊，都可以在這裡快速查看。",
      primary: ["看產品", "products.html"],
      secondary: ["聯絡我們", "contact.html"]
    },
    contact: {
      src: "images/brand/website-mascot-contact.jpg",
      alt: "仙加味小老闆戴耳機提供人工客服",
      eyebrow: "官方 LINE 與門市",
      title: "需要協助時，直接留下訊息",
      text: "留下想了解的產品、規格、數量、配送或取貨方式，我們會再協助確認。",
      primary: ["查看產品", "products.html"],
      secondary: ["門市資訊", "#store-info"]
    },
    brand: {
      src: "images/brand/website-mascot-brand.jpg",
      alt: "仙加味小老闆介紹品牌故事",
      eyebrow: "品牌故事",
      title: "從萬華出發，延續四代工序",
      text: "把家族多年累積的原料與龜鹿工序經驗，整理成今天容易理解的產品資訊。",
      primary: ["認識產品", "products.html"],
      secondary: ["聯絡我們", "contact.html"]
    }
  };

  function ensureSection(config) {
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
          <p>${config.text}</p>
          <div class="hero-actions">
            <a class="btn btn-outline" href="${config.primary[1]}">${config.primary[0]}</a>
            <a class="btn btn-outline" href="${config.secondary[1]}">${config.secondary[0]}</a>
          </div>
        </div>
      </article>`;
    hero.insertAdjacentElement("afterend", section);
    return section;
  }

  function applyScene() {
    const page = document.body?.dataset?.page || "home";
    const config = SCENES[page];
    if (!config) return true;

    const section = ensureSection(config);
    const media = section?.querySelector(".mascot-guide-card__media");
    if (!media) return false;

    const copy = section.querySelector(".mascot-guide-card__copy");
    if (copy) {
      const eyebrow = copy.querySelector(".eyebrow");
      const title = copy.querySelector("h2");
      const paragraph = copy.querySelector("p:not(.eyebrow)");
      if (eyebrow) eyebrow.textContent = config.eyebrow;
      if (title) title.textContent = config.title;
      if (paragraph) paragraph.textContent = config.text;
    }

    let image = media.querySelector("img");
    if (!image) {
      image = document.createElement("img");
      media.replaceChildren(image);
    }

    image.className = "mascot-guide-card__image";
    image.src = `${config.src}?v=${VERSION}`;
    image.alt = config.alt;
    image.width = 1448;
    image.height = 1086;
    image.loading = page === "home" ? "eager" : "lazy";
    image.decoding = "async";
    image.fetchPriority = page === "home" ? "high" : "auto";
    image.onerror = () => {
      if (image.dataset.fallbackApplied === "1") return;
      image.dataset.fallbackApplied = "1";
      image.src = `images/brand/website-mascot-home.jpg?v=${VERSION}`;
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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
