document.addEventListener("DOMContentLoaded",()=>{
  initMenu();
  initScroll();
  loadProducts();
});

/* ======================
   漢堡選單（分類）
====================== */
function initMenu(){
  const btn=document.getElementById("menu-btn");
  const menu=document.getElementById("menu");

  if(!btn||!menu)return;

  menu.innerHTML=`
    <div class="menu-inner">
      <a href="index.html">首頁</a>

      <div class="menu-group">
        <span>產品</span>
        <a href="products.html">龜鹿系列</a>
      </div>

      <div class="menu-group">
        <span>使用指南</span>
        <a href="guide.html">怎麼使用</a>
        <a href="recipes.html">料理搭配</a>
      </div>

      <div class="menu-group">
        <span>品牌</span>
        <a href="brand.html">品牌故事</a>
      </div>

      <a href="faq.html">常見問題</a>
      <a href="contact.html">聯絡我們</a>
    </div>
  `;

  btn.onclick=()=>menu.classList.toggle("open");

  document.addEventListener("click",(e)=>{
    if(!menu.contains(e.target)&&!btn.contains(e.target)){
      menu.classList.remove("open");
    }
  });
}

/* ======================
   Scroll Reveal
====================== */
function initScroll(){
  const items=document.querySelectorAll(".reveal");

  window.addEventListener("scroll",()=>{
    items.forEach(el=>{
      if(el.getBoundingClientRect().top < window.innerHeight-80){
        el.classList.add("show");
      }
    });
  });
}

/* ======================
   產品
====================== */
function loadProducts(){
  const list=document.getElementById("product-scroll")||document.getElementById("product-list");
  if(!list)return;

  fetch("data.json?v="+Date.now())
  .then(r=>r.json())
  .then(d=>{
    d.products.forEach(p=>{
      const div=document.createElement("div");
      div.className="card reveal";

      div.innerHTML=`
        <img src="${p.image}">
        <h3>${p.name}</h3>
        <p>${p.description}</p>
      `;

      div.onclick=()=>openModal(p);

      list.appendChild(div);
    });
  });
}

/* ======================
   Modal（成交版）
====================== */
function openModal(p){
  const m=document.getElementById("modal");
  const c=document.getElementById("modal-content");

  c.innerHTML=`
    <div class="modal-header">
      <h2>${p.name}</h2>
      <button onclick="closeModal()">關閉</button>
    </div>

    <img src="${p.image}">

    <p>${p.description}</p>

    <h4>成分</h4>
    <ul>${p.ingredients.map(i=>`<li>${i}</li>`).join("")}</ul>

    <h4>使用方式</h4>
    <ul>${p.usage.map(i=>`<li>${i}</li>`).join("")}</ul>

    <p class="size">${p.size}</p>

    <a class="btn-line" href="https://lin.ee/sHZW7NkR">LINE 諮詢</a>
  `;

  m.classList.add("show");
}

function closeModal(){
  document.getElementById("modal").classList.remove("show");
}
