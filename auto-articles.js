const fs = require("fs");

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
"龜鹿怎麼選"
];

function createArticle(title){

const slug = title.replace(/\s/g,"").replace(/[^\w\u4e00-\u9fa5]/g,"");

const html = `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
<meta charset="UTF-8">
<title>${title}｜仙加味</title>
<meta name="description" content="${title}完整整理與日常搭配方式">
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

<h1>${title}</h1>

<p>${title}可以從日常飲食角度去調整，建立適合自己的節奏。</p>

<h2>怎麼吃比較好？</h2>
<p>建議從少量開始，依照生活習慣慢慢調整。</p>

<h2>日常搭配</h2>
<p>可搭配龜鹿膏、龜鹿飲或鹿茸粉。</p>

<div style="margin:40px 0;text-align:center;">
<h3>不確定怎麼選？</h3>
<a href="https://lin.ee/sHZW7NkR" class="btn btn-dark">LINE詢問</a>
</div>

</main>

<a class="floating-line" href="https://lin.ee/sHZW7NkR">LINE詢問</a>

<script src="../articles-data.js"></script>
<script src="../site.js"></script>

</body>
</html>`;

fs.writeFileSync(`articles/${slug}.html`, html);

return {title, url: `${slug}.html`};
}

const articles = topics.map(createArticle);

fs.writeFileSync("articles-data.js",
`const ARTICLES = ${JSON.stringify(articles,null,2)};`
);

console.log("✅ 成交版文章已生成");
