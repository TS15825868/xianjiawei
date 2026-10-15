"use strict";
/* 仙加味怎麼選：僅使用目前公開且有正式商品頁的資料，不固定商品總數。 */
(function () {
  const root = document.getElementById("choose-current-products");
  const filters = document.getElementById("choose-current-filters");
  const status = document.getElementById("choose-current-status");
  if (!root || !filters || !status) return;
  const lineUrl = "https://lin.ee/sHZW7NkR";
  const ownImage = {
    "guilu-gao": "images/product-main/guilu-gao.png",
    "guilu-drink-30": "images/product-main/guilu-drink-30.png",
    "guilu-drink-180": "images/product-main/guilu-drink-180.png",
    "luerong-fen": "images/product-main/luerong-fen.png"
  };
  const categories = [
    ["all", "全部"],
    ["drink", "即飲"],
    ["tea", "茶包"],
    ["paste", "膏品／膏湯塊"],
    ["powder", "粉狀"]
  ];
  function categoryFor(item) {
    const value = [item.name, item.form, item.category].filter(Boolean).join(" ");
    if (/茶包|茶飲|茶/.test(value)) return "tea";
    if (/粉/.test(value)) return "powder";
    if (/膏|塊/.test(value)) return "paste";
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
    article.className = "card choose-current-card";
    const a = document.createElement("a");
    a.href = item.page;
    a.className = "choose-current-card__link";
    const img = document.createElement("img");
    img.src = item.image;
    img.alt = item.name + "正式商品照片";
    img.loading = "lazy";
    img.decoding = "async";
    a.append(img);
    const h3 = document.createElement("h3");
    h3.textContent = item.name;
    a.append(h3);
    article.append(a);
    const detail = document.createElement("p");
    detail.textContent = [item.spec, item.form].filter(Boolean).join("｜");
    article.append(detail);
    if (item.informationOnly) {
      const note = document.createElement("p");
      note.className = "muted";
      note.textContent = "商品資訊展示，供貨與適用交易方式請洽官方 LINE 確認。";
      article.append(note);
    }
    const link = document.createElement("a");
    link.className = "btn btn-outline";
    link.href = item.page;
    link.textContent = "查看商品介紹";
    article.append(link);
    return article;
  }
  function render(items, selected) {
    root.replaceChildren();
    const visible = selected === "all" ? items : items.filter(item => categoryFor(item) === selected);
    for (const item of visible) root.append(card(item));
    status.textContent = "目前顯示 " + visible.length + " 項已公開商品；詳細規格、保存與注意事項請依各商品介紹及原廠標示確認。";
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
        const image = safeImage(ownImage[p.id]);
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
          id: p.id, name: p.name, form: p.form || p.category || "", spec: p.size || "",
          page, image, informationOnly: p.informationOnly === true || p.onlineTransactionEligible === false
        });
      }
    }
    const deduped = Array.from(new Map(items.map(item => [item.page, item])).values());
    if (!deduped.length) throw new Error("No approved products available");
    filters.replaceChildren();
    for (const [key, label] of categories) {
      if (key !== "all" && !deduped.some(item => categoryFor(item) === key)) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-outline";
      button.dataset.category = key;
      button.textContent = label;
      button.addEventListener("click", () => render(deduped, key));
      filters.append(button);
    }
    render(deduped, "all");
    const old = document.querySelector(".purpose-table-wrap");
    if (old) old.style.display = "none";
    const oldNote = document.querySelector(".choose-mobile-note");
    if (oldNote) oldNote.style.display = "none";
    const label = document.getElementById("choose-current-heading");
    if (label) label.textContent = "目前公開商品，依使用型態比較";
    if (!own || !partner) status.textContent += " 部分商品資料暫未載入，請以商品總覽為準。";
  }).catch(() => {
    status.textContent = "最新商品列表暫時無法載入，請先使用上方常見比較或前往商品總覽。";
    const link = document.createElement("a");
    link.href = "products.html";
    link.className = "btn btn-outline";
    link.textContent = "前往完整商品總覽";
    root.replaceChildren(link);
  });
})();
