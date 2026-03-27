// ===== 共用 HEADER =====
document.getElementById("app-header").innerHTML = `
<header class="header">
<div class="logo">仙加味</div>
<div class="menu-btn" onclick="toggleMenu()">☰</div>
</header>

<div id="menu" class="menu-overlay">
<div class="menu-close" onclick="toggleMenu()">✕</div>

<a href="index.html">首頁</a>
<a href="products.html">產品介紹</a>
<a href="choose.html">怎麼選</a>
<a href="combo.html">套餐搭配</a>
<a href="knowledge.html">使用方式</a>
<a href="recipes.html">料理搭配</a>
<a href="videos.html">觀點分享</a>
<a href="brand.html">品牌介紹</a>
<a href="faq.html">FAQ</a>
<a href="contact.html">聯絡我們</a>

<a href="https://lin.ee/sHZW7NkR" class="menu-cta">LINE詢問</a>
</div>
`;

// ===== 共用 FOOTER =====
document.getElementById("app-footer").innerHTML = `
<footer class="footer">
<p>© 仙加味</p>
</footer>

<a href="https://lin.ee/sHZW7NkR" class="floating-line">LINE</a>
`;

// ===== 漢堡 =====
function toggleMenu(){
document.getElementById("menu").classList.toggle("active");
}

document.addEventListener("click",(e)=>{
const menu=document.getElementById("menu");
const btn=document.querySelector(".menu-btn");
if(!menu.contains(e.target)&&!btn.contains(e.target)){
menu.classList.remove("active");
}
});

// ===== Modal（App等級）=====
let scrollY=0;

function openModal(p){

scrollY=window.scrollY;

document.body.style.position="fixed";
document.body.style.top=`-${scrollY}px`;

const modal=document.getElementById("modal");
modal.classList.add("active");

document.getElementById("modal-body").innerHTML=`
<div class="modal-header">
<button onclick="closeModal()">← 返回</button>
<button onclick="closeModal()">✕</button>
</div>

<img src="${p.images[0]}" class="modal-img">

<h2>${p.name}</h2>

<p>${p.desc}</p>

<h3>適合這樣的你</h3>
<ul>${p.target.map(t=>`<li>${t}</li>`).join("")}</ul>

<h3>使用方式</h3>
<p>${p.usage}</p>

<h3>成份</h3>
<p>${p.ingredients.join("、")}</p>

<a href="https://lin.ee/sHZW7NkR?text=${encodeURIComponent(p.lineText)}"
class="btn btn-primary">LINE詢問</a>
`;
}

function closeModal(){
document.getElementById("modal").classList.remove("active");

document.body.style.position="";
window.scrollTo(0,scrollY);
}

// ===== products render =====
fetch("products.json")
.then(r=>r.json())
.then(data=>{
const el=document.getElementById("product-list");
if(!el) return;

el.innerHTML=data.map((p,i)=>`
<div class="card" onclick='openModal(${JSON.stringify(p)})'>
<img src="${p.images[0]}">
<h3>${p.name}</h3>
<p>${p.desc}</p>
</div>
`).join("");
});
