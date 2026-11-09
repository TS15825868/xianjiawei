"use strict";
/* 仙加味怎麼選：僅使用目前公開且有正式商品頁的資料，不固定商品總數。 */
(function () {
  const root = document.getElementById("choose-current-products");
  const filters = document.getElementById("choose-current-filters");
  const status = document.getElementById("choose-current-status");
  if (!root || !filters || !status) return;
  const lineUrl = "https://lin.ee/sHZW7NkR";
  const ownImage = {
    "guilu-gao": "images/catalog-owner-final-v20261017/guilu-gao-main.webp",
    "guilu-drink-30": "images/catalog-owner-final-v20261017/guilu-drink-30-main.webp",
    "guilu-drink-180": "images/catalog-owner-final-v20261017/guilu-drink-180-main.webp",
    "luerong-fen": "images/catalog-owner-final-v20261017/luerong-fen-main.webp"
  };
  // 分類從已審核公開商品即時建立；未來不鎖膠囊、零食、禮盒等新商品型態。
  const categoryNames = Object.freeze({
    drink:"即飲商品",warm:"溫熱調飲",tea:"茶飲",paste:"膏品",powder:"粉狀",capsule:"膠囊／錠狀",gift:"禮盒／組合",other:"其他商品"
  });
  function categoryFor(item) {
    const value = [item.name, item.form, item.category].filter(Boolean).join(" ");
    if (/茶包|茶飲|茶/.test(value)) return "tea";
    if (/粉/.test(value)) return "powder";
    if (/膏|塊/.test(value)) return "paste";
    if (/膠囊|錠狀|錠劑/.test(value)) return "capsule";
    if (/禮盒|組合|套組/.test(value)) return "gift";
    if (/飲|液態/.test(value)) return "drink";
    return "other";
  }
  function safePage(value) {
    return typeof value === "string" && /^product-[a-z0-9-]+\.html$/.test(value) ? value : "";
  }
  function safeImage(value) {
    return typeof value === "string" && /^images\/[a-z0-9/_-]+\.(?:jpg|jpeg|png|webp|avif)$/.test(value) ? value : "";
  }
  function card(item) {
    const article = document.createElement("article");
    article.className = "choose-current-card";
    const link = document.createElement("a");
    link.href = item.page;
    link.className = "choose-current-card__link";
    link.dataset.productIntro = "1";
    link.setAttribute("aria-haspopup", "dialog");
    link.setAttribute("aria-label", "查看" + item.name + "商品介紹");
    const media = document.createElement("span");
    media.className = "choose-current-card__media";
    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.name + "正式商品照片";
    img.loading = "lazy";
    img.decoding = "async";
    media.append(img);
    const body = document.createElement("span");
    body.className = "choose-current-card__body";
    const type = document.createElement("span");
    type.className = "choose-current-card__kind";
    type.textContent = categoryNames[categoryFor(item)] || "商品資訊";
    const title = document.createElement("h3");
    title.textContent = item.name;
    const spec = document.createElement("span");
    spec.className = "choose-current-card__spec";
    spec.textContent = [item.spec, item.form].filter(Boolean).join("｜") || "點選查看包裝及商品介紹";
    body.append(type, title, spec);
    if (item.informationOnly) {
      const note = document.createElement("span");
      note.className = "choose-current-card__note";
      note.textContent = "供貨與交易方式請洽官方 LINE 確認";
      body.append(note);
    }
    const action = document.createElement("span");
    action.className = "choose-current-card__action";
    action.textContent = "查看商品介紹 →";
    body.append(action);
    link.append(media, body);
    article.append(link);
    return article;
  }
  function render(items, selected) {
    root.replaceChildren();
    const visible = selected === "all" ? items : items.filter(item => selected === "warm" ? ["paste","tea","powder"].includes(categoryFor(item)) : categoryFor(item) === selected);
    for (const item of visible) root.append(card(item));
    status.textContent = "目前顯示 " + visible.length + " 項／共 " + items.length + " 項正式公開商品。";
    for (const button of filters.querySelectorAll("button")) {
      const active = button.dataset.category === selected;
      button.setAttribute("aria-pressed", String(active));
      button.classList.toggle("btn-primary", active);
      button.classList.toggle("btn-outline", !active);
    }
  }
  async function loadJson(url) {
    const response = await fetch(url, {cache: "no-store"});
    if (!response.ok) throw new Error("HTTP " + response.status + " " + url);
    return response.json();
  }
  Promise.allSettled([
    loadJson("public-product-master.json"),
    loadJson("partner-catalog.json")
  ]).then(results => {
    const [own, partner] = results.map(result => result.status === "fulfilled" ? result.value : null);
    const items = [];
    if (Array.isArray(own?.products)) {
      for (const p of own.products) {
        const page = safePage(new URL(p.page || "", location.href).pathname.split("/").pop());
        const latestMedia = window.XJW_PRODUCT_MEDIA_AUTHORITY?.mainImage?.(p.id) || p.mainImage || p.image || p.imageUrl || ownImage[p.id];
        const image = safeImage(String(latestMedia || "").split("?")[0]);
        if (page && image && p.name) items.push({
          id: p.id, name: p.name, form: p.form || "", spec: p.specification || "",
          page, image, informationOnly: false
        });
      }
    }
    if (Array.isArray(partner?.products)) {
      for (const p of partner.products) {
        const page = safePage(p.page), image = safeImage(p.image);
        if (p.public === true && page && image && p.name) items.push({
          id: p.id, name: p.displayName || p.name, form: p.form || p.category || "", spec: p.size || "",
          page, image, informationOnly: p.informationOnly === true || p.onlineTransactionEligible === false
        });
      }
    }
    // 商品ID是唯一身份；不同正式SKU可共用同一系列頁面，不得因此被誤刪。
    const deduped = Array.from(new Map(items.map(item => [item.id, item])).values());
    if (!deduped.length) throw new Error("No approved products available");
    filters.replaceChildren();
    const categoryOrder = ["drink","warm","tea","paste","powder","capsule","gift","other"];
    const categories = [["all","全部商品"], ...categoryOrder.filter(key => deduped.some(item => key === "warm" ? ["paste","tea","powder"].includes(categoryFor(item)) : categoryFor(item) === key)).map(key => [key,categoryNames[key]])];
    for (const [key, label] of categories) {
      if (key !== "all" && !deduped.some(item => key === "warm" ? ["paste","tea","powder"].includes(categoryFor(item)) : categoryFor(item) === key)) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-outline";
      button.dataset.category = key;
      button.textContent = label;
      button.addEventListener("click", () => render(deduped, key));
      filters.append(button);
    }
    render(deduped, "all");
    document.querySelectorAll("[data-choose-category]").forEach(link => {
      link.addEventListener("click", () => {
        const key = String(link.dataset.chooseCategory || "all");
        if (categories.some(option => option[0] === key)) render(deduped, key);
      });
    });
    const old = document.querySelector(".purpose-table-wrap");
    if (old) old.style.display = "none";
    const oldNote = document.querySelector(".choose-mobile-note");
    if (oldNote) oldNote.style.display = "none";

    if (!own || !partner) status.textContent += " 部分商品資料暫未載入，請以商品總覽為準。";
  }).catch(() => {
    status.textContent = "最新商品列表暫時無法載入，請先使用上方常見比較或前往商品總覽。";
    const link = document.createElement("a");
    link.href = "products.html";
    link.className = "btn btn-outline";
    link.textContent = "前往完整商品總覽 →";
    root.replaceChildren(link);
  });
})();
