(function(){

const listEl = document.getElementById("article-list");
const titleEl = document.getElementById("article-title");
const contentEl = document.getElementById("article-content");

const params = new URLSearchParams(location.search);
const id = params.get("id");
const type = params.get("type");

// ===== SEO模板（10種）=====
const TEMPLATES = [
{ type:"eat", title:"怎麼吃", },
{ type:"daily", title:"可以每天吃嗎", },
{ type:"who", title:"適合什麼人", },
{ type:"compare", title:"差在哪", },
{ type:"time", title:"什麼時候吃", },
{ type:"mix", title:"怎麼搭配", },
{ type:"effect", title:"日常補養方式", },
{ type:"cook", title:"怎麼料理", },
{ type:"care", title:"日常保養建議", },
{ type:"faq", title:"常見問題" }
];

// ===== 文章內容生成 =====
function generateContent(product, type){

switch(type){

case "eat":
return `
<p>${product.name}可依日常習慣食用，常見方式如下：</p>
<ul>${product.uses.map(u=>`<li>${u}</li>`).join("")}</ul>
`;

case "who":
return `
<p>${product.name}適合作為日常補養的一部分，可依個人飲食與生活習慣調整使用。</p>
`;

case "daily":
return `
<p>是否每天使用，可依個人補養節奏調整，建議從少量開始。</p>
`;

case "compare":
return `
<p>${product.name}與其他型態（如膏、飲、湯塊）差異在於使用方式與方便性。</p>
`;

case "time":
return `
<p>建議依日常作息安排使用時間，例如早晚或餐後。</p>
`;

case "mix":
return `
<p>可搭配溫水、湯品或日常飲食一起使用。</p>
`;

case "cook":
return `
<p>可加入雞湯、排骨湯等料理中，提升日常補養方式。</p>
`;

case "faq":
return `
<p>常見問題包含：怎麼吃？多久吃一次？如何搭配？</p>
`;

default:
return `
<p>${product.name}是一種日常補養方式，可依個人需求調整使用。</p>
`;

}

}

// ===== 列表頁 =====
if(listEl){

fetch("products.json")
.then(r=>r.json())
.then(data=>{

let html = "";

data.products.forEach(p=>{
TEMPLATES.forEach(t=>{

html += `
<a href="seo/article.html?id=${p.id}&type=${t.type}" class="product-card">
<h3>${p.name}${t.title}</h3>
<p>查看完整說明 →</p>
</a>
`;

});
});

listEl.innerHTML = html;

});

}

// ===== 文章頁 =====
if(contentEl){

fetch("../products.json")
.then(r=>r.json())
.then(data=>{

const product = data.products.find(p=>p.id===id);
const template = TEMPLATES.find(t=>t.type===type);

titleEl.textContent = `${product.name}${template.title}`;
contentEl.innerHTML = `
${generateContent(product,type)}

<h2>成分</h2>
<ul>${product.ingredients.map(i=>`<li>${i}</li>`).join("")}</ul>

<div style="margin-top:30px;">
<a href="../product.html?id=${product.id}" class="btn btn-dark">
👉 查看產品
</a>

<a href="https://lin.ee/sHZW7NkR?text=${encodeURIComponent(`我想了解${product.name}`)}" class="btn btn-line">
👉 LINE詢問
</a>
</div>
`;

});

}

})();
