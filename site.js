"use strict";

/* ===== 漢堡 ===== */
function toggleMenu(){
const menu = document.getElementById("menu");
menu.classList.toggle("active");
}

/* 點外面關閉 */
document.addEventListener("click", function(e){
const menu = document.getElementById("menu");
const btn = document.querySelector(".menu-btn");

if(!menu || !btn) return;

if(!menu.contains(e.target) && !btn.contains(e.target)){
menu.classList.remove("active");
}
});

/* ===== 產品 ===== */
let productsData = [];
let lastScroll = 0;

fetch("products.json")
.then(res=>res.json())
.then(data=>{
productsData = data;
renderSlider(data);
})
.catch(err=>console.log(err));

/* ===== 渲染產品 ===== */
function renderSlider(data){
const el = document.getElementById("product-slider");
if(!el) return;

el.innerHTML = data.map((p,i)=>`
<div class="product-card" onclick="openModal(${i})">

<img src="${p.image}">
<h3>${p.name}</h3>
<p>${p.desc}</p>

<div style="margin-top:10px;">
<span class="btn">查看介紹</span>
</div>

</div>
`).join("");
}

/* ===== Modal ===== */
function openModal(i){
const p = productsData[i];

lastScroll = window.scrollY;

const modal = document.getElementById("modal");
const body = document.getElementById("modal-body");

modal.style.display="flex";

body.innerHTML = `
<span class="back-btn" onclick="closeModal()">← 返回</span>

<h2>${p.name}</h2>

<img src="${p.image}" class="modal-img">

<p>${p.desc}</p>

<h3>規格</h3>
<p>${p.size || "依產品標示"}</p>

<h3>成分</h3>
<ul>
${p.ingredients ? p.ingredients.map(i=>`<li>${i}</li>`).join("") : ""}
</ul>

<h3>使用方式</h3>
<ul>
${p.usage ? p.usage.map(u=>`<li>${u}</li>`).join("") : ""}
</ul>

<div class="modal-cta">
<a href="https://lin.ee/sHZW7NkR?text=${encodeURIComponent(p.lineText || p.name)}"
class="btn btn-line">LINE詢問</a>
</div>
`;

document.body.style.overflow="hidden";
}

/* ===== 關閉 ===== */
function closeModal(){
const modal = document.getElementById("modal");

modal.style.display="none";
document.body.style.overflow="";

window.scrollTo({
top:lastScroll,
behavior:"instant"
});
}

/* ESC 關閉 */
document.addEventListener("keydown", function(e){
if(e.key==="Escape"){
closeModal();
}
});
