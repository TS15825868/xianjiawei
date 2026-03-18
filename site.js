document.addEventListener("DOMContentLoaded", () => {

/* =========================
MENU（漢堡）
========================= */

const menu = document.getElementById("menuOverlay");
const btn = document.querySelector(".menu-btn");

if(menu){

const isArticle = location.pathname.includes("/articles/");
const base = isArticle ? "../" : "";

menu.innerHTML = `
<a href="${base}index.html">首頁</a>
<a href="${base}guilu-series.html">龜鹿系列</a>
<a href="${base}choose.html">怎麼選龜鹿</a>
<a href="${base}articles.html">龜鹿知識</a>
<a href="${base}faq.html">FAQ</a>

<a href="https://lin.ee/sHZW7NkR" class="btn-line">
LINE詢問
</a>
`;

/* 點擊連結自動關閉 */
menu.querySelectorAll("a").forEach(link=>{
link.addEventListener("click", ()=>{
menu.classList.remove("active");
});
});

/* 點背景關閉（🔥補強） */
menu.addEventListener("click", (e)=>{
if(e.target === menu){
menu.classList.remove("active");
}
});

}

/* toggle */

if(btn && menu){
btn.addEventListener("click", () => {
menu.classList.toggle("active");
});
}

/* =========================
首頁文章
========================= */

const homeArticleGrid = document.getElementById("article-grid");

if(homeArticleGrid && typeof ARTICLES !== "undefined"){

let html = "";

ARTICLES.slice(0,6).forEach(a => {

html += `
<a href="articles/${a.url}" class="product-card scroll-card">

<img src="${a.image || 'images/logo-seal.png'}"
loading="lazy"
onerror="this.src='images/logo-seal.png'">

<h3>${a.title}</h3>
<p>${a.summary || '點擊查看內容'}</p>

</a>
`;

});

homeArticleGrid.innerHTML = html;

}

/* =========================
文章頁（上一篇下一篇）
========================= */

if(location.pathname.includes("/articles/") && typeof ARTICLES !== "undefined"){

const current = location.pathname.split("/").pop();
const index = ARTICLES.findIndex(a => a.url === current);

const main = document.querySelector("main");

if(main && index !== -1){

let nav = `<div style="
margin-top:40px;
display:flex;
justify-content:space-between;
gap:10px;
flex-wrap:wrap;
">`;

if(index > 0){
nav += `
<a href="../articles/${ARTICLES[index-1].url}" class="btn">
← 上一篇
</a>`;
}

if(index < ARTICLES.length - 1){
nav += `
<a href="../articles/${ARTICLES[index+1].url}" class="btn">
下一篇 →
</a>`;
}

nav += `</div>`;

main.insertAdjacentHTML("beforeend", nav);

}

}

});
