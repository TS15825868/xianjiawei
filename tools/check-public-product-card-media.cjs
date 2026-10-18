"use strict";
// Dynamic catalog audit: no fixed product count, no image regeneration or rewriting.
const fs = require("node:fs");
const p = require("node:path");
const root = p.resolve(__dirname, "..");
const html = fs.readFileSync(p.join(root, "products.html"), "utf8");
const vm = require("node:vm");
const browser = { window: {} };
vm.runInNewContext(fs.readFileSync(p.join(root, "site-product-media-authority.js"), "utf8"), browser, { timeout: 1000 });
const mediaAuthority = browser.window.XJW_PRODUCT_MEDIA_AUTHORITY;
if (!mediaAuthority?.products) throw new Error("正式商品圖片權威無法載入");

const cards = [...html.matchAll(/<article\s+class="product-card"\s+data-fallback-product="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)];
const errors = [];
if (!cards.length) errors.push("商品總覽沒有任何商品卡");
const ids = new Set();
for (const [, id, markup] of cards) {
  if (ids.has(id)) errors.push(`重複商品卡 ID：${id}`);
  ids.add(id);
  const images = [...markup.matchAll(/<img\s+[^>]*src="([^"]+)"[^>]*>/g)];
  if (images.length !== 1) errors.push(`${id} 主圖數量不等於 1：${images.length}`);
  for (const [, url] of images) {
    const asset = url.split("?")[0];
    if (!asset.startsWith("images/") || asset.includes("..") || !/\.(?:webp|png|jpe?g)$/i.test(asset)) {
      errors.push(`${id} 主圖不是正式圖片資產路徑：${asset}`);
      continue;
    }
    if (!fs.existsSync(p.join(root, asset))) errors.push(`${id} 主圖檔案不存在：${asset}`);
    const approved = mediaAuthority.mainImage(id);
    if (!approved) errors.push(`${id} 尚未建立正式主圖權威`);
    else if (approved.split("?")[0] !== asset) errors.push(`${id} 商品卡主圖與正式媒體權威不一致：${asset} / ${approved}`);

  }
  if (/NT\$\s*[\d,]+|售價[：:]\s*\d+/.test(markup)) errors.push(`${id} 官網卡片不得直接刊載售價`);
  if (!/data-product-intro="1"/.test(markup)) errors.push(`${id} 缺少開啟商品介紹入口`);
  const links = [...markup.matchAll(/<a\s+[^>]*data-product-intro="1"[^>]*href="([^"]+)"/g)];
  if (!links.length) errors.push(`${id} 商品卡沒有商品詳細頁連結`);
  const uniqueDetailPages = new Set(links.map((x) => x[1].split("?")[0].split("#")[0]));
  if (uniqueDetailPages.size > 1) errors.push(`${id} 商品卡主圖及介紹按鈕連向不同頁面`);
  for (const detail of uniqueDetailPages) {
    if (!/^product-[a-z0-9-]+\.html$/.test(detail)) {
      errors.push(`${id} 商品詳細頁路徑異常：${detail}`);
      continue;
    }
    const detailPath = p.join(root, detail);
    if (!fs.existsSync(detailPath)) {
      errors.push(`${id} 商品詳細頁不存在：${detail}`);
      continue;
    }
    const detailHtml = fs.readFileSync(detailPath, "utf8");
    if (!/name="viewport"/.test(detailHtml)) errors.push(`${id} 詳細頁缺少行動版 viewport`);
    if (!/<img\b/i.test(detailHtml)) errors.push(`${id} 詳細頁沒有產品圖片`);
    if (!/仙加味/.test(detailHtml)) errors.push(`${id} 詳細頁缺少正式品牌名稱`);
  }

}
for (const [a,b] of [["uboss-sizhenbao","royalherb-erzhenbao-64"],["guilu-drink-30","guilu-drink-180"]]) {
  const first = cards.find(x => x[1] === a)?.[2] || "";
  const second = cards.find(x => x[1] === b)?.[2] || "";
  const img = value => value.match(/<img\s+[^>]*src="([^"]+)"/)?.[1]?.split("?")[0];
  if (first && second && img(first) === img(second)) errors.push(`${a} 與 ${b} 不可共用主圖`);
}
if (errors.length) {
  console.error("商品卡實物圖檢查未通過：\n" + errors.map(x=>"- "+x).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`PASS：${cards.length} 張商品卡，正式圖片路徑、完整入口與不同品項主圖已通過檢查。`);
}
