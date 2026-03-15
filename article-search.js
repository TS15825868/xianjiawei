(function(){

if(typeof ARTICLES==="undefined") return;

const input=document.getElementById("article-search");
const container=document.getElementById("article-grid");

if(!input || !container) return;

input.addEventListener("input",function(){

const keyword=this.value.toLowerCase();

const filtered=ARTICLES.filter(a=>{

return (
a.title.toLowerCase().includes(keyword) ||
(a.tags && a.tags.join(" ").toLowerCase().includes(keyword))
);

});

render(filtered);

});

function render(list){

let html="";

list.forEach(a=>{

html+=`

<a href="articles/${a.url}" class="product-card">

<img src="${a.image}" alt="${a.title}" loading="lazy">

<h3>${a.title}</h3>

<p>${a.summary || "龜鹿知識"}</p>

</a>

`;

});

container.innerHTML=html;

}

})();
