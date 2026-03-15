(function(){

if(typeof ARTICLES==="undefined") return;

const container=document.getElementById("related-articles");

if(!container) return;

let html="";

ARTICLES.slice(0,3).forEach(a=>{

html+=`

<a href="${a.url}" class="product-card">

<h3>${a.title}</h3>

<p>${a.summary || "龜鹿知識"}</p>

</a>

`;

});

container.innerHTML=html;

})();
