const fs = require("fs");

/* =========================
文章主題（可自行增加）
========================= */

const topics = [
"龜鹿是什麼",
"龜鹿膏怎麼吃",
"龜鹿飲什麼時候喝",
"龜鹿湯塊怎麼用",
"鹿茸粉怎麼吃",
"龜鹿怎麼搭配",
"龜鹿日常怎麼吃",
"龜鹿早餐搭配",
"龜鹿晚上可以吃嗎",
"龜鹿怎麼選",
"龜鹿飲保存方式",
"龜鹿膏保存方式",
"龜鹿料理有哪些",
"龜鹿雞湯做法",
"龜鹿排骨湯怎麼煮",
"鹿茸粉加咖啡",
"鹿茸粉加牛奶",
"鹿茸粉加茶",
"龜鹿補養方式",
"龜鹿飲用方式整理",
"龜鹿產品差別",
"龜鹿膏適合誰",
"龜鹿飲適合誰",
"龜鹿湯塊怎麼煮",
"鹿茸粉怎麼搭配",
"龜鹿雞湯多久喝一次",
"龜鹿湯塊比例怎麼抓",
"龜鹿日常補養習慣",
"龜鹿料理快速上手",
"龜鹿補養入門",
"龜鹿飲什麼時間喝最好",
"龜鹿膏可以加熱嗎",
"龜鹿湯塊怎麼保存",
"鹿茸粉可以天天喝嗎",
"龜鹿適合什麼族群",
"龜鹿膏一天吃多少",
"龜鹿飲怎麼保存",
"龜鹿湯塊可以冷凍嗎",
"鹿茸粉保存方式",
"龜鹿料理推薦",
"龜鹿雞湯懶人做法",
"龜鹿排骨湯做法",
"鹿茸粉咖啡怎麼泡",
"鹿茸粉牛奶比例",
"鹿茸粉茶怎麼搭",
"龜鹿日常飲食搭配",
"龜鹿補養節奏",
"龜鹿飲與膏差別",
"龜鹿湯塊與膏差別",
"鹿茸粉與龜鹿差別"
];

/* =========================
建立文章
========================= */

function createArticle(title){

const slug = title
.replace(/\s/g,"")
.replace(/[^\w\u4e00-\u9fa5]/g,"");

const html = `<!DOCTYPE html>
<html lang="zh-Hant-TW">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">

<title>${title}｜仙加味</title>
<meta name="description" content="${title}完整整理，從日常飲食與搭配角度說明。">

<link rel="stylesheet" href="../site.css">
</head>

<body>

<header class="header">
<a href="../index.html" class="logo">
<img src="../images/logo-seal.png">
<span>仙加味</span>
</a>
<div class="menu-btn">☰</div>
</header>

<div id="menuOverlay" class="menu-overlay"></div>

<main class="section" style="max-width:800px;">

<div style="font-size:14px;margin-bottom:20px;">
<a href="../index.html">首頁</a> /
<a href="../articles.html">龜鹿知識</a>
</div>

<h1>${title}</h1>

<p>
${title}可以從日常飲食角度去調整，建立適合自己的補養節奏，
依照生活習慣搭配龜鹿膏、龜鹿飲或鹿茸粉。
</p>

<h2>怎麼做比較好？</h2>
<p>
建議從少量開始，觀察身體狀況與生活作息，
逐步建立固定使用方式。
</p>

<h2>日常搭配方式</h2>
<p>
可依需求選擇不同型態，例如日常使用龜鹿膏、
外出補充選擇龜鹿飲、料理則可搭配龜鹿湯塊。
</p>

<!-- CTA -->
<div style="margin:40px 0;text-align:center;">

<h3>不確定怎麼選？</h3>
<p>描述你的需求，我幫你搭配</p>

<a href="https://lin.ee/sHZW7NkR"
class="btn btn-dark"
target="_blank">
LINE詢問
</a>

</div>

<!-- 推薦產品 -->
<h2>推薦搭配</h2>

<div class="product-grid">

<a href="../product.html?id=guilu-gao" class="product-card">
<h3>龜鹿膏</h3>
<p>日常補養核心</p>
</a>

<a href="../product.html?id=guilu-drink" class="product-card">
<h3>龜鹿飲</h3>
<p>外出補充方便</p>
</a>

<a href="../product.html?id=guilu-block" class="product-card">
<h3>龜鹿湯塊</h3>
<p>燉湯料理使用</p>
</a>

</div>

<!-- 相關文章 -->
<div id="related-articles" style="margin-top:40px;"></div>

</main>

<a class="floating-line" href="https://lin.ee/sHZW7NkR">
LINE詢問
</a>

<script src="../articles-data.js"></script>
<script src="../site.js"></script>

</body>
</html>`;

fs.writeFileSync(`articles/${slug}.html`, html);

return {
title: title,
url: `${slug}.html`
};

}

/* =========================
執行
========================= */

const articles = topics.map(createArticle);

/* 產生 articles-data.js */

fs.writeFileSync("articles-data.js",
`const ARTICLES = ${JSON.stringify(articles,null,2)};`
);

console.log("✅ 成交版文章 + 清單 已生成");
