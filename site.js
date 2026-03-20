document.addEventListener('DOMContentLoaded',()=>{
const menu=document.getElementById('menuOverlay');
const btn=document.querySelector('.menu-btn');

menu.innerHTML=`<div class="menu-full">
<div onclick="toggleMenu()">✕</div>
<a href="index.html">首頁</a>
<a href="product.html">產品</a>
</div>`;

btn.onclick=()=>toggleMenu();
});

function toggleMenu(){
document.getElementById('menuOverlay').classList.toggle('active');
}
