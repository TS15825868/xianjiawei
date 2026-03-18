document.addEventListener("DOMContentLoaded", () => {

const menu = document.getElementById("menuOverlay");
const btn = document.querySelector(".menu-btn");

if(menu){

const isArticle = location.pathname.includes("/articles/");
const base = isArticle ? "../" : "";

menu.innerHTML = `
<a href="${base}index.html">首頁</a>
<a href="${base}guilu-series.html">龜鹿系列</a>
<a href="${base}choose.html">怎麼選龜鹿</a>
<a href="${base}articles.html">龜鹿知識</a>
<a href="${base}faq.html">FAQ</a>

<a href="https://lin.ee/sHZW7NkR" class="btn btn-line">
LINE詢問
</a>
`;

/* 點擊關閉 */
menu.querySelectorAll("a").forEach(link=>{
link.addEventListener("click", ()=>{
menu.classList.remove("active");
});
});

/* 點背景關閉 */
menu.addEventListener("click", (e)=>{
if(e.target === menu){
menu.classList.remove("active");
}
});

}

/* toggle */
if(btn && menu){
btn.addEventListener("click", ()=>{
menu.classList.toggle("active");
});
}

});
