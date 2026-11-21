"use strict";

(function () {
  const site = "https://ts15825868.github.io/xianjiawei/";
  const trialMessages = new Map([
    ["我想申請龜鹿飲30cc試喝組。", "standard"],
    ["我從仙加味官網試喝頁進來，想申請龜鹿飲30cc試喝組。", "standard"],
    ["我是經親友介紹認識仙加味，想申請龜鹿飲30cc試喝組。", "referral"],
    ["我想申請試喝，請協助我從試喝方案開始。", "standard"]
  ]);
  // Decode the actual destination rather than trusting stale data attributes.
  // Only fixed event names and variant labels are emitted, never URL queries.
  function classifyClick(url, isB2b, isGuideFilter) {
    if (url?.protocol === "https:" && !url.port) {
      if (url.href === "https://lin.ee/sHZW7NkR") return {name: isB2b ? "b2b_click" : "line_click"};
      if (url.hostname === "line.me" && /^\/R\/oaMessage\/(?:%40|@)762jybnm\/$/i.test(url.pathname)) {
        if (isB2b) return {name:"b2b_click"};
        let message = "";
        try { message = decodeURIComponent(url.search.slice(1)); } catch {}
        const variant = trialMessages.get(message);
        return variant ? {name:"trial_click",parameters:{entry_variant:variant}} : {name:"line_click"};
      }
      if (url.origin + url.pathname === site + "trial.html") return {name:"trial_page_click"};
    }
    if (isGuideFilter) return {name:"guide_filter_click"};
    return null;
  }
  function classifyCampaign(query) {
    const source = {
      facebook: "facebook",
      instagram: "instagram",
      threads: "threads",
      line: "line",
      google_business: "google_business",
      chatgpt: "chatgpt.com",
      "chatgpt.com": "chatgpt.com",
      bing: "bing"
    };
    const media = new Set(["organic_social", "messaging", "organic", "referral"]);
    const campaigns = new Set(["brand_story", "home_cooking", "trial", "b2b"]);
    const utmSource = query.get("utm_source");
    const utmMedium = query.get("utm_medium") ??
      (utmSource === "chatgpt.com" ? "referral" : null);
    const utmCampaign = query.get("utm_campaign");
    const attribution = {};
    if (Object.hasOwn(source, utmSource) && media.has(utmMedium)) {
      attribution.campaign_source = source[utmSource];
      attribution.campaign_medium = utmMedium;
      if (campaigns.has(utmCampaign)) attribution.campaign_name = utmCampaign;
      const socialSources = new Set(["facebook", "instagram", "threads"]);
      const knowledgeCampaign = /^knowledge_20\d{2}(?:0[1-9]|1[0-2])$/;
      const contentId = /^k-[a-z]+(?:-[a-z]+){0,4}-\d{2}$/;
      if (socialSources.has(utmSource) && utmMedium === "organic_social" &&
          query.getAll("utm_campaign").length === 1 && knowledgeCampaign.test(utmCampaign)) {
        attribution.campaign_name = utmCampaign;
        const content = query.get("utm_content");
        if (content && content.length <= 48 && query.getAll("utm_content").length === 1 && contentId.test(content)) {
          attribution.campaign_content = content;
        }
      }
    }
    return attribution;
  }

  if (typeof module === "object" && module.exports) {
    module.exports = {classifyClick, classifyCampaign};
    return;
  }
  if (!location.href.startsWith(site) || window.__XJW_GA4__) return;
  window.__XJW_GA4__ = true;

  const measurementId = "G-83FRWTQVKJ";
  const canonical = document.querySelector('link[rel="canonical"]');
  const page = new URL(canonical?.href || site);
  const pageLocation = page.href.startsWith(site)
    ? page.origin + page.pathname
    : site;
  const attribution = classifyCampaign(new URLSearchParams(location.search));

  const referringHosts = new Set([
    "www.google.com", "www.google.com.tw", "www.bing.com",
    "facebook.com", "www.facebook.com", "m.facebook.com", "l.facebook.com", "lm.facebook.com",
    "instagram.com", "www.instagram.com", "l.instagram.com",
    "threads.com", "www.threads.com", "threads.net", "www.threads.net",
    "line.me", "liff.line.me", "chatgpt.com", "gemini.google.com",
    "perplexity.ai", "www.perplexity.ai"
  ]);
  let referrer = "";
  if (document.referrer) {
    const url = new URL(document.referrer);
    if (url.protocol === "https:" && !url.port && referringHosts.has(url.hostname)) {
      referrer = url.origin + "/";
    }
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  gtag("js", new Date());
  gtag("config", measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: pageLocation,
    page_referrer: referrer,
    ...attribution
  });

  function track(name, parameters = {}) {
    gtag("event", name, { ...parameters, send_to: measurementId });
  }

  async function trackProducts(currentPage) {
    const readProducts = async (file) => {
      const response = await fetch(new URL(file, site), { signal: AbortSignal.timeout(5000) });
      if (!response.ok) return [];
      const { products } = await response.json();
      return Array.isArray(products) ? products : [];
    };
    const [own, partners] = await Promise.all([
      readProducts("public-product-master.json").catch(() => []),
      readProducts("partner-catalog.json").catch(() => [])
    ]);
    const catalog = [...own, ...partners.filter(product => product.public === true)];
    const byId = new Map(catalog.map(product => [product.id, product]));
    const item = (product) => ({
      item_id: product.id,
      item_name: product.displayName || product.name,
      item_category: product.category || product.form
    });
    if (currentPage === "product-detail") {
      const product = catalog.find(entry => (entry.page || entry.detailPage) && new URL(entry.page || entry.detailPage, site).href === pageLocation);
      if (product) track("view_item", { items: [item(product)] });
      return;
    }
    const cards = document.querySelectorAll(
      "#product-list [data-product-id], #product-list [data-fallback-product], " +
      "#partner-product-list [data-product-id], #partner-product-list [data-fallback-product]"
    );
    const ids = new Set(Array.from(cards)
      .filter(card => !card.closest("[hidden]"))
      .map(card => card.dataset.productId || card.dataset.fallbackProduct));
    const items = [...ids].filter(id => byId.has(id))
      .map((id, index) => ({ ...item(byId.get(id)), index }));
    if (items.length) track("view_item_list", { item_list_id: "catalog", item_list_name: "商品總覽", items });
  }

  const tag = document.createElement("script");
  tag.async = true;
  tag.referrerPolicy = "no-referrer";
  tag.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
  document.head.appendChild(tag);

  track("page_view");
  const currentPage = document.body.dataset.page;
  if (currentPage === "products" || currentPage === "product-detail") void trackProducts(currentPage);
  if (currentPage === "choose") track("guide_view");

  let lastTarget;
  let lastClick = -Infinity;
  document.addEventListener("click", (event) => {
    const target = event.target?.closest?.("a[href], button");
    if (!target) return;
    const url = target.href ? new URL(target.href) : null;
    const result = classifyClick(url, target.hasAttribute("data-b2b-inquiry"),
      currentPage === "choose" && Boolean(target.closest("#choose-current-filters")));
    const now = performance.now();
    if (!result || (target === lastTarget && now - lastClick < 600)) return;
    lastTarget = target;
    lastClick = now;
    track(result.name, result.parameters);
  }, true);
})();
