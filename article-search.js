(function(){

/* =========================
確保資料存在
========================= */

if(typeof ARTICLES === "undefined") return;

const input = document.getElementById("article-search");
const container = document.getElementById("article-grid");

if(!input || !container) return;


/* =========================
原始文章排序
========================= */

const original = [...ARTICLES].sort((a,b)=>{

const d1 = new Date(a.date || "2000-01-01");
const d2 = new Date(b.date || "2000-01-01");

return d2 - d1;

});


/* =========================
建立卡片
========================= */

function createCard(a){

const img = a.image || "images/logo-seal.png";

return `

<a href="articles/${a.url}" class="product-card">

<img
src="${img}"
alt="${a.title}"
loading="lazy"
onerror="this.src='images/logo-seal.png';this.classList.add('img-placeholder');"
>

<h3>${a.title}</h3>

<p>${a.summary || "龜鹿知識"}</p>

</a>

`;

}


/* =========================
渲染
========================= */

function render(list){

if(!list.length){

container.innerHTML=`

<div style="grid-column:1/-1;text-align:center;opacity:.6">

沒有找到相關文章

</div>

`;

return;

}

let html="";

list.forEach(a=>{
html += createCard(a);
});

container.innerHTML = html;

}


/* =========================
搜尋
========================= */

input.addEventListener("input", function(){

const keyword = this.value.trim().toLowerCase();

/* 空搜尋 */

if(keyword === ""){
render(original.slice(0,12));
return;
}

/* 篩選 */

const filtered = original.filter(a=>{

const title = a.title?.toLowerCase() || "";
const summary = a.summary?.toLowerCase() || "";
const tags = (a.tags || []).join(" ").toLowerCase();

return (
title.includes(keyword) ||
summary.includes(keyword) ||
tags.includes(keyword)
);

});

render(filtered);

});


})();
