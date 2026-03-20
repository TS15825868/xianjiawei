(function(){

const params = new URLSearchParams(location.search);
const id = params.get('id');

// ===== DOM =====
const el = {
image: document.getElementById('product-image'),
title: document.getElementById('product-title'),
summary: document.getElementById('product-summary'),
sizes: document.getElementById('product-sizes'),
pack: document.getElementById('product-package'),
ingredients: document.getElementById('product-ingredients'),
uses: document.getElementById('product-uses'),
line: document.getElementById('product-line'),
tabs: document.getElementById('product-tabs'),
extra: document.getElementById('product-extra'),
related: document.getElementById('related-products')
};

// ===== 安全防呆 =====
function safe(val, fallback=""){
return val || fallback;
}

// ===== 載入資料 =====
fetch('./products.json')
.then(res=>res.json())
.then(data=>{

const products = data.products || [];

// 找產品
let product = products.find(p=>p.id===id);

// fallback
if(!product){
product = products[0];
}

// ========================
// 🔥 Tabs（商品切換）
// ========================
if(el.tabs){
el.tabs.innerHTML = products.map(p=>`
<a href="product.html?id=${p.id}" 
class="tab ${p.id===product.id?'active':''}">
${p.name}
</a>
`).join('');
}

// ========================
// 🔥 主資料
// ========================
if(el.image) el.image.src = safe(product.image);
if(el.title) el.title.textContent = safe(product.name);

// 👉 成交導向文案（自動）
if(el.summary){
el.summary.textContent = 
safe(product.desc) + "，適合建立日常補養節奏。";
}

// 規格
if(el.sizes){
el.sizes.textContent = (product.sizes || []).join(' / ');
}

// 包裝
if(el.pack){
el.pack.textContent = safe(product.package);
}

// 成分
if(el.ingredients){
el.ingredients.innerHTML =
(product.ingredients || [])
.map(i=>`<li>${i}</li>`)
.join('');
}

// 使用方式
if(el.uses){
el.uses.innerHTML =
(product.uses || [])
.map(i=>`<li>${i}</li>`)
.join('');
}

// ========================
// 🔥 LINE成交導流
// ========================
if(el.line){
el.line.href =
`https://lin.ee/sHZW7NkR?text=${encodeURIComponent(`我想了解 ${product.name} 怎麼搭配`)}`;
}

// ========================
// 🔥 補養知識（自動入口）
// ========================
if(el.extra){

el.extra.innerHTML = `
<div class="info-card">

<h3>補養知識</h3>

<p style="font-size:14px;color:#666;">
不確定怎麼吃？怎麼搭配？這裡幫你整理好了
</p>

<div style="margin-top:10px">
<a href="articles.html" class="btn btn-dark">
查看完整說明
</a>
</div>

</div>
`;

}

// ========================
// 🔥 相關商品（提高客單）
// ========================
if(el.related){

const related = products.filter(p=>p.id !== product.id);

el.related.innerHTML = `
<div class="info-card">

<h3>你也可以看看</h3>

<div class="product-grid">

${related.map(p=>`
<a href="product.html?id=${p.id}" class="product-card">
<img src="${p.image}">
<h3>${p.name}</h3>
<p style="font-size:13px;color:#666;">點我了解 →</p>
</a>
`).join('')}

</div>

<div style="margin-top:20px;text-align:center;">
<a href="https://lin.ee/sHZW7NkR?text=幫我推薦適合的龜鹿搭配"
class="btn btn-line">
👉 幫我推薦
</a>
</div>

</div>
`;

}

})
.catch(err=>{
console.error("product.js error:", err);
});

})();
