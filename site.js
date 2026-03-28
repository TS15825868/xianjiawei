let products=[];

document.addEventListener("DOMContentLoaded",()=>{

// header
document.getElementById("header").innerHTML = `
<header>
<div class="logo" onclick="location.href='index.html'">
<img src="images/logo.png">
</div>

<button class="menu-btn" onclick="toggleMenu()">☰</button>
</header>

<div id="menu" class="menu">
<a href="index.html">首頁</a>
<a href="products.html">產品</a>
<a href="recommend.html">快速推薦</a>
<a href="combo.html">搭配</a>
<a href="recipes.html">料理</a>
<a href="videos.html">影片</a>
<a href="faq.html">FAQ</a>
<a href="contact.html">聯絡</a>
</div>
`;

// 載入產品
fetch("products.json")
.then(res=>res.json())
.then(data=>{
products=data;
renderProducts();
});

});

// menu
function toggleMenu(){
document.getElementById("menu").classList.toggle("active");
}

// LINE成交
function buy(name){
const text=`我要購買 ${name}`;
window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`);
}

// modal
function openModal(i){

const p=products[i];

document.getElementById("modal").classList.add("active");

document.getElementById("modal").innerHTML=`
<div class="modal-content">

<button onclick="closeModal()">✕</button>

<div class="gallery">
${p.images.map(img=>`<img src="${img}">`).join("")}
</div>

<h2>${p.name}</h2>
<p>${p.desc}</p>

<p><b>規格：</b>${p.spec}</p>
<p><b>成分：</b>${p.ingredient}</p>

<ul>
${p.usage.map(u=>`<li>${u}</li>`).join("")}
</ul>

<p>${p.target}</p>

<button class="btn-primary" onclick="buy('${p.name}')">
LINE詢問
</button>

</div>
`;
}

function closeModal(){
document.getElementById("modal").classList.remove("active");
}

// 渲染產品
function renderProducts(){

const container=document.getElementById("product-list");
if(!container) return;

products.forEach((p,i)=>{

const div=document.createElement("div");
div.className="card";

div.innerHTML=`
<img src="${p.images[0]}">
<h3>${p.name}</h3>
<p>${p.desc}</p>
<button class="btn" onclick="openModal(${i})">查看</button>
`;

container.appendChild(div);

});

}
