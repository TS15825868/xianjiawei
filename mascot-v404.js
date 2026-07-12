"use strict";

(() => {
  const VERSION = "404.1";
  const PAGES = {
    home: {
      image: "images/brand/mascot-v404/home.jpg",
      position: "left-top",
      eyebrow: "歡迎認識仙加味",
      title: "從日常使用方式開始認識龜鹿系列",
      text: "小老闆負責品牌導覽；產品外觀、包裝與規格一律以下方真實產品原圖為準。",
      primary: ["認識產品", "products.html"],
      secondary: ["怎麼選", "choose.html"]
    },
    products: {
      image: "images/brand/mascot-v404/products.jpg",
      position: "right-top",
      eyebrow: "產品總覽",
      title: "小老闆負責導覽，產品以真實原圖呈現",
      text: "龜鹿膏、龜鹿飲30cc、龜鹿飲180cc鋁袋、龜鹿湯塊、龜鹿膠與鹿茸粉，請直接查看下方產品卡。",
      primary: ["怎麼選", "choose.html"],
      secondary: ["使用方式", "guide.html"]
    },
    choose: {
      image: "images/brand/mascot-v404/choose.jpg",
      position: "center-top",
      eyebrow: "怎麼選",
      title: "先看使用方式，再選產品型態",
      text: "固定取用、方便即飲、沖泡燉湯、家庭規格或自行調飲，可依自己的生活習慣比較。",
      primary: ["看全部產品", "products.html"],
      secondary: ["搭配組合", "combo.html"]
    },
    combo: {
      image: "images/brand/mascot-v404/combo.jpg",
      position: "left-top",
      eyebrow: "搭配組合",
      title: "依生活節奏整理搭配方向",
      text: "小老闆圖只呈現情境；組合內每項產品均以正式產品卡及真實產品原圖為準。",
      primary: ["看產品", "products.html"],
      secondary: ["怎麼使用", "guide.html"]
    },
    guide: {
      image: "images/brand/mascot-v404/guide.jpg",
      position: "center-top",
      eyebrow: "使用方式",
      title: "沖泡、即飲與燉湯方式一次整理",
      text: "小老闆呈現使用情境，不代替產品原圖；實際瓶型、盒型、袋型與規格以產品頁為準。",
      primary: ["料理搭配", "recipes.html"],
      secondary: ["常見問題", "faq.html"]
    },
    recipes: {
      image: "images/brand/mascot-v404/recipes.jpg",
      position: "left-top",
      eyebrow: "料理搭配",
      title: "把龜鹿產品放回熟悉的餐桌情境",
      text: "料理圖負責呈現燉湯、沖泡與熱飲方向；產品包裝仍以正式產品原圖為準。",
      primary: ["使用方式", "guide.html"],
      secondary: ["看產品", "products.html"]
    },
    brand: {
      image: "images/brand/mascot-v404/brand.jpg",
      position: "right-top",
      eyebrow: "品牌故事",
      title: "從萬華出發，延續四代工序與信用",
      text: "品牌頁專注仙加味的來處、工序與日常定位，不重複產品展示。",
      primary: ["認識產品", "products.html"],
      secondary: ["聯絡我們", "contact.html"]
    },
    faq: {
      image: "images/brand/mascot-v404/faq.jpg",
      position: "center-top",
      eyebrow: "常見問題",
      title: "產品、使用、購買與配送問題一次整理",
      text: "FAQ專注回答問題，不重複產品主視覺。",
      primary: ["看產品", "products.html"],
      secondary: ["聯絡我們", "contact.html"]
    },
    contact: {
      image: "images/brand/mascot-v404/contact.jpg",
      position: "right-top",
      eyebrow: "官方 LINE 與門市",
      title: "需要協助時，直接留下訊息",
      text: "聯絡頁專注LINE、門市、配送與取貨；不使用錯誤產品示意圖。",
      primary: ["查看產品", "products.html"],
      secondary: ["門市資訊", "#store-info"]
    }
  };

  function render() {
    const page = document.body?.dataset?.page || "home";
    const config = PAGES[page];

    document.querySelectorAll("#mascot-guide").forEach((node) => node.remove());
    if (!config) return;

    const hero = document.querySelector("main .hero");
    if (!hero) return;

    const section = document.createElement("section");
    section.id = "mascot-guide";
    section.className = "section mascot-guide-section mascot-guide-v404";
    section.innerHTML = `
      <article class="mascot-guide-card mascot-guide-card--${page} reveal">
        <div class="mascot-guide-card__media mascot-v404-crop mascot-v404-crop--${config.position}">
          <img class="mascot-guide-card__image" src="${config.image}?v=${VERSION}" alt="仙加味小老闆${config.eyebrow}情境" width="1448" height="1086" loading="${page === "home" ? "eager" : "lazy"}" decoding="async">
        </div>
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render, { once: true });
  } else {
    render();
  }
})();
