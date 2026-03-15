(function(){

const container = document.getElementById("article-grid");

if(!container) return;

/* 確保 articles.js 已載入 */

if(typeof ARTICLES === "undefined"){
console.warn("ARTICLES 未載入");
return;
}


/* =========================
排序（最新文章在前）
========================= */

const list = [...ARTICLES].sort((a,b)=>{
return new Date(b.date) - new Date(a.date);
});


/* =========================
生成文章卡片
========================= */

let html = "";

list.forEach(a => {

html += `

<a href="articles/${a.url}" class="product-card reveal">

<img src="${a.image}" alt="${a.title}" loading="lazy">

<h3>${a.title}</h3>

<p>${a.summary || "龜鹿知識"}</p>

</a>

`;

});

container.innerHTML = html;


/* =========================
Reveal 動畫
========================= */

requestAnimationFrame(()=>{

document.querySelectorAll(".reveal").forEach(el=>{
el.classList.add("show");
});

});

})();
