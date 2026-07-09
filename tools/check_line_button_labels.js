"use strict";
const assert = require("assert");
const fs = require("fs");
const source = fs.readFileSync("site.js", "utf8");
for (const token of [
  "function lineIntentButtonLabel",
  "'看產品': '看產品'",
  "'幫我推薦': '幫我推薦'",
  "'搭配組合': '搭配組合'",
  "'怎麼使用': '怎麼使用'",
  "'價格方案': '價格方案'",
  "'品牌故事': '品牌故事'",
  "'人工客服': '人工客服'",
  "el.textContent = visibleLabel",
  "link.innerHTML = `<span class=\"floating-line-cta__dot\"",
  "官方 LINE｜",
]) assert.ok(source.includes(token), "missing: " + token);
assert.ok(source.indexOf("門市|取貨|自取") < source.indexOf("品牌|四代|鹿角伯"));
console.log("PASS website LINE button labels match LINE OA commands v300.2");
