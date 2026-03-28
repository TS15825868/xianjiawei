let DATA = {};

document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("/data.json");
  DATA = await res.json();

  document.getElementById("header").innerHTML = renderHeader();
  renderProducts();
  initModal();
});

/* HEADER */
function renderHeader(){
  return `
  <div class="header">
    <img src="/images/logo.png" class="logo">
    <div class="menu-btn" onclick="toggleMenu()">☰</div>
  </div>
  <div id="menu" class="menu">
    <a href="/index.html">首頁</a>
    <a href="/products.html">產品</a>
    <a href="/recommend.html">怎麼選</a>
    <a href="/recipes.html">料理</a>
    <a href="/knowledge.html">知識</a>
    <a href="/videos.html">影片</a>
    <a href="/faq.html">FAQ</a>
    <a href="/contact.html">聯絡</a>
  </div>
  `;
}

function toggleMenu(){
  document.getElementById("menu").classList.toggle("open");
}

/* 產品卡片 */
function renderProducts(){
  const el = document.getElementById("products");

  if(!el) return;

  el.innerHTML = DATA.products.map((p,i)=>`
    <div class="card" onclick="openProduct(${i})">
      <img src="${p.images[0]}" width="100%">
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
    </div>
  `).join("");
}

/* Modal 初始化 */
function initModal(){
  document.body.insertAdjacentHTML("beforeend",`
    <div id="modal" class="modal">
      <div class="modal-content" id="modalContent"></div>
    </div>
  `);

  document.getElementById("modal").addEventListener("click", e=>{
    if(e.target.id==="modal") closeModal();
  });

  document.addEventListener("keydown", e=>{
    if(e.key==="Escape") closeModal();
  });
}

/* 開啟產品 */
function openProduct(i){
  const p = DATA.products[i];

  document.getElementById("modal").classList.add("show");

  document.getElementById("modalContent").innerHTML = `
    <div class="modal-close" onclick="closeModal()">✕ 關閉</div>

    <img src="${p.images[0]}" class="modal-img">

    <h2>${p.name}</h2>
    <p class="modal-desc">${p.desc}</p>

    <div class="toc">
      <a href="#usage">使用方式</a>
      <a href="#ingredient">成分</a>
      <a href="#cta">了解更多</a>
    </div>

    <section id="usage">
      <h3>使用方式</h3>
      <ul>
        ${p.usage.map(u=>`<li>${u}</li>`).join("")}
      </ul>
    </section>

    <section id="ingredient">
      <h3>成分</h3>
      <p>${p.ingredient}</p>
    </section>

    <section id="cta">
      <h3>想了解適合你的方式？</h3>
      <button class="btn-primary"
        onclick="goLINE('${p.name}')">
        LINE 諮詢
      </button>
    </section>
  `;
}

/* 關閉 */
function closeModal(){
  document.getElementById("modal").classList.remove("show");
}

/* LINE */
function goLINE(name){
  const msg = `我想了解【${name}】

👉 我的狀況：
👉 想了解搭配`;

  window.open(`https://line.me/R/msg/text/?${encodeURIComponent(msg)}`);
}
