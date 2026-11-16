"use strict";

(function () {
  const site = "https://ts15825868.github.io/xianjiawei/";
  if (!location.href.startsWith(site) || window.__XJW_GA4__) return;
  window.__XJW_GA4__ = true;

  const measurementId = "G-83FRWTQVKJ";
  const canonical = document.querySelector('link[rel="canonical"]');
  const page = new URL(canonical?.href || site);
  const pageLocation = page.href.startsWith(site)
    ? page.origin + page.pathname
    : site;
  const source = {
    facebook: "facebook",
    instagram: "instagram",
    threads: "threads",
    line: "line",
    google_business: "google_business",
    chatgpt: "chatgpt",
    bing: "bing"
  };
  const media = new Set(["organic_social", "messaging", "organic", "referral"]);
  const campaigns = new Set(["brand_story", "home_cooking", "trial", "b2b"]);
  const query = new URLSearchParams(location.search);
  const utmSource = query.get("utm_source");
  const utmMedium = query.get("utm_medium");
  const utmCampaign = query.get("utm_campaign");
  const attribution = {};
  if (Object.hasOwn(source, utmSource) && media.has(utmMedium)) {
    attribution.campaign_source = source[utmSource];
    attribution.campaign_medium = utmMedium;
    if (campaigns.has(utmCampaign)) attribution.campaign_name = utmCampaign;
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  gtag("js", new Date());
  gtag("config", measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: pageLocation,
    page_referrer: "",
    ...attribution
  });

  function track(name) {
    gtag("event", name, { send_to: measurementId });
  }

  const tag = document.createElement("script");
  tag.async = true;
  tag.referrerPolicy = "no-referrer";
  tag.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
  document.head.appendChild(tag);

  track("page_view");
  const currentPage = document.body.dataset.page;
  if (currentPage === "products") track("view_item_list");
  if (currentPage === "product-detail") track("view_item");
  if (currentPage === "choose") track("guide_view");

  let lastTarget;
  let lastClick = -Infinity;
  document.addEventListener("click", (event) => {
    const target = event.target.closest?.("a[href], button");
    if (!target) return;
    const url = target.href ? new URL(target.href) : null;
    const isLine = url?.protocol === "https:" &&
      (url.href === "https://lin.ee/sHZW7NkR" ||
        (url.hostname === "line.me" && /^\/R\/oaMessage\/(?:%40|@)762jybnm\/$/i.test(url.pathname)));
    let name;
    if (isLine) {
      name = target.hasAttribute("data-b2b-inquiry") ? "b2b_click"
        : currentPage === "trial" ? "trial_click" : "line_click";
    } else if (url?.href === site + "trial.html") {
      name = "trial_page_click";
    } else if (currentPage === "choose" && target.closest("#choose-current-filters")) {
      name = "guide_filter_click";
    }

    const now = performance.now();
    if (!name || (target === lastTarget && now - lastClick < 600)) return;
    lastTarget = target;
    lastClick = now;
    track(name);
  }, true);
})();
