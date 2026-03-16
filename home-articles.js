(function(){

const container = document.getElementById("article-list");

if(!container) return;

/* 確保 articles.js 已載入 */

if(typeof ARTICLES === "undefined"){
console.warn("ARTICLES 未載入");
return;
}


/* =========================
依日期排序（最新文章）
========================= */

const latest = [...ARTICLES]
.sort((a,b)=>{

const d1 = new Date(a.date || "2000-01-01");
const d2 = new Date(b.date || "2000-01-01");

return d2 - d1;

})
.slice(0,3);


/* =========================
生成卡片
========================= */

let html = "";

latest.forEach(a=>{

html += `

<a href="articles/${a.url}" class="product-card reveal">

<img 
src="${a.image}" 
alt="${a.title}" 
loading="lazy"
onerror="this.src='images/logo-seal.png';this.classList.add('img-placeholder');"
>

<h3>${a.title}</h3>

<p>${a.tags ? a.tags.join(" · ") : "龜鹿知識"}</p>

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
