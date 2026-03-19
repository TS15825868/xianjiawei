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

function zhTitle(url){
const map = {
"guilu-drink-guide.html":"龜鹿飲怎麼喝",
"guilu-drink-time.html":"龜鹿飲什麼時候喝",
"guilu-drink-storage.html":"龜鹿飲保存方式",
"guilu-drink-for-who.html":"龜鹿飲適合誰"
};
return map[url] || url.replace('.html','').replaceAll('-',' ');
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
el.summary.textContent = product.desc;
el.sizes.textContent = product.sizes.join(' / ');
el.pack.textContent = product.package;

el.line.href =
`https://lin.ee/sHZW7NkR?text=${encodeURIComponent(`我想詢問 ${product.name}`)}`;

// 成分
el.ingredients.innerHTML =
product.ingredients.map(i=>`<li>${i}</li>`).join('');

// 用法
el.uses.innerHTML =
product.uses.map(i=>`<li>${i}</li>`).join('');

// ===== 文章 =====
if(el.extra){
el.extra.innerHTML = `
<div class="info-card">
<h3>相關文章</h3>
<div class="product-grid">
${(product.articles||[]).map(a=>`
<a href="articles/${a}" class="product-card">
<h3>${zhTitle(a)}</h3>
</a>`).join('')}
</div>
</div>
`;
}

// ===== 相關商品 =====
if(el.related){
el.related.innerHTML = `
<div class="info-card">
<h3>你也可以看看</h3>
<div class="product-grid">
${products.filter(p=>p.id!==product.id).map(p=>`
<a href="product.html?id=${p.id}" class="product-card">
<img src="${p.image}">
<h3>${p.name}</h3>
</a>`).join('')}
</div>
</div>
`;
}

});

})();
