(function(){

if(!location.pathname.includes("/articles/")) return;

const current=location.pathname.split("/").pop();

const index=ARTICLES.findIndex(a=>a.url===current);

if(index===-1) return;

const article=ARTICLES[index];

const container=document.querySelector("article");

if(!container) return;


/* =========================
Breadcrumb
========================= */

const breadcrumb=`

<div class="breadcrumb">

<a href="../index.html">首頁</a>

<span>/</span>

<a href="../articles.html">龜鹿知識</a>

<span>/</span>

${article.title}

</div>

`;

container.insertAdjacentHTML("afterbegin",breadcrumb);



/* =========================
閱讀時間
========================= */

const text=container.innerText;

const words=text.length;

const minutes=Math.max(1,Math.round(words/600));

const readTime=`

<p style="opacity:.6;font-size:14px;margin-top:-10px">

閱讀時間：約 ${minutes} 分鐘

</p>

`;

container.insertAdjacentHTML("afterbegin",readTime);



/* =========================
Tags
========================= */

if(article.tags){

let tagHTML=`<div class="article-tags">`;

article.tags.forEach(tag=>{

tagHTML+=`<span>${tag}</span>`;

});

tagHTML+=`</div>`;

container.insertAdjacentHTML("beforeend",tagHTML);

}



/* =========================
延伸閱讀
========================= */

let related=ARTICLES.filter(a=>

a.category===article.category && a.url!==article.url

).slice(0,3);

if(related.length){

let relatedHTML=`

<h2 style="margin-top:60px">延伸閱讀</h2>

<div class="product-grid">

`;

related.forEach(a=>{

relatedHTML+=`

<a href="${a.url}" class="product-card">

<h3>${a.title}</h3>

<p>相關文章</p>

</a>

`;

});

relatedHTML+=`</div>`;

container.insertAdjacentHTML("beforeend",relatedHTML);

}



/* =========================
上一篇 / 下一篇
========================= */

let navHTML=`<div class="article-nav">`;

if(index>0){

navHTML+=`

<a class="prev" href="${ARTICLES[index-1].url}">

上一篇<br>

<strong>${ARTICLES[index-1].title}</strong>

</a>

`;

}else{

navHTML+=`<div></div>`;

}

if(index<ARTICLES.length-1){

navHTML+=`

<a class="next" href="${ARTICLES[index+1].url}">

下一篇<br>

<strong>${ARTICLES[index+1].title}</strong>

</a>

`;

}

navHTML+=`</div>`;

container.insertAdjacentHTML("beforeend",navHTML);


})();
