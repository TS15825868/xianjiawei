(function(){

const params = new URLSearchParams(location.search);

const id = params.get("id");
const from = params.get("from");

const backBtn = document.getElementById("backBtn");

const productImage = document.getElementById("product-image");
const productTitle = document.getElementById("product-title");
const productSummary = document.getElementById("product-summary");
const productSizes = document.getElementById("product-sizes");
const productPackage = document.getElementById("product-package");
const productIngredients = document.getElementById("product-ingredients");
const productUses = document.getElementById("product-uses");

const breadcrumb = document.getElementById("breadcrumb-product");

const productInfo = document.querySelector(".product-info");

const fallbackBack = "guilu-series.html";


/* =========================
返回按鈕
========================= */

if(backBtn){

backBtn.addEventListener("click",()=>{

if(from){

location.href = from;

}else if(document.referrer && document.referrer.includes(location.host)){

history.back();

}else{

location.href = fallbackBack;

}

});

}


/* =========================
讀取產品
========================= */

fetch("products.json")

.then(res=>res.json())

.then(data=>{

if(!data || !Array.isArray(data.products)) return;

const product = data.products.find(p=>p.id===id) || data.products[0];

if(!product) return;


/* =========================
SEO
========================= */

document.title = `${product.name}｜仙加味`;

const metaDesc = document.querySelector('meta[name="description"]');

if(metaDesc && product.desc){
metaDesc.setAttribute("content",product.desc);
}

const ogImage = document.querySelector('meta[property="og:image"]');

if(ogImage){
ogImage.setAttribute("content",product.seoImage || product.image);
}


/* =========================
Breadcrumb
========================= */

if(breadcrumb){
breadcrumb.textContent = product.name;
}


/* =========================
圖片
========================= */

if(productImage){

productImage.src = product.image || "images/logo-seal.png";
productImage.alt = `仙加味 ${product.name}`;
productImage.loading = "lazy";

}


/* =========================
基本資料
========================= */

if(productTitle) productTitle.textContent = product.name;

if(productSummary) productSummary.textContent = product.desc || "";


/* =========================
容量
========================= */

if(productSizes){

productSizes.textContent = product.sizes
? product.sizes.join(" / ")
: "";

}


/* =========================
包裝
========================= */

if(productPackage){

productPackage.textContent = product.package || "—";

}


/* =========================
成份
========================= */

if(productIngredients){

const items = Array.isArray(product.ingredients)
? product.ingredients
: [];

productIngredients.innerHTML =
items.map(i=>`<li>${i}</li>`).join("");

}


/* =========================
食用方式
========================= */

if(productUses){

const items = Array.isArray(product.uses)
? product.uses
: [];

productUses.innerHTML =
items.length
? items.map(i=>`<li>${i}</li>`).join("")
: "<li>請透過 LINE 詢問食用方式</li>";

}


/* =========================
文章標題
========================= */

function getArticleTitle(url){

let slug = url.split("/").pop();

if(typeof ARTICLES !== "undefined"){

const match = ARTICLES.find(a=>a.url===slug);

if(match) return match.title;

}

return slug
.replace(".html","")
.replaceAll("-"," ");

}


/* =========================
相關文章
========================= */

if(product.articles && productInfo){

let html = `

<section class="info-card reveal">

<h3>相關文章</h3>

<div class="product-grid">

`;

product.articles.forEach(url=>{

const title = getArticleTitle(url);

html += `

<a href="articles/${url}" class="product-card">

<h3>${title}</h3>

<p>查看內容</p>

</a>

`;

});

html += `</div></section>`;

productInfo.insertAdjacentHTML("beforeend",html);

}


/* =========================
料理搭配
========================= */

if(product.recipes && productInfo){

let html = `

<section class="info-card reveal">

<h3>料理搭配</h3>

<div class="product-grid">

`;

product.recipes.forEach(url=>{

const title = getArticleTitle(url);

html += `

<a href="articles/${url}" class="product-card">

<h3>${title}</h3>

<p>料理方式</p>

</a>

`;

});

html += `</div></section>`;

productInfo.insertAdjacentHTML("beforeend",html);

}


/* =========================
相關產品
========================= */

const relatedProducts = data.products
.filter(p=>p.id !== product.id)
.slice(0,3);

if(relatedProducts.length && productInfo){

let html = `

<section class="info-card reveal">

<h3>相關產品</h3>

<div class="product-grid">

`;

relatedProducts.forEach(p=>{

html += `

<a href="product.html?id=${p.id}" class="product-card">

<h3>${p.name}</h3>

<p>${p.desc || ""}</p>

</a>

`;

});

html += `</div></section>`;

productInfo.insertAdjacentHTML("beforeend",html);

}


/* =========================
Product Schema
========================= */

const schema = {

"@context":"https://schema.org",
"@type":"Product",

"name":product.name,
"description":product.desc || "",
"image":product.seoImage || product.image,

"sku":product.id,

"brand":{
"@type":"Brand",
"name":"仙加味"
},

"url":location.href,

"offers":{
"@type":"Offer",
"price":"0",
"priceCurrency":"TWD",
"availability":"https://schema.org/InStock"
}

};

const script = document.createElement("script");

script.type = "application/ld+json";
script.text = JSON.stringify(schema);

document.head.appendChild(script);


/* =========================
Reveal 觸發
========================= */

setTimeout(()=>{

document.querySelectorAll(".reveal").forEach(el=>{
el.classList.add("show");
});

},100);

})

.catch(err=>{
console.error("products.json 讀取失敗:",err);
});

})();
