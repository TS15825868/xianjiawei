document.addEventListener("DOMContentLoaded",()=>{

const menu = document.getElementById("menuOverlay");
const btn = document.querySelector(".menu-btn");

if(!menu) return;


/* 判斷是否在 articles 目錄 */

const isArticle = location.pathname.includes("/articles/");
const base = isArticle ? "../" : "";


/* 建立選單 */

menu.innerHTML = `

<a href="${base}index.html">首頁</a>

<a href="${base}guilu-series.html">龜鹿系列</a>

<a href="${base}qixuan-tea.html">柒玄茶</a>

<a href="${base}recipes.html">料理搭配</a>

<a href="${base}choose.html">怎麼選龜鹿</a>

<a href="${base}articles.html">龜鹿知識</a>

<a href="${base}brand.html">品牌故事</a>

<a href="${base}faq.html">FAQ</a>

<a href="https://lin.ee/sHZW7NkR"
class="line-btn"
target="_blank"
rel="noopener">

LINE詢問

</a>

`;


/* 漢堡開關 */

if(btn){

btn.addEventListener("click",()=>{
menu.classList.toggle("active");
});

}


/* 點連結自動關閉 */

menu.querySelectorAll("a").forEach(link=>{

link.addEventListener("click",()=>{
menu.classList.remove("active");
});

});


/* Scroll Reveal */

const revealEls = document.querySelectorAll(".reveal");

const observer = new IntersectionObserver(entries=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.classList.add("show");

}

});

},{threshold:0.15});

revealEls.forEach(el=>observer.observe(el));


});
