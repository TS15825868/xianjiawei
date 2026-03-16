(function(){

/* 確保 articles.js 已載入 */

if(typeof ARTICLES === "undefined"){
console.warn("ARTICLES 未載入");
return;
}


/* =========================
取得容器
========================= */

const articleGrid = document.getElementById("article-grid");

const cultureGrid = document.getElementById("culture-grid");
const productGrid = document.getElementById("product-grid");
const recipeGrid = document.getElementById("recipe-grid");


/* =========================
排序（最新文章在前）
========================= */

const list = [...ARTICLES].sort((a,b)=>{

const d1 = new Date(a.date || "2000-01-01");
const d2 = new Date(b.date || "2000-01-01");

return d2 - d1;

});


/* =========================
生成卡片
========================= */

function createCard(a){

return `

<a href="articles/${a.url}" class="product-card reveal">

<img 
src="${a.image}" 
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
模式 1：全部文章
========================= */

if(articleGrid){

let html="";

list.forEach(a=>{
html+=createCard(a);
});

articleGrid.innerHTML=html;

}


/* =========================
模式 2：分類文章
========================= */

if(cultureGrid || productGrid || recipeGrid){

list.forEach(a=>{

const card=createCard(a);

if(a.category==="culture" && cultureGrid){
cultureGrid.insertAdjacentHTML("beforeend",card);
}

if(a.category==="product" && productGrid){
productGrid.insertAdjacentHTML("beforeend",card);
}

if(a.category==="recipe" && recipeGrid){
recipeGrid.insertAdjacentHTML("beforeend",card);
}

});

}


/* =========================
Reveal 動畫
========================= */

requestAnimationFrame(()=>{

document.querySelectorAll(".reveal").forEach(el=>{
el.classList.add("show");
});

});

})();
