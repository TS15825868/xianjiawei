document.addEventListener("DOMContentLoaded", () => {

/* =========================
MENU
========================= */

const menu = document.getElementById("menuOverlay");
const btn = document.querySelector(".menu-btn");

if (menu) {

const isArticle = location.pathname.includes("/articles/");
const base = isArticle ? "../" : "";

menu.innerHTML = `

<a href="${base}index.html">首頁</a>
<a href="${base}guilu-series.html">龜鹿系列</a>
<a href="${base}recipes.html">料理搭配</a>
<a href="${base}choose.html">怎麼選龜鹿</a>
<a href="${base}articles.html">龜鹿知識</a>
<a href="${base}brand.html">品牌故事</a>
<a href="${base}faq.html">FAQ</a>

<a href="https://lin.ee/sHZW7NkR"
class="line-btn"
target="_blank"
rel="noopener noreferrer">
LINE詢問
</a>
`;
}


/* =========================
MENU TOGGLE
========================= */

if (btn && menu) {

btn.addEventListener("click", () => {
menu.classList.toggle("active");
});

menu.querySelectorAll("a").forEach(link => {
link.addEventListener("click", () => {
menu.classList.remove("active");
});
});

}


/* =========================
SCROLL REVEAL
========================= */

const reveals = document.querySelectorAll(".reveal");

if (reveals.length && "IntersectionObserver" in window) {

const observer = new IntersectionObserver(entries => {

entries.forEach(entry => {
if (entry.isIntersecting) {
entry.target.classList.add("show");
observer.unobserve(entry.target);
}
});

}, { threshold: 0.15 });

reveals.forEach(el => observer.observe(el));

}


/* =========================
ARTICLES GRID
========================= */

const cultureGrid = document.getElementById("culture-grid");
const productGrid = document.getElementById("product-grid");
const recipeGrid = document.getElementById("recipe-grid");

if (typeof ARTICLES !== "undefined") {

const isArticle = location.pathname.includes("/articles/");
const base = isArticle ? "../" : "";

function render(grid, category) {

if (!grid) return;

let html = "";

ARTICLES
.filter(a => a.category === category)
.forEach(a => {

const image = a.image || "images/logo-seal.png";

html += `
<a href="${base}articles/${a.url}" class="product-card">
<img src="${base}${image}" loading="lazy"
onerror="this.src='${base}images/logo-seal.png'">
<h3>${a.title}</h3>
<p>${a.summary || "龜鹿知識"}</p>
</a>
`;

});

grid.innerHTML = html;

}

render(cultureGrid, "culture");
render(productGrid, "product");
render(recipeGrid, "recipe");

}


/* =========================
ARTICLE TAG（SEO）
========================= */

const tagBox = document.getElementById("article-tags");

if(tagBox && typeof ARTICLES !== "undefined"){

const current = location.pathname.split("/").pop();
const article = ARTICLES.find(a => a.url === current);

if(article && article.tags){

tagBox.innerHTML = article.tags
.map(t => `<span><a href="../tag/?tag=${t}">${t}</a></span>`)
.join("");

}

}


/* =========================
RELATED ARTICLES（升級版）
========================= */

const related = document.getElementById("related-articles");

if (related && typeof ARTICLES !== "undefined") {

const current = location.pathname.split("/").pop();

const article = ARTICLES.find(a => a.url === current);

let list = ARTICLES.filter(a => a.url !== current);

/* 同分類優先 */

if(article){
list.sort((a,b)=>{
return (b.category === article.category) - (a.category === article.category);
});
}

list = list.slice(0,3);

let html = "";

list.forEach(a => {

html += `
<a href="../articles/${a.url}" class="product-card">
<h3>${a.title}</h3>
<p>${a.summary || "龜鹿知識"}</p>
</a>
`;

});

related.innerHTML = html;

}


/* =========================
ARTICLE PAGE
========================= */

if (location.pathname.includes("/articles/") && typeof ARTICLES !== "undefined") {

const current = location.pathname.split("/").pop();
const index = ARTICLES.findIndex(a => a.url === current);
const article = ARTICLES[index];
const container = document.querySelector("article");

if (article && container) {

/* breadcrumb */

if (!document.querySelector(".breadcrumb")) {

const breadcrumb = `
<div class="breadcrumb">
<a href="../index.html">首頁</a>
<span>/</span>
<a href="../articles.html">龜鹿知識</a>
<span>/</span>
${article.title}
</div>
`;

container.insertAdjacentHTML("afterbegin", breadcrumb);

}


/* prev next */

let navHTML = "";

if (index > 0 || index < ARTICLES.length - 1) {

navHTML = `<div class="article-nav">`;

if (index > 0) {
navHTML += `
<a href="../articles/${ARTICLES[index - 1].url}">
上一篇<br><strong>${ARTICLES[index - 1].title}</strong>
</a>
`;
}

if (index < ARTICLES.length - 1) {
navHTML += `
<a href="../articles/${ARTICLES[index + 1].url}">
下一篇<br><strong>${ARTICLES[index + 1].title}</strong>
</a>
`;
}

navHTML += `</div>`;
container.insertAdjacentHTML("beforeend", navHTML);

}

}

}

});
