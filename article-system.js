(function(){

document.addEventListener("DOMContentLoaded",function(){

if(!location.pathname.includes("/articles/")) return;

const path=location.pathname.split("/").pop();

if(!path) return;

const articles=[

{title:"什麼是龜鹿",url:"what-is-guilu.html",tag:"龜鹿文化"},
{title:"龜鹿怎麼吃",url:"how-to-eat-guilu.html",tag:"食用方式"},
{title:"鹿茸粉怎麼吃",url:"lurong-how.html",tag:"鹿茸"},
{title:"鹿茸咖啡",url:"lurong-coffee.html",tag:"鹿茸"},
{title:"鹿茸牛奶",url:"lurong-milk.html",tag:"鹿茸"},
{title:"鹿茸茶",url:"lurong-tea.html",tag:"鹿茸"},
{title:"龜鹿雞湯",url:"guilu-chicken-soup.html",tag:"龜鹿料理"},
{title:"龜鹿燉排骨",url:"guilu-pork-ribs.html",tag:"龜鹿料理"},
{title:"龜鹿藥膳湯",url:"guilu-herbal-soup.html",tag:"龜鹿料理"}

];

const index=articles.findIndex(a=>a.url===path);

if(index===-1) return;

const article=articles[index];

const main=document.querySelector("main");

if(!main) return;


/* =========================
Breadcrumb
========================= */

const breadcrumb=document.createElement("div");

breadcrumb.className="section";

breadcrumb.innerHTML=`
<p class="center" style="font-size:14px;opacity:.6">

<a href="../index.html">首頁</a> /
<a href="../articles.html">龜鹿知識</a> /
${article.title}

</p>
`;

main.prepend(breadcrumb);


/* =========================
Tag
========================= */

const hero=document.querySelector(".recipe-body");

if(hero){

const tag=document.createElement("div");

tag.style.marginTop="10px";

tag.innerHTML=`
<span style="
background:#eee;
padding:6px 12px;
border-radius:20px;
font-size:13px;
">
${article.tag}
</span>
`;

hero.appendChild(tag);

}


/* =========================
上一篇 下一篇
========================= */

let navHTML=`<section class="section">

<h2 class="center">延伸閱讀</h2>

<div class="product-grid">`;

if(index>0){

const prev=articles[index-1];

navHTML+=`

<a href="${prev.url}" class="product-card">

<h3>上一篇</h3>

<p>${prev.title}</p>

</a>

`;

}

if(index<articles.length-1){

const next=articles[index+1];

navHTML+=`

<a href="${next.url}" class="product-card">

<h3>下一篇</h3>

<p>${next.title}</p>

</a>

`;

}

navHTML+=`</div></section>`;

main.insertAdjacentHTML("beforeend",navHTML);


});

})();
