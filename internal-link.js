document.addEventListener("DOMContentLoaded", () => {

/* =========================
內鏈關鍵字設定（可自行加）
========================= */

const KEYWORDS = [

{
keyword: "龜鹿",
url: "../articles/what-is-guilu.html"
},

{
keyword: "鹿茸",
url: "../articles/deer-antler-what.html"
},

{
keyword: "龜鹿膏",
url: "../product.html?id=guilu-gao"
},

{
keyword: "龜鹿飲",
url: "../product.html?id=guilu-drink"
},

{
keyword: "龜鹿湯塊",
url: "../product.html?id=guilu-block"
},

{
keyword: "鹿茸粉",
url: "../product.html?id=lurong-powder"
}

];


/* =========================
內鏈核心
========================= */

function autoLink(container){

if(!container) return;

let html = container.innerHTML;

KEYWORDS.forEach(item => {

const regex = new RegExp(`(${item.keyword})`, "g");

html = html.replace(regex, `<a href="${item.url}" class="seo-link">$1</a>`);

});

container.innerHTML = html;

}


/* =========================
套用範圍（文章內容）
========================= */

const article = document.querySelector("article");

if(article){
autoLink(article);
}


/* =========================
樣式（自動加）
========================= */

const style = document.createElement("style");

style.innerHTML = `
.seo-link{
color:#8A1F1F;
text-decoration:underline;
font-weight:500;
}
`;

document.head.appendChild(style);

});
