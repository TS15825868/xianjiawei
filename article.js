(function(){

const elList = document.getElementById("article-list");
const elTitle = document.getElementById("article-title");
const elContent = document.getElementById("article-content");

const params = new URLSearchParams(location.search);
const id = params.get("id");

// ===== 自動文章模板 =====
function generateArticle(product){

return `
<p>${product.name}是常見的補養方式之一，適合日常調整飲食節奏使用。</p>

<h2>怎麼使用</h2>
<ul>
${product.uses.map(u=>`<li>${u}</li>`).join("")}
</ul>

<h2>成分</h2>
<ul>
${product.ingredients.map(i=>`<li>${i}</li>`).join("")}
</ul>

<h2>適合族群</h2>
<p>依個人飲食與生活習慣調整使用。</p>
`;
}

// ===== 列表 =====
if(elList){

fetch("products.json")
.then(res=>res.json())
.then(data=>{

elList.innerHTML = data.products.map(p=>`
<a href="article.html?id=${p.id}" class="product-card">
<h3>${p.name}怎麼吃</h3>
<p>查看完整說明 →</p>
</a>
`).join("");

});

}

// ===== 內頁 =====
if(elContent){

fetch("../products.json")
.then(res=>res.json())
.then(data=>{

const product = data.products.find(p=>p.id===id);

elTitle.textContent = product.name + "完整說明";
elContent.innerHTML = generateArticle(product);

});

}

})();
