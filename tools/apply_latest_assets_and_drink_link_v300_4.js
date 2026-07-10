"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const VERSION = "300.4";
const UPDATED_DATE = "2026-07-10";

const productAssets = {
  "guilu-gao": {
    image: `images/products-v3/guilu-gao.jpg?v=${VERSION}`,
    dmImage: `images/dm-final/01_guilu-gao-100g-dm.jpg?v=${VERSION}`,
  },
  "guilu-drink-30": {
    image: `images/products-v3/guilu-drink-30.jpg?v=${VERSION}`,
    dmImage: `images/dm-final/02_guilu-drink-30cc-dm.jpg?v=${VERSION}`,
  },
  "guilu-drink-180": {
    image: `images/products-v3/guilu-drink-180.jpg?v=${VERSION}`,
    dmImage: `images/dm-final/03_guilu-drink-180cc-dm.jpg?v=${VERSION}`,
  },
  "guilu-tangkuai": {
    image: `images/products-v3/guilu-tangkuai.jpg?v=${VERSION}`,
    dmImage: `images/dm-final/05_guilu-tangkuai-75g-dm.jpg?v=${VERSION}`,
  },
  "guilu-jiao": {
    image: `images/products-v3/guilu-jiao.jpg?v=${VERSION}`,
    dmImage: `images/dm-final/06_guilu-jiao-600g-dm.jpg?v=${VERSION}`,
  },
  "luerong-fen": {
    image: `images/products-v3/luerong-fen.jpg?v=${VERSION}`,
    dmImage: `images/dm-final/04_luerong-fen-75g-dm.jpg?v=${VERSION}`,
  },
};

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function write(file, content) {
  fs.writeFileSync(path.join(root, file), content, "utf8");
}

function localAsset(value) {
  return String(value || "").split("?", 1)[0];
}

const data = JSON.parse(read("data.json"));
for (const product of data.products || []) {
  const assets = productAssets[product.id];
  if (!assets) throw new Error(`缺少產品圖片設定：${product.id}`);
  product.image = assets.image;
  product.dmImage = assets.dmImage;
  product.detailImages = [assets.dmImage];
  product.gallery = [];
}
data.version = VERSION;
data.catalogVersion = VERSION;
write("data.json", JSON.stringify(data, null, 2) + "\n");

let maintenance = read("tools/site_maintenance.py");
maintenance = maintenance.replace(/VERSION = "[^"]+"/, `VERSION = "${VERSION}"`);
maintenance = maintenance.replace(/UPDATED_DATE = "[^"]+"/, `UPDATED_DATE = "${UPDATED_DATE}"`);
write("tools/site_maintenance.py", maintenance);

let site = read("site.js");
site = site.replace(
  '<article class="product-card reveal" data-product-id="${p.id || \'\'}" tabindex="0" role="button" aria-label="查看 ${p.displayName || p.name || \'產品\'} 詳細介紹">',
  '<article id="${p.id === \'guilu-drink-30\' ? \'guilu-drink\' : (p.id || \'\')}" class="product-card reveal" data-product-id="${p.id || \'\'}" tabindex="0" role="button" aria-label="查看 ${p.displayName || p.name || \'產品\'} 詳細介紹">'
);
if (!site.includes("p.id === 'guilu-drink-30' ? 'guilu-drink'")) {
  throw new Error("未能加入龜鹿飲頁面定位點");
}
site = site.replace(/fetch\('data\.json\?v=[^']+'\)/, `fetch('data.json?v=${VERSION}')`);
write("site.js", site);

for (const product of data.products || []) {
  const pagePath = product.page || product.detailPage;
  if (!pagePath) throw new Error(`產品缺少頁面：${product.id}`);
  let html = read(pagePath);
  const productImage = product.image;
  const dmImage = product.dmImage;
  const absoluteProduct = `https://ts15825868.github.io/xianjiawei/${productImage}`;
  const dmLocal = localAsset(dmImage) + `?v=${VERSION}`;

  html = html.replace(
    /https:\/\/ts15825868\.github\.io\/xianjiawei\/images\/(?:dm-v3|dm-final|products-v3)\/[^"'\\]+/g,
    absoluteProduct
  );
  html = html.replace(
    /(<div class="product-detail-hero__media"><img[^>]*?src=")[^"]+("[^>]*><\/div>)/,
    `$1${productImage}$2`
  );
  html = html.replace(/<a class="btn btn-outline dm-lightbox-link"[^>]*>查看產品DM<\/a>/g, "");
  html = html.replace(
    /(<div class="hero-actions">[\s\S]*?<a class="btn btn-line"[\s\S]*?<\/a>)/,
    `$1<a class="btn btn-outline dm-lightbox-link" href="${dmLocal}" data-dm-src="${dmLocal}">查看產品DM</a>`
  );
  if (!html.includes(`src="${productImage}"`)) throw new Error(`${pagePath} 未使用最新產品圖`);
  if (!html.includes(`href="${dmLocal}"`)) throw new Error(`${pagePath} 未加入最新DM`);
  write(pagePath, html);
}

let dmPage = read("dm.html");
dmPage = dmPage.replace(
  /images\/dm-final\/([A-Za-z0-9_\-.]+\.jpg)(?:\?v=[^"']+)?/g,
  `images/dm-final/$1?v=${VERSION}`
);
write("dm.html", dmPage);

let index = read("index.html");
index = index.replace(/href="products\.html#guilu-drink"/g, 'href="products.html#guilu-drink"');
write("index.html", index);

const checks = [];
for (const [id, assets] of Object.entries(productAssets)) {
  for (const field of ["image", "dmImage"]) {
    const asset = localAsset(assets[field]);
    if (!fs.existsSync(path.join(root, asset))) throw new Error(`${id} ${field} 檔案不存在：${asset}`);
    const size = fs.statSync(path.join(root, asset)).size;
    if (size < 1024) throw new Error(`${id} ${field} 檔案過小：${asset}`);
    checks.push(`${id}:${field}:${asset}:${size}`);
  }
}
write("LATEST_ASSET_REPORT.txt", checks.join("\n") + "\n");

console.log("Applied latest product images, final DMs and 龜鹿飲 anchor v300.4");
