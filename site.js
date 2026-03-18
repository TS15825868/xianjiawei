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
target="_blank">
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
首頁文章（🔥重點修正）
========================= */

const homeGrid = document.getElementById("article-grid");

if (homeGrid && typeof ARTICLES !== "undefined") {

let html = "";

ARTICLES.slice(0,6).forEach(a => {

html += `
<a href="articles/${a.url}" class="product-card">
<h3>${a.title}</h3>
<p>${a.summary || ""}</p>
</a>
`;

});

homeGrid.innerHTML = html;

}

/* =========================
文章頁（breadcrumb + 上下篇）
========================= */

if (location.pathname.includes("/articles/") && typeof ARTICLES !== "undefined") {

const current = location.pathname.split("/").pop();
const index = ARTICLES.findIndex(a => a.url === current);
const article = ARTICLES[index];

const container = document.querySelector("article");

if (article && container) {

/* breadcrumb */

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

/* 上下篇 */

let navHTML = `<div class="article-nav">`;

if (index > 0) {
navHTML += `
<a href="../articles/${ARTICLES[index - 1].url}">
上一篇<br>${ARTICLES[index - 1].title}
</a>
`;
}

if (index < ARTICLES.length - 1) {
navHTML += `
<a href="../articles/${ARTICLES[index + 1].url}">
下一篇<br>${ARTICLES[index + 1].title}
</a>
`;
}

navHTML += `</div>`;

container.insertAdjacentHTML("beforeend", navHTML);

}

}

/* =========================
Reveal 動畫
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

});
