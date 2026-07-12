"use strict";

(() => {
  const VERSION = "405.0";
  const ROOT = "images/brand/approved-v405/";

  const CORE_SCENES = {
    home: ["home-brand.webp", "仙加味小老闆首頁品牌主視覺"],
    products: ["products-all.webp", "仙加味龜鹿系列全系列比較"],
    choose: ["choose.webp", "怎麼選：依使用方式選擇產品型態"],
    combo: ["combo.webp", "仙加味套餐搭配與料理組合"],
    guide: ["guide-how-to-use.webp", "仙加味產品怎麼使用"],
    recipes: ["recipes.webp", "仙加味料理搭配"],
    brand: ["brand-story.webp", "仙加味品牌故事"],
    faq: ["faq.webp", "仙加味常見問題"],
    contact: ["contact-line.webp", "聯絡仙加味與加入官方 LINE"]
  };

  const PRODUCT_SCENES = {
    "product-guilu-gao.html": ["product-guilu-gao-100g.webp", "龜鹿膏100g小老闆產品情境"],
    "product-guilu-drink-30cc.html": ["product-guilu-drink-30cc.webp", "龜鹿飲30cc小老闆產品情境"],
    "product-guilu-drink-180cc.html": ["product-guilu-drink-180cc.webp", "龜鹿飲180cc鋁袋小老闆產品情境"],
    "product-guilu-tangkuai.html": ["product-guilu-tangkuai-75g.webp", "龜鹿湯塊75g小老闆產品情境"],
    "product-guilu-jiao.html": ["product-guilu-jiao-600g.webp", "龜鹿膠600g小老闆產品情境"],
    "product-luerong-fen.html": ["product-luerong-fen-75g.webp", "鹿茸粉75g小老闆產品情境"]
  };

  function buildScene(file, alt, extraClass = "") {
    const section = document.createElement("section");
    section.id = "approved-mascot-scene";
    section.className = `section approved-mascot-scene ${extraClass}`.trim();
    section.setAttribute("aria-label", alt);
    section.innerHTML = `
      <figure class="approved-mascot-card reveal">
        <img src="${ROOT}${file}?v=${VERSION}" alt="${alt}" width="1448" height="1086" loading="lazy" decoding="async">
      </figure>`;
    return section;
  }

  function renderApprovedMascot() {
    document.querySelectorAll("#mascot-guide, #approved-mascot-scene").forEach((node) => node.remove());

    const page = document.body?.dataset?.page || "";

    if (page === "home") {
      const [file, alt] = CORE_SCENES.home;
      const image = document.querySelector(".home-story-main .story-photo");
      if (!image) return;
      image.src = `${ROOT}${file}?v=${VERSION}`;
      image.alt = alt;
      image.width = 1448;
      image.height = 1086;
      image.classList.remove("mascot-v404-home-story");
      image.classList.add("approved-home-mascot");
      return;
    }

    if (CORE_SCENES[page]) {
      const [file, alt] = CORE_SCENES[page];
      const hero = document.querySelector("main .hero");
      if (hero) hero.insertAdjacentElement("afterend", buildScene(file, alt, `approved-mascot--${page}`));
      return;
    }

    const filename = location.pathname.split("/").pop() || "";
    if (PRODUCT_SCENES[filename]) {
      const [file, alt] = PRODUCT_SCENES[filename];
      const hero = document.querySelector(".product-detail-hero");
      if (hero) hero.insertAdjacentElement("afterend", buildScene(file, alt, "approved-mascot--product"));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderApprovedMascot, { once: true });
  } else {
    renderApprovedMascot();
  }
})();
