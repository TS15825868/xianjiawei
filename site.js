function loadHeader() {
  document.getElementById("app-header").innerHTML = `
  <header class="header">

    <a href="index.html" class="logo">
      <img src="images/logo.png">
    </a>

    <div class="menu-btn" onclick="toggleMenu()">☰</div>

  </header>

  <nav id="menu" class="menu">

    <a href="index.html">首頁</a>

    <strong>快速開始</strong>
    <a href="recommend.html">👉 幫我配（最快）</a>
    <a href="choose.html">怎麼選</a>

    <strong>產品</strong>
    <a href="products.html">全部產品</a>
    <a href="combo.html">推薦套餐</a>

    <strong>內容</strong>
    <a href="knowledge.html">補養觀念</a>
    <a href="recipes.html">料理方式</a>
    <a href="videos.html">觀點影片</a>

    <strong>品牌</strong>
    <a href="brand.html">品牌介紹</a>
    <a href="faq.html">常見問題</a>
    <a href="contact.html">聯絡我們</a>

  </nav>
  `;
}

function loadFooter() {
  document.getElementById("app-footer").innerHTML = `
  <footer class="footer">
    © 仙加味｜補養是一種節奏
  </footer>

  <a class="line-btn" href="https://lin.ee/sHZW7NkR">LINE</a>
  `;
}

function toggleMenu() {
  document.getElementById("menu").classList.toggle("show");
}

/* 彈窗成交 */
function openModal(title, img, desc){
  document.getElementById("modal").style.display="flex";
  document.getElementById("modal-title").innerText=title;
  document.getElementById("modal-img").src=img;
  document.getElementById("modal-desc").innerText=desc;

  document.getElementById("line-link").href =
    "https://line.me/R/ti/p/@762jybnm?text=" +
    encodeURIComponent("我要購買：" + title);
}

function closeModal(){
  document.getElementById("modal").style.display="none";
}

window.onload = function () {
  if (document.getElementById("app-header")) loadHeader();
  if (document.getElementById("app-footer")) loadFooter();
};
