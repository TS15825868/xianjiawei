(function(){

if(typeof ARTICLES==="undefined") return;

const container=document.getElementById("related-articles");

if(!container) return;

let html="";

const shuffled=[...ARTICLES].sort(()=>0.5-Math.random()).slice(0,3);

shuffled.forEach(a=>{

html+=`

<a href="../articles/${a.url}" class="product-card">

<h3>${a.title}</h3>

<p>${a.summary || "龜鹿知識"}</p>

</a>

`;

});

container.innerHTML=html;

})();
