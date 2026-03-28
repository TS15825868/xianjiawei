let products=[];

document.addEventListener("DOMContentLoaded",()=>{

document.getElementById("header").innerHTML=`
<header>
<div class="logo" onclick="location.href='index.html'">
<img src="images/logo.png">
</div>
<button class="menu-btn" onclick="toggleMenu()">☰</button>
</header>

<div id="menu" class="menu">
<a href="index.html">首頁</a>
<a href="products.html">產品</a>
<a href="recommend.html">推薦</a>
<a href="recipes.html">料理</a>
<a href="videos.html">影片</a>
<a href="knowledge.html">觀點</a>
<a href="faq.html">FAQ</a>
<a href="contact.html">聯絡</a>
</div>
`;

fetch("products.json")
.then(r=>r.json())
.then(d=>{
products=d;
renderProducts();
});

});

function toggleMenu(){
document.getElementById("menu").classList.toggle("active");
}

function buy(name){
const text=`我要購買 ${name}\n想了解怎麼搭配`;
window.open(`https://line.me/R/msg/text/?${encodeURIComponent(text)}`);
}

function renderProducts(){
const box=document.getElementById("product-list");
if(!box) return;

products.forEach((p,i)=>{
box.innerHTML+=`
<div class="card">
<img src="${p.images[0]}">
<h3>${p.name}</h3>
<p>${p.desc}</p>
<button onclick="buy('${p.name}')" class="btn-primary">LINE詢問</button>
</div>
`;
});
}
