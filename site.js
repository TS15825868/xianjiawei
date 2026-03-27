// ===== HEADER =====
function loadHeader(){
  document.getElementById("app-header").innerHTML=`
<header class="header">
  <div class="logo">仙加味</div>
  <div class="menu-btn" onclick="toggleMenu()">☰</div>
</header>

<nav id="menu" class="menu">
  <a href="index.html">首頁</a>
  <a href="products.html">產品</a>
  <a href="choose.html">怎麼選</a>
  <a href="combo.html">搭配</a>
  <a href="recommend.html">推薦</a>
  <a href="knowledge.html">知識</a>
  <a href="brand.html">品牌</a>
  <a href="faq.html">FAQ</a>
  <a href="contact.html">聯絡</a>
</nav>
  `;
}

function toggleMenu(){
  document.getElementById("menu").classList.toggle("show");
}

// ===== FOOTER =====
function loadFooter(){
  document.getElementById("app-footer").innerHTML=`
<footer>© 仙加味</footer>
  `;
}

// ===== LINE =====
function loadLine(){
  const a=document.createElement("a");
  a.href="https://lin.ee/sHZW7NkR";
  a.className="line-btn";
  a.innerText="LINE";
  document.body.appendChild(a);
}

// ===== MODAL =====
function openModal(html){
  const modal=document.getElementById("modal");
  modal.innerHTML=`<div class="modal-content">${html}<br><br><button onclick="closeModal()">關閉</button></div>`;
  modal.classList.add("show");
}

function closeModal(){
  document.getElementById("modal").classList.remove("show");
}

// ===== INIT =====
window.onload=()=>{
  loadHeader();
  loadFooter();
  loadLine();
};
