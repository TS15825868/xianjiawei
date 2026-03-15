(function(){

const container=document.getElementById("article-grid");

if(!container || typeof ARTICLES==="undefined") return;

let html="";

ARTICLES.forEach(a=>{

html+=`

<a href="articles/${a.url}" class="product-card">

<h3>${a.title}</h3>

<p>${a.tags ? a.tags.join(" · ") : "龜鹿知識"}</p>

</a>

`;

});

container.innerHTML=html;

})();
