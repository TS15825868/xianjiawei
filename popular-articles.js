(function(){

if(typeof ARTICLES==="undefined") return;

const container=document.getElementById("popular-articles");

if(!container) return;

/* 熱門文章（手動排序） */

const popular=[
"guilu-gao.html",
"guilu-chicken-soup.html",
"guilu-drink.html"
];

let html="";

popular.forEach(slug=>{

const article=ARTICLES.find(a=>a.url===slug);

if(!article) return;

html+=`

<a href="articles/${article.url}" class="product-card">

<img 
src="${article.image}" 
alt="${article.title}" 
loading="lazy"
>

<h3>${article.title}</h3>

<p>${article.summary || "龜鹿知識"}</p>

</a>

`;

});

container.innerHTML=html;

})();
