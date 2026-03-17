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

ARTICLES.push({
title: url.replace(".html","").replace(/-/g," "),
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
