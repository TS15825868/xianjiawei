document.addEventListener("DOMContentLoaded",()=>{

if(typeof ARTICLES==="undefined") return;

if(!location.pathname.includes("/articles/")) return;

const slug = location.pathname.split("/").pop();

const article = ARTICLES.find(a=>a.url===slug);

if(!article) return;

const container = document.querySelector("article");

if(!container) return;

/* breadcrumb */

const breadcrumb = `
<div class="breadcrumb">

<a href="../index.html">首頁</a>
<span>/</span>

<a href="../articles.html">龜鹿知識</a>
<span>/</span>

${article.title}

</div>
`;

container.insertAdjacentHTML("afterbegin",breadcrumb);

/* 標題 */

const title = document.createElement("h1");
title.textContent = article.title;

container.prepend(title);

/* 文章內容 */

const p = document.createElement("p");

p.innerHTML = `
${article.summary}

龜鹿食材在傳統飲食文化中
常見於燉湯與藥膳料理。

龜板與鹿角的搭配
也形成許多經典料理方式。

`;

container.appendChild(p);

/* 相關文章 */

const related = document.getElementById("related-articles");

if(related){

const list = ARTICLES
.filter(a=>a.url!==article.url)
.slice(0,3);

let html="";

list.forEach(a=>{

html+=`

<a href="${a.url}" class="product-card">

<h3>${a.title}</h3>

<p>${a.summary}</p>

</a>

`;

});

related.innerHTML=html;

}

});
