"use strict";

const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const sitePath = path.join(root, "site.js");
let source = fs.readFileSync(sitePath, "utf8");

function replaceBlock(pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`找不到更新區塊：${label}`);
  source = next;
}

const lineHelpers = `function normalizeLineIntent(message = '') {
  const text = String(message || '').trim();
  if (!text) return '看產品';
  if (/^(產品詳情|使用方式|選擇數量|加入購物車|搭配方案)｜/.test(text)) return text;
  if (/^(看產品|直接下單|幫我推薦|搭配組合|怎麼使用|價格方案|品牌故事|人工客服|料理搭配)$/.test(text)) return text;

  const product = (SITE_DATA?.products || []).find(item => {
    const names = [item.id, item.name, item.displayName, ...(item.aliases || [])].filter(Boolean);
    return names.some(name => text.includes(String(name)));
  });
  if (product) {
    if (/怎麼用|使用方式|食用方式|成分/.test(text)) return \`使用方式｜\${product.id}\`;
    return \`產品詳情｜\${product.id}\`;
  }

  if (/價格|售價|價錢|多少錢|活動|優惠/.test(text)) return '價格方案';
  if (/套餐|搭配組合|搭配方式|料理搭配|燉湯|熱飲.*調飲/.test(text)) return '搭配組合';
  if (/怎麼使用|使用方式|食用方式|怎麼用/.test(text)) return '怎麼使用';
  if (/品牌|四代|鹿角伯|萬華門市|了解仙加味/.test(text)) return '品牌故事';
  if (/FAQ|聯絡|客服|問題想詢問|配送|付款|通路合作|診所|中藥店/.test(text)) return '人工客服';
  if (/推薦|比較|差異|怎麼選|適合|產品整理|規格比較/.test(text)) return '幫我推薦';
  return '看產品';
}

function buildLineAutoLink(message = '看產品') {
  const lineId = encodeURIComponent(getLineId());
  const text = encodeURIComponent(normalizeLineIntent(message));
  return \`https://line.me/R/oaMessage/\${lineId}/?\${text}\`;
}

function lineButton(label = 'LINE 詢問產品', text = '看產品') {
  const url = buildLineAutoLink(text);
  return \`<a class="btn btn-line" href="\${url}" target="_blank" rel="noopener">\${label}</a>\`;
}

function sourceLineText(page = '') {
  const map = {
    home: '幫我推薦',
    products: '看產品',
    combo: '搭配組合',
    choose: '幫我推薦',
    guide: '怎麼使用',
    recipes: '料理搭配',
    video: '看產品',
    knowledge: '幫我推薦',
    'hanfang-baike': '看產品',
    sources: '看產品',
    brand: '品牌故事',
    faq: '人工客服',
    contact: '人工客服'
  };
  return map[page] || '看產品';
}

function pageLineButton(label = 'LINE 比較產品') {
  return lineButton(label, sourceLineText(document.body?.dataset?.page || 'home'));
}

function productFitText(product = '') {
  if (product && typeof product === 'object' && product.id) return \`產品詳情｜\${product.id}\`;
  const name = String(product || '').trim();
  const matched = (SITE_DATA?.products || []).find(item =>
    [item.name, item.displayName, ...(item.aliases || [])].filter(Boolean).some(value => name.includes(String(value)))
  );
  return matched?.id ? \`產品詳情｜\${matched.id}\` : '看產品';
}`;

replaceBlock(
  /function buildLineAutoLink\(message[\s\S]*?function productFitText\(productName = ''\) \{[\s\S]*?\n\}/,
  lineHelpers,
  "LINE 連結與意圖"
);

source = source.replace(/productFitText\(p\.displayName \|\| p\.name \|\| ''\)/g, "productFitText(p)");
source = source.replace(/'我想了解仙加味產品差異、規格與使用方式。'/g, "'看產品'");
source = source.replace(/'我想詢問仙加味產品。'/g, "'看產品'");
source = source.replace("const msg = el.dataset.lineMessage || '看產品';", "const msg = normalizeLineIntent(el.dataset.lineMessage || sourceLineText(document.body?.dataset?.page || 'home'));" );
source = source.replace("fetch('data.json?v=300.0')", "fetch('data.json?v=300.1')");

fs.writeFileSync(sitePath, source, "utf8");

const checkPath = path.join(root, "tools", "check_line_intents.js");
fs.writeFileSync(checkPath, `"use strict";\nconst assert = require("assert");\nconst fs = require("fs");\nconst source = fs.readFileSync("site.js", "utf8");\nfor (const token of [\n  "function normalizeLineIntent",\n  "home: '幫我推薦'",\n  "products: '看產品'",\n  "combo: '搭配組合'",\n  "guide: '怎麼使用'",\n  "brand: '品牌故事'",\n  "contact: '人工客服'",\n  "產品詳情｜",\n]) assert.ok(source.includes(token), "missing: " + token);\nassert.ok(!source.includes("我從官網產品頁進來，想了解產品。"));\nassert.ok(!source.includes("我想依使用方式與規格比較仙加味產品。"));\nconsole.log("PASS website LINE canonical intents v300.1");\n`, "utf8");

console.log("Applied website-to-LINE intent integration v300.1");
