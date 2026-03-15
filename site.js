/* =========================
統一漢堡選單 HTML
========================= */

document.addEventListener("DOMContentLoaded",()=>{

const menu=document.getElementById("menuOverlay");

if(menu){

menu.innerHTML=`

<a href="index.html">首頁</a>
<a href="guilu-series.html">龜鹿系列</a>
<a href="recipes.html">料理搭配</a>
<a href="choose.html">怎麼選龜鹿</a>
<a href="articles.html">龜鹿知識</a>
<a href="brand.html">品牌故事</a>
<a href="faq.html">FAQ</a>

<a href="https://lin.ee/sHZW7NkR"
class="line-btn"
target="_blank"
rel="noopener">

LINE詢問

</a>

`;

}

});



/* =========================
漢堡選單
========================= */

function toggleMenu(){

const menu=document.getElementById("menuOverlay");

if(!menu) return;

menu.classList.toggle("active");

/* 鎖定背景滾動 */

if(menu.classList.contains("active")){

document.body.style.overflow="hidden";

}else{

document.body.style.overflow="";

}

}



/* =========================
點擊背景關閉
========================= */

document.addEventListener("click",function(e){

const menu=document.getElementById("menuOverlay");
const menuBtn=document.querySelector(".menu-btn");

if(!menu || !menuBtn) return;

if(
menu.classList.contains("active") &&
!menu.contains(e.target) &&
!menuBtn.contains(e.target)
){

menu.classList.remove("active");
document.body.style.overflow="";

}

});



/* =========================
點擊連結關閉
========================= */

document.addEventListener("click",function(e){

if(e.target.closest(".menu-overlay a")){

const menu=document.getElementById("menuOverlay");

if(!menu) return;

menu.classList.remove("active");
document.body.style.overflow="";

}

});



/* =========================
ESC 關閉
========================= */

document.addEventListener("keydown",function(e){

const menu=document.getElementById("menuOverlay");

if(!menu) return;

if(e.key==="Escape"){

menu.classList.remove("active");
document.body.style.overflow="";

}

});



/* =========================
Scroll Reveal
========================= */

function revealElements(){

const reveals=document.querySelectorAll(".reveal");

if(!reveals.length) return;

const windowHeight=window.innerHeight;

reveals.forEach(el=>{

const elementTop=el.getBoundingClientRect().top;

if(elementTop < windowHeight-80){

el.classList.add("show");

}

});

}

window.addEventListener("scroll",revealElements,{passive:true});
window.addEventListener("load",revealElements);
window.addEventListener("resize",revealElements);



/* =========================
Header Scroll Blur
========================= */

const header=document.querySelector(".header");

if(header){

window.addEventListener("scroll",()=>{

if(window.scrollY>40){

header.style.background="rgba(255,255,255,.92)";
header.style.backdropFilter="blur(20px)";

}else{

header.style.background="rgba(255,255,255,.75)";
header.style.backdropFilter="blur(18px)";

}

},{passive:true});

}



/* =========================
圖片 fallback
========================= */

document.querySelectorAll("img").forEach(img=>{

img.addEventListener("error",function(){

if(this.dataset.fallbackApplied) return;

this.dataset.fallbackApplied=true;

if(!this.classList.contains("img-placeholder")){

this.src="images/logo-seal.png";

}

this.classList.add("img-placeholder");

});

});
