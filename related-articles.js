document.addEventListener("DOMContentLoaded",()=>{

const related = document.getElementById("related-articles");

if(!related) return;

const current = location.pathname.split("/").pop();

const article = ARTICLES.find(a=>a.url===current);

if(!article) return;

/* 依 tag 找相關文章 */

let list = ARTICLES.filter(a=>{

if(a.url===current) return false;

if(!a.tags || !article.tags) return false;

return a.tags.some(tag=>article.tags.includes(tag));

});

/* 如果不足3篇 */

if(list.length < 3){

list = ARTICLES.filter(a=>a.url!==current);

}

list = list.slice(0,3);

let html="";

list.forEach(a=>{

html+=`

<a href="${a.url}" class="product-card">

<h3>${a.title}</h3>
<p>${a.summary}</p>

</a>

`;

});

related.innerHTML = html;

});
