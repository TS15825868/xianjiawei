(function(){

const container = document.getElementById("popular-articles");

if(!container) return;

/* 確保 articles.js 已載入 */

if(typeof ARTICLES === "undefined" || !Array.isArray(ARTICLES)){
console.warn("ARTICLES 未載入");
return;
}


/* =========================
取得熱門文章
========================= */

const popular = ARTICLES
.filter(a => a && a.popular === true)
.slice(0,3);


/* =========================
若沒有熱門文章，直接結束
========================= */

if(!popular.length){
container.innerHTML = "";
return;
}


/* =========================
生成卡片
========================= */

let html = "";

popular.forEach(article => {

const image = article.image || "images/logo-seal.png";
const summary = article.summary || "龜鹿知識";

html += `

<a href="articles/${article.url}" class="product-card">

<img
src="${image}"
alt="${article.title}"
loading="lazy"
onerror="this.src='images/logo-seal.png';this.classList.add('img-placeholder');"
>

<h3>${article.title}</h3>

<p>${summary}</p>

</a>

`;

});

container.innerHTML = html;

})();
