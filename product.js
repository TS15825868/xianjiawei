(function(){

const params = new URLSearchParams(location.search);
const id = params.get('id');

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

// ===== 🔥 中文文章標題（封頂版）=====
function zhTitle(url){
const map = {

"guilu-gao-how.html":"龜鹿膏怎麼吃",
"guilu-gao-dose.html":"龜鹿膏吃多少",
"guilu-gao-storage.html":"龜鹿膏保存方式",
"guilu-gao-for-who.html":"龜鹿膏適合誰",
"what-is-guilu.html":"什麼是龜鹿",

"guilu-drink-guide.html":"龜鹿飲怎麼喝",
"guilu-drink-time.html":"龜鹿飲什麼時候喝",
"guilu-drink-storage.html":"龜鹿飲保存方式",
"guilu-drink-for-who.html":"龜鹿飲適合誰",

"guilu-block-how.html":"龜鹿湯塊怎麼煮",
"guilu-block-time.html":"龜鹿湯塊怎麼吃",
"guilu-block-storage.html":"龜鹿湯塊保存方式",

"lurong-how.html":"鹿茸粉怎麼吃",
"lurong-time.html":"鹿茸粉什麼時候吃",
"lurong-for-who.html":"鹿茸粉適合誰"

};

return map[url] || "補養知識";
}

fetch('./products.json')
.then(res=>res.json())
.then(data=>{

const products = data.products || [];
const product = products.find(p=>p.id===id) || products[0];

// ===== tabs =====
if(el.tabs){
el.tabs.innerHTML = products.map(p=>`
<a href="product.html?id=${p.id}" class="tab ${p.id===product.id?'active':''}">
${p.name}
</a>
`).join('');
}

// ===== 主資料 =====
el.image.src = product.image;
el.title.textContent = product.name;

// 🔥 成交導向文案（自動補強）
el.summary.textContent = product.desc + "，適合建立日常補養節奏。";

el.sizes.textContent = product.sizes.join(' / ');
el.pack.textContent = product.package;

// 🔥 LINE導購強化
el.line.href =
`https://lin.ee/sHZW7NkR?text=${encodeURIComponent(`我想了解 ${product.name} 怎麼搭配`)}`;

// 成分
el.ingredients.innerHTML =
(product.ingredients||[]).map(i=>`<li>${i}</li>`).join('');

// 用法
el.uses.innerHTML =
(product.uses||[]).map(i=>`<li>${i}</li>`).join('');

// ===== 🔥 文章（成交版）=====
if(el.extra){
el.extra.innerHTML = `
<div class="info-card">
<h3>補養知識</h3>

<div class="product-grid">
${(product.articles||[]).map(a=>`
<a href="articles/${a}" class="product-card">
<h3>${zhTitle(a)}</h3>
<p style="font-size:13px;color:#666;">查看內容 →</p>
</a>
`).join('')}
</div>

<div style="margin-top:20px;text-align:center;">
<a href="https://lin.ee/sHZW7NkR?text=${encodeURIComponent(`我想了解 ${product.name} 怎麼搭`)}}"
class="btn btn-line">
👉 免費幫我搭配
</a>
</div>

</div>
`;
}

// ===== 🔥 相關商品（成交版）=====
if(el.related){
el.related.innerHTML = `
<div class="info-card">
<h3>你也可以看看</h3>

<div class="product-grid">
${products.filter(p=>p.id!==product.id).map(p=>`
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

});

})();
