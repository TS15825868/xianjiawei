"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sitePath = path.join(root, "site.js");
let source = fs.readFileSync(sitePath, "utf8");

function replaceRequired(pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) throw new Error(`找不到更新區塊：${label}`);
  source = next;
}

source = source.replace(
  "  if (/品牌|四代|鹿角伯|萬華門市|了解仙加味/.test(text)) return '品牌故事';\n  if (/FAQ|聯絡|客服|問題想詢問|配送|付款|通路合作|診所|中藥店/.test(text)) return '人工客服';",
  "  if (/FAQ|聯絡|客服|問題想詢問|配送|付款|通路合作|診所|中藥店|門市|取貨|自取/.test(text)) return '人工客服';\n  if (/品牌|四代|鹿角伯|了解仙加味/.test(text)) return '品牌故事';"
);

if (!source.includes("function lineIntentButtonLabel")) {
  const helper = [
    "function lineIntentButtonLabel(message = '', fallbackLabel = '看產品') {",
    "  const intent = normalizeLineIntent(message);",
    "  const labels = {",
    "    '看產品': '看產品',",
    "    '直接下單': '直接下單',",
    "    '幫我推薦': '幫我推薦',",
    "    '搭配組合': '搭配組合',",
    "    '怎麼使用': '怎麼使用',",
    "    '價格方案': '價格方案',",
    "    '品牌故事': '品牌故事',",
    "    '人工客服': '人工客服',",
    "    '料理搭配': '搭配組合'",
    "  };",
    "",
    "  if (labels[intent]) return labels[intent];",
    "",
    "  const parts = intent.split('｜');",
    "  const action = parts[0] || '';",
    "  const productId = parts[1] || '';",
    "  const product = (SITE_DATA?.products || []).find(item => item.id === productId);",
    "  const productName = product?.displayName || product?.name || '產品';",
    "",
    "  if (action === '產品詳情') return `看${productName}`;",
    "  if (action === '使用方式') return `${productName}使用方式`;",
    "  if (action === '選擇數量') return '選擇數量';",
    "  if (action === '加入購物車') return '加入購物車';",
    "  if (action === '搭配方案') return '搭配組合';",
    "",
    "  const cleaned = String(fallbackLabel || '').replace(/^LINE\\s*/i, '').trim();",
    "  return cleaned || '看產品';",
    "}",
    "",
    "function buildLineAutoLink(message = '看產品') {"
  ].join("\n");

  source = source.replace("function buildLineAutoLink(message = '看產品') {", helper);
}

const lineButtonReplacement = [
  "function lineButton(label = '看產品', text = '看產品') {",
  "  const intent = normalizeLineIntent(text);",
  "  const url = buildLineAutoLink(intent);",
  "  const visibleLabel = lineIntentButtonLabel(intent, label);",
  "  return `<a class=\"btn btn-line\" href=\"${url}\" target=\"_blank\" rel=\"noopener\" aria-label=\"官方 LINE｜${visibleLabel}\">${visibleLabel}</a>`;",
  "}"
].join("\n");

replaceRequired(
  /function lineButton\(label = 'LINE 詢問產品', text = '看產品'\) \{[\s\S]*?\n\}/,
  lineButtonReplacement,
  "lineButton"
);

const floatingReplacement = [
  "function renderFloatingLineCta() {",
  "  if (document.getElementById('floating-line-cta')) return;",
  "  const intent = sourceLineText(document.body?.dataset?.page || 'home');",
  "  const visibleLabel = lineIntentButtonLabel(intent, '看產品');",
  "  const link = document.createElement('a');",
  "  link.id = 'floating-line-cta';",
  "  link.className = 'floating-line-cta';",
  "  link.href = buildLineAutoLink(intent);",
  "  link.target = '_blank';",
  "  link.rel = 'noopener';",
  "  link.setAttribute('aria-label', `官方 LINE｜${visibleLabel}`);",
  "  link.innerHTML = `<span class=\"floating-line-cta__dot\" aria-hidden=\"true\">LINE</span><span>${visibleLabel}</span>`;",
  "  document.body.appendChild(link);",
  "}"
].join("\n");

replaceRequired(
  /function renderFloatingLineCta\(\) \{[\s\S]*?\n\}/,
  floatingReplacement,
  "renderFloatingLineCta"
);

const hydrateReplacement = [
  "document.querySelectorAll('[data-line-url]').forEach(el => {",
  "    const msg = normalizeLineIntent(el.dataset.lineMessage || sourceLineText(document.body?.dataset?.page || 'home'));",
  "    const visibleLabel = lineIntentButtonLabel(msg, el.textContent || '看產品');",
  "    el.setAttribute('href', buildLineAutoLink(msg));",
  "    el.textContent = visibleLabel;",
  "    el.setAttribute('aria-label', `官方 LINE｜${visibleLabel}`);",
  "  });"
].join("\n");

replaceRequired(
  /document\.querySelectorAll\('\[data-line-url\]'\)\.forEach\(el => \{[\s\S]*?\n  \}\);/,
  hydrateReplacement,
  "data-line-url hydrate"
);

fs.writeFileSync(sitePath, source, "utf8");

const checkPath = path.join(root, "tools", "check_line_button_labels.js");
fs.writeFileSync(checkPath, `"use strict";\nconst assert = require("assert");\nconst fs = require("fs");\nconst source = fs.readFileSync("site.js", "utf8");\nfor (const token of [\n  "function lineIntentButtonLabel",\n  "'看產品': '看產品'",\n  "'幫我推薦': '幫我推薦'",\n  "'搭配組合': '搭配組合'",\n  "'怎麼使用': '怎麼使用'",\n  "'價格方案': '價格方案'",\n  "'品牌故事': '品牌故事'",\n  "'人工客服': '人工客服'",\n  "el.textContent = visibleLabel",\n  "官方 LINE｜",\n]) assert.ok(source.includes(token), "missing: " + token);\nassert.ok(source.indexOf("門市|取貨|自取") < source.indexOf("品牌|四代|鹿角伯"));\nconsole.log("PASS website LINE button labels match LINE OA commands v300.2");\n`, "utf8");

console.log("Applied website LINE button label matching v300.2");
