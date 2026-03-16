(function(){

/* =========================
確保 articles.js 載入
========================= */

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
排序（最新文章）
========================= */

const list = [...ARTICLES].sort((a,b)=>{

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

<a href="articles/${a.url}" class="product-card reveal">

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
渲染 grid
========================= */

function renderGrid(grid, items){

if(!grid) return;

const fragment = document.createDocumentFragment();

items.forEach(a=>{

const temp = document.createElement("div");
temp.innerHTML = createCard(a);

fragment.appendChild(temp.firstElementChild);

});

grid.innerHTML = "";
grid.appendChild(fragment);

}


/* =========================
模式 1：全部文章
========================= */

if(articleGrid){

renderGrid(
articleGrid,
list.slice(0,12)
);

}


/* =========================
模式 2：分類文章
========================= */

if(cultureGrid || productGrid || recipeGrid){

renderGrid(
cultureGrid,
list.filter(a=>a.category==="culture")
);

renderGrid(
productGrid,
list.filter(a=>a.category==="product")
);

renderGrid(
recipeGrid,
list.filter(a=>a.category==="recipe")
);

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
