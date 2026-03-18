const fs = require("fs");

const topics = [
"龜鹿是什麼",
"龜鹿膏怎麼吃",
"龜鹿飲什麼時候喝",
"龜鹿湯塊怎麼用",
"鹿茸粉怎麼吃",
"龜鹿怎麼搭配",
"龜鹿飲保存方式",
"龜鹿膏保存方法",
"龜鹿料理有哪些",
"龜鹿雞湯做法",
"龜鹿排骨湯",
"鹿茸粉加咖啡",
"鹿茸粉加牛奶",
"鹿茸粉加茶",
"龜鹿補養方式",
"龜鹿日常怎麼吃",
"龜鹿早餐搭配",
"龜鹿晚上可以吃嗎",
"龜鹿怎麼選",
"龜鹿產品差別"
];

function createArticle(title){

const slug = title
.replace(/\s/g,"-")
.replace(/[^\w\u4e00-\u9fa5]/g,"")
.toLowerCase();

const html = `
<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
<meta charset="UTF-8">
<title>${title}｜仙加味</title>
<meta name="description" content="${title}完整整理，從日常飲食角度說明。">
<link rel="stylesheet" href="../site.css">
</head>

<body>

<header class="header">
<a href="../index.html" class="logo">
<span>仙加味</span>
</a>
</header>

<main class="section">

<h1>${title}</h1>

<p>
${title}是一種以日常飲食為出發點的補養方式，
可依照個人習慣進行調整。
</p>

<h2>怎麼做比較好？</h2>
<p>
建議從小量開始，觀察自己的生活節奏，
再逐步建立固定習慣。
</p>

<h2>延伸搭配</h2>
<p>
可搭配龜鹿膏、龜鹿飲或鹿茸粉，
依照不同情境選擇。
</p>

<a href="https://lin.ee/sHZW7NkR" class="btn">LINE詢問</a>

</main>

</body>
</html>
`;

fs.writeFileSync(`articles/${slug}.html`, html);

return {title, url: `${slug}.html`};
}

const articles = topics.map(createArticle);

fs.writeFileSync("articles-data.js",
`const ARTICLES = ${JSON.stringify(articles,null,2)};`
);

console.log("✅ 已生成文章");
