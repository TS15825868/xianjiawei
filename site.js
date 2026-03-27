function toggleMenu(){
document.getElementById("menu").classList.toggle("active");
}

document.addEventListener("click", function(e){
const menu = document.getElementById("menu");
const btn = document.querySelector(".menu-btn");

if(menu.classList.contains("active")){
if(!menu.contains(e.target) && !btn.contains(e.target)){
menu.classList.remove("active");
}
}
});

let productsData=[];

fetch("products.json")
.then(res=>res.json())
.then(data=>{
productsData=data;
renderProducts(data);
});

function renderProducts(data){
const el=document.getElementById("product-list");
if(!el) return;

el.innerHTML=data.map((p,i)=>`
<div class="product-card" onclick="openModal(${i})">
<img src="${p.images[0]}">
<h3>${p.name}</h3>
<p>${p.desc}</p>
</div>
`).join("");
}

function openModal(i){
const p=productsData[i];
const modal=document.getElementById("modal");
const body=document.getElementById("modal-body");

modal.style.display="flex";

body.innerHTML=`
<div style="display:flex;justify-content:space-between;">
<h2>${p.name}</h2>
<button onclick="closeModal()" style="font-size:22px;border:none;background:none;">✕</button>
</div>

${p.images.map(img=>`<img src="${img}">`).join("")}

<p>${p.desc}</p>

<h3>規格</h3>
<p>${p.spec}</p>

<h3>成分</h3>
<ul>${p.ingredients.map(i=>`<li>${i}</li>`).join("")}</ul>

<h3>使用方式</h3>
<ul>${p.usage.map(u=>`<li>${u}</li>`).join("")}</ul>

<a href="javascript:void(0)" onclick="closeModal()" class="btn">← 返回</a>

<a href="https://lin.ee/sHZW7NkR?text=${encodeURIComponent(p.lineText)}"
class="btn btn-line">LINE詢問</a>
`;
}

function closeModal(){
document.getElementById("modal").style.display="none";
}

document.addEventListener("click",e=>{
if(e.target.id==="modal"){
closeModal();
}
});

document.addEventListener("keydown",e=>{
if(e.key==="Escape"){
closeModal();
}
});
