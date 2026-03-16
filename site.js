document.addEventListener("DOMContentLoaded",()=>{

/* MENU */

const menu=document.getElementById("menuOverlay");
const btn=document.querySelector(".menu-btn");

if(menu){

const isArticle=location.pathname.includes("/articles/");
const base=isArticle?"../":"";

menu.innerHTML=`

<a href="${base}index.html">首頁</a>
<a href="${base}guilu-series.html">龜鹿系列</a>
<a href="${base}recipes.html">料理搭配</a>
<a href="${base}choose.html">怎麼選龜鹿</a>
<a href="${base}articles.html">龜鹿知識</a>
<a href="${base}brand.html">品牌故事</a>
<a href="${base}faq.html">FAQ</a>

<a href="https://lin.ee/sHZW7NkR"
class="line-btn"
target="_blank">

LINE詢問

</a>

`;
}

if(btn && menu){

btn.addEventListener("click",()=>{
menu.classList.toggle("active");
});

menu.querySelectorAll("a").forEach(link=>{
link.addEventListener("click",()=>{
menu.classList.remove("active");
});
});

}

/* reveal */

const reveals=document.querySelectorAll(".reveal");

if(reveals.length){

const observer=new IntersectionObserver(entries=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.classList.add("show");
observer.unobserve(entry.target);

}

});

},{threshold:.15});

reveals.forEach(el=>observer.observe(el));

}

/* 首頁文章 */

if(typeof ARTICLES!=="undefined"){

const latest=document.getElementById("article-list");
const popular=document.getElementById("popular-articles");

if(latest){

const list=[...ARTICLES]
.sort((a,b)=>new Date(b.date)-new Date(a.date))
.slice(0,3);

latest.innerHTML=list.map(a=>`

<a href="articles/${a.url}" class="product-card">

<img src="${a.image}" alt="${a.title}">

<h3>${a.title}</h3>

<p>${a.summary}</p>

</a>

`).join("");

}

if(popular){

const list=ARTICLES
.filter(a=>a.popular)
.slice(0,3);

popular.innerHTML=list.map(a=>`

<a href="articles/${a.url}" class="product-card">

<img src="${a.image}" alt="${a.title}">

<h3>${a.title}</h3>

<p>${a.summary}</p>

</a>

`).join("");

}

}

});
