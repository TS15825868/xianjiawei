
document.addEventListener("DOMContentLoaded",()=>{

const menu=document.getElementById("menuOverlay");
const btn=document.querySelector(".menu-btn");

if(menu){
const isArticle=location.pathname.includes("/articles/");
const base=isArticle?"../":"";

menu.innerHTML=`
<a href="${base}index.html">首頁</a>
<a href="${base}articles.html">龜鹿知識</a>
<a href="https://lin.ee/sHZW7NkR" target="_blank">LINE詢問</a>
`;
}

if(btn&&menu){
btn.addEventListener("click",()=>menu.classList.toggle("active"));
menu.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>menu.classList.remove("active")));
}

});
