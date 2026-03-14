(function () {

const params = new URLSearchParams(window.location.search);
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

const fallbackBack = "guilu-series.html";

/* 返回按鈕 */

if(backBtn){

if(from){

backBtn.href = from;

}else if(document.referrer && document.referrer.includes(location.host)){

try{

const refUrl = new URL(document.referrer);
const refPath = refUrl.pathname.split("/").pop();

backBtn.href = refPath || fallbackBack;

}catch(e){

backBtn.href = fallbackBack;

}

}else{

backBtn.href = fallbackBack;

}

}

/* 讀取產品資料 */

fetch("products.json")

.then(res=>res.json())

.then(data=>{

const product = data.products.find(p=>p.id===id) || data.products[0];

if(!product) return;

/* 標題 */

document.title = `${product.name}｜仙加味`;

/* 圖片 */

if(productImage){

productImage.src = product.image;
productImage.alt = product.name;

}

/* 基本資料 */

if(productTitle) productTitle.textContent = product.name;
if(productSummary) productSummary.textContent = product.desc || "";

/* 容量 */

if(productSizes){

if(Array.isArray(product.sizes)){

productSizes.textContent = product.sizes.join(" / ");

}else{

productSizes.textContent = product.size || "";

}

}

/* 包裝 */

if(productPackage){

productPackage.textContent = product.package || "—";

}

/* 成份 */

if(productIngredients){

const items = Array.isArray(product.ingredients)
? product.ingredients
: String(product.ingredients||"").split(/\s+/).filter(Boolean);

productIngredients.innerHTML =
items.map(i=>`<li>${i}</li>`).join("");

}

/* 食用方式 */

if(productUses){

const items = Array.isArray(product.uses)
? product.uses
: [];

productUses.innerHTML =
items.length
? items.map(i=>`<li>${i}</li>`).join("")
: "<li>請透過 LINE 詢問食用方式。</li>";

}

/* =====================
   SEO Product Schema
===================== */

const schema = {

"@context":"https://schema.org",

"@type":"Product",

"name":product.name,

"description":product.desc || "",

"image":product.image,

"brand":{
"@type":"Brand",
"name":"仙加味"
},

"category":"龜鹿產品",

"url":location.href

};

const script = document.createElement("script");

script.type = "application/ld+json";

script.text = JSON.stringify(schema);

document.head.appendChild(script);

})

.catch(err=>{

console.error("products.json 讀取失敗:",err);

});

})();
