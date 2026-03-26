// ===== 漢堡 =====
function toggleMenu(){
  document.getElementById("menu").classList.toggle("active");
}

// 點外面關閉
document.addEventListener("click", function(e){
  const menu = document.getElementById("menu");
  if(!menu.contains(e.target) && !e.target.classList.contains("menu-btn")){
    menu.classList.remove("active");
  }
});

// ===== 產品 =====
let productsData = [];
let currentIndex = 0;

fetch("products.json")
.then(res=>res.json())
.then(data=>{
  productsData = data;
  renderProducts(data);
});

function renderProducts(data){
  const container = document.getElementById("product-list");
  if(!container) return;

  container.innerHTML = data.map((p,i)=>`
    <div class="product-card" onclick="openModal(${i})">
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
    </div>
  `).join("");
}

// ===== modal =====
function openModal(index){
  currentIndex = index;
  const p = productsData[index];

  document.getElementById("modal").style.display="flex";

  document.getElementById("modal-body").innerHTML = `
    <h2>${p.name}</h2>
    <img src="${p.image}">

    <p>${p.desc}</p>

    <h3>特色</h3>
    <ul>${p.features.map(f=>`<li>${f}</li>`).join("")}</ul>

    <h3>成分</h3>
    <ul>${p.ingredients.map(i=>`<li>${i}</li>`).join("")}</ul>

    <h3>使用方式</h3>
    <ul>${p.usage.map(u=>`<li>${u}</li>`).join("")}</ul>

    <div class="modal-nav">
      <button onclick="prevProduct()">← 上一個</button>
      <button onclick="nextProduct()">下一個 →</button>
    </div>

    <a href="https://lin.ee/sHZW7NkR" class="btn btn-line">LINE 詢問</a>
  `;
}

function closeModal(){
  document.getElementById("modal").style.display="none";
}

function prevProduct(){
  currentIndex = (currentIndex - 1 + productsData.length) % productsData.length;
  openModal(currentIndex);
}

function nextProduct(){
  currentIndex = (currentIndex + 1) % productsData.length;
  openModal(currentIndex);
}
