/* =========================
仙加味 龜鹿知識系統（完整版）
========================= */

const ARTICLES = [

/* =========================
核心文章（主SEO）
========================= */

{
title:"龜鹿是什麼",
url:"what-is-guilu.html",
category:"culture",
summary:"介紹龜板與鹿角在飲食文化中的來源與演變。",
image:"images/hero-guilu-gao.jpg",
date:"2024-01-01",
popular:true,
tags:["龜鹿","文化"]
},

{
title:"鹿茸是什麼",
url:"deer-antler-what.html",
category:"culture",
summary:"介紹鹿茸來源與鹿角差異。",
image:"images/lurong-powder-75g.jpg",
date:"2024-01-03",
popular:true,
tags:["鹿茸"]
},

{
title:"龜鹿膏怎麼吃",
url:"guilu-gao-how.html",
category:"product",
summary:"龜鹿膏日常食用方式。",
image:"images/guilu-gao-100g.jpg",
date:"2024-01-08",
popular:true,
tags:["龜鹿膏"]
},

{
title:"龜鹿雞湯",
url:"guilu-chicken-soup.html",
category:"recipe",
summary:"龜鹿湯塊搭配雞肉料理。",
image:"images/guilu-block-75g.jpg",
date:"2024-01-13",
popular:true,
tags:["龜鹿料理"]
}

];


/* =========================
🔥 自動補齊文章（重點）
========================= */

const AUTO_ARTICLES = [

"guilu-history.html",
"guilu-culture.html",
"guilu-modern.html",
"guilu-health-food.html",
"guilu-ingredient.html",
"guilu-benefits-food.html",
"guilu-daily-food.html",
"guilu-overview.html",
"guilu-vs-herbal.html",
"guilu-types.html",
"guilu-dosage.html",
"guilu-beginner-guide.html",
"guilu-gao-storage.html",
"guilu-drink-how.html",
"guilu-drink-storage.html",
"guilu-block-how.html",
"guilu-block-storage.html",
"deer-powder-how.html",
"deer-powder-storage.html",
"how-to-choose-guilu.html",
"guilu-gao-vs-drink.html",
"guilu-gao-vs-block.html",
"guilu-cooking-guide.html",
"guilu-recipes.html",
"guilu-pork-ribs.html",
"guilu-herbal-soup.html",
"guilu-food-pairing.html",
"guilu-meal-plan.html",
"guilu-winter-food.html",
"guilu-summer-food.html",
"guilu-traditional-food.html",
"deer-antler-diff.html",
"deer-antler-history.html",
"deer-antler-usage.html",
"deer-antler-food.html",
"deer-coffee.html",
"deer-milk.html",
"deer-tea.html",
"deer-recipes.html",
"guilu-seo-guide.html",
"guilu-keyword-guide.html",
"guilu-content-guide.html",
"guilu-eat-guide.html",
"guilu-full-guide.html"
];


/* =========================
自動生成文章資料
========================= */

AUTO_ARTICLES.forEach(url => {

let titleMap = {

"guilu-history.html": "龜鹿文化的歷史",
"guilu-culture.html": "龜鹿文化介紹",
"guilu-modern.html": "龜鹿文化在現代",
"guilu-health-food.html": "龜鹿與養生飲食",
"guilu-ingredient.html": "龜鹿食材介紹",
"guilu-benefits-food.html": "龜鹿飲食文化",
"guilu-daily-food.html": "龜鹿日常飲食",
"guilu-overview.html": "龜鹿介紹",
"guilu-vs-herbal.html": "龜鹿與藥膳差異",
"guilu-types.html": "龜鹿種類介紹",
"guilu-dosage.html": "龜鹿食用份量",
"guilu-beginner-guide.html": "龜鹿入門指南",

"guilu-gao-storage.html": "龜鹿膏保存方式",
"guilu-drink-how.html": "龜鹿飲怎麼喝",
"guilu-drink-storage.html": "龜鹿飲保存方式",
"guilu-block-how.html": "龜鹿湯塊怎麼用",
"guilu-block-storage.html": "龜鹿湯塊保存方式",
"deer-powder-how.html": "鹿茸粉怎麼搭配",
"deer-powder-storage.html": "鹿茸粉保存方式",
"how-to-choose-guilu.html": "龜鹿產品怎麼選",

"guilu-gao-vs-drink.html": "龜鹿膏與龜鹿飲差別",
"guilu-gao-vs-block.html": "龜鹿膏與湯塊差別",

"guilu-cooking-guide.html": "龜鹿料理指南",
"guilu-recipes.html": "龜鹿料理整理",
"guilu-pork-ribs.html": "龜鹿燉排骨",
"guilu-herbal-soup.html": "龜鹿藥膳湯",

"guilu-food-pairing.html": "龜鹿搭配食材",
"guilu-meal-plan.html": "龜鹿飲食規劃",
"guilu-winter-food.html": "冬季龜鹿飲食",
"guilu-summer-food.html": "夏季龜鹿飲食",
"guilu-traditional-food.html": "龜鹿傳統飲食",

"deer-antler-diff.html": "鹿角與鹿茸差別",
"deer-antler-history.html": "鹿茸歷史",
"deer-antler-usage.html": "鹿茸使用方式",
"deer-antler-food.html": "鹿茸飲食方式",

"deer-coffee.html": "鹿茸咖啡",
"deer-milk.html": "鹿茸牛奶",
"deer-tea.html": "鹿茸茶飲",
"deer-recipes.html": "鹿茸料理",

"guilu-seo-guide.html": "龜鹿SEO指南",
"guilu-keyword-guide.html": "龜鹿關鍵字整理",
"guilu-content-guide.html": "龜鹿內容策略",
"guilu-eat-guide.html": "龜鹿怎麼吃",
"guilu-full-guide.html": "龜鹿完整指南"

};

ARTICLES.push({
title: titleMap[url] || "龜鹿知識",
url: url,
category: url.includes("deer") ? "culture" :
url.includes("recipe") || url.includes("soup") ? "recipe" : "product",
summary:"龜鹿與鹿茸相關知識整理",
image:"images/hero-guilu-gao.jpg",
date:"2024-02-01",
tags:["龜鹿"]
});

});

/* =========================
排序
========================= */

ARTICLES.sort((a,b)=>{
return new Date(b.date) - new Date(a.date);
});
