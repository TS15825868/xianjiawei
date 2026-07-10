"use strict";

const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const file = path.join(root, "site.js");
let source = fs.readFileSync(file, "utf8");

function replaceRequired(search, replacement, label) {
  const next = source.replace(search, replacement);
  if (next === source) throw new Error(`找不到更新位置：${label}`);
  source = next;
}

replaceRequired(
  "if (/^(產品詳情|使用方式|選擇數量|加入購物車|搭配方案)｜/.test(text)) return text;",
  "if (/^(產品詳情|使用方式|選擇數量|加入購物車|搭配方案|搭配組數|加入組合)｜/.test(text)) return text;",
  "LINE 指令前綴"
);

replaceRequired(
  "  if (action === '搭配方案') return '搭配組合';",
  "  if (action === '搭配方案') return '搭配組合';\n  if (action === '搭配組數') return '選擇組數';\n  if (action === '加入組合') return '加入購物車';",
  "LINE 按鈕名稱"
);

replaceRequired(
  "    home: '幫我推薦',",
  "    home: '幫我推薦',\n    '404': '看產品',\n    dm: '看產品',\n    'product-detail': '看產品',",
  "特殊頁面 LINE 功能"
);

replaceRequired(
  "    video: '看產品',",
  "    video: '幫我推薦',",
  "影片頁 LINE 功能"
);

replaceRequired(
  "${lineButton('LINE 詢問搭配方式', `我想了解「${combo.name}」搭配組合的內容與購買方式。`)}",
  "${lineButton('選擇組數', `搭配組數｜${index}`)}",
  "首頁搭配組合按鈕"
);

replaceRequired(
  "${lineButton('LINE 詢問搭配方式', `我想了解「${combo.name || '套餐搭配'}」搭配組合的內容與購買方式。`)}",
  "${lineButton('選擇組數', `搭配組數｜${index}`)}",
  "套餐頁搭配組合按鈕"
);

replaceRequired(
  "    '看產品'\n  );\n}\n\nfunction renderComboPage()",
  "    sourceLineText('choose')\n  );\n}\n\nfunction renderComboPage()",
  "怎麼選頁最終按鈕"
);

replaceRequired(
  "<a class=\"btn btn-outline\" href=\"${p.detailPage || 'products.html'}\">完整介紹</a>",
  "<a class=\"btn btn-outline\" href=\"${p.page || p.detailPage || 'products.html'}\">完整介紹</a>",
  "產品完整介紹目的地"
);

fs.writeFileSync(file, source, "utf8");
console.log("Applied all website button routing fixes v300.3");
