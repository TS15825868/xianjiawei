(function(){

if(!location.pathname.includes("/articles/")) return;

const current=location.pathname.split("/").pop();

const index=ARTICLES.findIndex(a=>a.url===current);

if(index===-1) return;

const article=ARTICLES[index];

const container=document.querySelector("article");

if(!container) return;


/* Breadcrumb */

const breadcrumb=`

<div class="breadcrumb">

<a href="../index.html">首頁</a>

<span>/</span>

<a href="../articles/index.html">龜鹿知識</a>

<span>/</span>

${article.title}

</div>

`;

container.insertAdjacentHTML("afterbegin",breadcrumb);


/* Tags */

if(article.tags){

let tagHTML=`<div class="article-tags">`;

article.tags.forEach(tag=>{

tagHTML+=`<span>${tag}</span>`;

});

tagHTML+=`</div>`;

container.insertAdjacentHTML("beforeend",tagHTML);

}


/* Prev Next */

let navHTML=`<div class="article-nav">`;

if(index>0){

navHTML+=`

<a class="prev" href="${ARTICLES[index-1].url}">

上一篇<br>

<strong>${ARTICLES[index-1].title}</strong>

</a>

`;

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
