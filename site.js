// ===== 漢堡 =====
function toggleMenu(){
  const menu = document.getElementById("menu");
  menu.classList.toggle("active");
}

// 點外面關閉（修正版）
document.addEventListener("click", function(e){
  const menu = document.getElementById("menu");
  const btn = document.querySelector(".menu-btn");

  if(!menu || !btn) return;

  if(!menu.contains(e.target) && !btn.contains(e.target)){
    menu.classList.remove("active");
  }
});

// ===== 產品資料 =====
let productsData = [];
let currentIndex = 0;

// 載入產品（防呆版）
fetch("products.json")
.then(res => res.json())
.then(data => {
  productsData = data;
  renderProducts(data);
})
.catch(err => {
  console.error("產品載入失敗", err);
});

// 渲染產品
function renderProducts(data){
  const container = document.getElementById("product-list");
  if(!container) return;

  container.innerHTML = data.map((p,i)=>`
    <div class="product-card" onclick="openModal(${i})">
      <img src="${p.image}" loading="lazy">
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
    </div>
  `).join("");
}

// ===== modal =====
function openModal(index){
  currentIndex = index;
  const p = productsData[index];

  const modal = document.getElementById("modal");
  const body = document.getElementById("modal-body");

  if(!modal || !body) return;

  modal.style.display = "flex";

  body.innerHTML = `
    <h2>${p.name}</h2>

    <img src="${p.image}">

    <p>${p.desc}</p>

    <h3>特色</h3>
    <ul>${p.features.map(f=>`<li>${f}</li>`).join("")}</ul>

    <h3>成分</h3>
    <ul>${p.ingredients.map(i=>`<li>${i}</li>`).join("")}</ul>

    <h3>使用方式</h3>
    <ul>${p.usage.map(u=>`<li>${u}</li>`).join("")}</ul>

    <!-- 成交區 -->
    <div style="margin-top:20px;text-align:center;">
      <a href="https://lin.ee/sHZW7NkR?text=我想了解${encodeURIComponent(p.name)}" 
         class="btn btn-line">
         LINE詢問
      </a>
    </div>

    <!-- 上下產品 -->
    <div style="margin-top:15px;text-align:center;">
      <button onclick="prevProduct()">← 上一個</button>
      <button onclick="nextProduct()">下一個 →</button>
    </div>
  `;

  // 鎖住背景滾動（重要）
  document.body.style.overflow = "hidden";
}

// 關閉 modal
function closeModal(){
  const modal = document.getElementById("modal");
  if(!modal) return;

  modal.style.display = "none";
  document.body.style.overflow = "";
}

// 點背景關閉
document.addEventListener("click", function(e){
  const modal = document.getElementById("modal");
  if(!modal) return;

  if(e.target === modal){
    closeModal();
  }
});

// ESC 關閉（體驗升級）
document.addEventListener("keydown", function(e){
  if(e.key === "Escape"){
    closeModal();
  }
});

// 上一個
function prevProduct(){
  currentIndex = (currentIndex - 1 + productsData.length) % productsData.length;
  openModal(currentIndex);
}

// 下一個
function nextProduct(){
  currentIndex = (currentIndex + 1) % productsData.length;
  openModal(currentIndex);
}
