document.addEventListener("DOMContentLoaded",()=>{

  // Header
  document.getElementById("app-header").innerHTML = `
    <header>
      <a href="/xianjiawei/index.html">
        <img src="/xianjiawei/images/logo.png" class="logo">
      </a>
      <button class="menu-btn" onclick="toggleMenu()">☰</button>
    </header>

    <div class="menu" id="menu">
      <a href="/xianjiawei/index.html">首頁</a>
      <a href="/xianjiawei/products.html">產品</a>
      <a href="/xianjiawei/combo.html">怎麼搭配</a>
      <a href="/xianjiawei/recommend.html">幫我配</a>
      <a href="/xianjiawei/knowledge.html">怎麼使用</a>
      <a href="/xianjiawei/recipes.html">料理</a>
      <a href="/xianjiawei/videos.html">影片</a>
      <a href="/xianjiawei/faq.html">FAQ</a>
      <a href="/xianjiawei/contact.html">聯絡</a>
    </div>
  `;

  // Footer
  document.getElementById("app-footer").innerHTML = `
    <div class="card" style="text-align:center;">
      © 仙加味
    </div>
  `;
});

function toggleMenu(){
  document.getElementById("menu").classList.toggle("active");
}


// 🔥 Modal
function openModal(p){
  document.getElementById("modal").classList.add("active");

  document.getElementById("modal-content").innerHTML = `
    <div style="text-align:right">
      <button onclick="closeModal()">✕</button>
    </div>

    <img src="${p.image}">
    <h2>${p.name}</h2>
    <p>${p.desc}</p>

    <p><b>規格：</b>${p.spec}</p>
    <p><b>成分：</b>${p.ingredient}</p>

    <ul>
      ${p.usage.map(u=>`<li>${u}</li>`).join("")}
    </ul>

    <a href="https://lin.ee/sHZW7NkR" class="btn btn-primary">
    我要這個
    </a>
  `;
}

function closeModal(){
  document.getElementById("modal").classList.remove("active");
}
