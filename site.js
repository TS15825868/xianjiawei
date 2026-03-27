function loadHeader() {
  document.getElementById("app-header").innerHTML = `
  <header class="header">
    <a href="index.html" class="logo">
      <img src="images/logo.png">
    </a>

    <div class="menu-btn" onclick="toggleMenu()">☰</div>
  </header>

  <nav id="menu" class="menu">

    <strong>快速開始</strong>
    <a href="recommend.html">👉 快速推薦</a>
    <a href="products.html">產品總覽</a>

    <strong>怎麼開始</strong>
    <a href="choose.html">怎麼選</a>
    <a href="combo.html">推薦套餐</a>

    <strong>內容</strong>
    <a href="knowledge.html">補養知識</a>
    <a href="recipes.html">料理方式</a>
    <a href="videos.html">觀點影片</a>

    <strong>品牌</strong>
    <a href="brand.html">關於我們</a>
    <a href="faq.html">常見問題</a>
    <a href="contact.html">聯絡</a>

  </nav>
  `;
}

function loadFooter() {
  document.getElementById("app-footer").innerHTML = `
  <footer class="footer">
    © 仙加味｜補養是一種節奏
  </footer>
  `;
}

function toggleMenu(){
  document.getElementById("menu").classList.toggle("show");
}

/* 成交 modal */
function openModal(title, img, desc){
  document.getElementById("modal").style.display="flex";
  document.getElementById("modal-title").innerText=title;
  document.getElementById("modal-img").src=img;
  document.getElementById("modal-desc").innerText=desc;

  document.getElementById("line-link").href =
    "https://line.me/R/ti/p/YOURID?text=" +
    encodeURIComponent("我要購買：" + title);
}

function closeModal(){
  document.getElementById("modal").style.display="none";
}

window.onload = function(){
  loadHeader();
  loadFooter();
}
