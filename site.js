/* =========================
DOM Ready
========================= */

document.addEventListener("DOMContentLoaded",()=>{


/* =========================
統一漢堡選單 HTML
========================= */

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


/* =========================
圖片 fallback
========================= */

document.addEventListener("error",(e)=>{

if(e.target.tagName!=="IMG") return;

const img=e.target;

if(img.dataset.fallbackApplied) return;

img.dataset.fallbackApplied=true;

if(!img.classList.contains("img-placeholder")){

img.src="images/logo-seal.png";

}

img.classList.add("img-placeholder");

},true);


});


/* =========================
漢堡選單
========================= */

function toggleMenu(){

const menu=document.getElementById("menuOverlay");

if(!menu) return;

menu.classList.toggle("active");

if(menu.classList.contains("active")){

document.body.style.overflow="hidden";

}else{

document.body.style.overflow="";

}

}



/* =========================
點擊背景關閉
========================= */

document.addEventListener("click",(e)=>{

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

document.addEventListener("click",(e)=>{

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

document.addEventListener("keydown",(e)=>{

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

let ticking=false;

window.addEventListener("scroll",()=>{

if(!ticking){

window.requestAnimationFrame(()=>{

if(window.scrollY>40){

header.style.background="rgba(255,255,255,.92)";
header.style.backdropFilter="blur(20px)";

}else{

header.style.background="rgba(255,255,255,.75)";
header.style.backdropFilter="blur(18px)";

}

ticking=false;

});

ticking=true;

}

},{passive:true});

}
