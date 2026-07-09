"use strict";
const assert = require("assert");
const fs = require("fs");
const source = fs.readFileSync("site.js", "utf8");
for (const token of [
  "function normalizeLineIntent",
  "home: '幫我推薦'",
  "products: '看產品'",
  "combo: '搭配組合'",
  "guide: '怎麼使用'",
  "brand: '品牌故事'",
  "contact: '人工客服'",
  "產品詳情｜",
]) assert.ok(source.includes(token), "missing: " + token);
assert.ok(!source.includes("我從官網產品頁進來，想了解產品。"));
assert.ok(!source.includes("我想依使用方式與規格比較仙加味產品。"));
console.log("PASS website LINE canonical intents v300.1");
