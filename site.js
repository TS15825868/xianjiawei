(function(){

function toggleMenu(){
const menu=document.getElementById("menuOverlay");
menu.classList.toggle("active");
}

window.toggleMenu=toggleMenu;

document.addEventListener("DOMContentLoaded",()=>{

const menu=document.getElementById("menuOverlay");
const btn=document.querySelector(".menu-btn");

if(menu){
menu.innerHTML=`
<div class="menu-full">
<div class="menu-close" onclick="toggleMenu()">✕</div>

<div class="menu-block">
<a href="index.html">首頁</a>
<a href="brand.html">品牌</a>
</div>

<div class="menu-block">
<a href="guilu-series.html">龜鹿系列</a>
<a href="choose.html">怎麼選</a>
</div>

<div class="menu-block">
<a href="faq.html">FAQ</a>
</div>

</div>`;
}

if(btn){
btn.addEventListener("click",toggleMenu);
}

});

})();
