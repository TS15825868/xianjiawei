function loadHeader(){
  document.getElementById("app-header").innerHTML = `
  <header class="header">
    <div class="logo">
      <img src="images/logo.png">
    </div>
    <div class="menu-btn" onclick="toggleMenu()">☰</div>
  </header>

  <nav id="menu" class="menu">

    <a href="index.html">首頁</a>

    <strong style="padding:10px">產品</strong>
    <a href="products.html">產品總覽</a>
    <a href="combo.html">推薦組合</a>

    <strong style="padding:10px">開始使用</strong>
    <a href="choose.html">怎麼選</a>
    <a href="recommend.html">快速推薦</a>

    <strong style="padding:10px">內容</strong>
    <a href="knowledge.html">補養知識</a>
    <a href="recipes.html">料理方式</a>
    <a href="videos.html">觀點影片</a>

    <strong style="padding:10px">品牌</strong>
    <a href="brand.html">關於我們</a>
    <a href="faq.html">常見問題</a>
    <a href="contact.html">聯絡</a>

  </nav>
  `;
}

function toggleMenu(){
  document.getElementById("menu").classList.toggle("show");
}

function loadFooter(){
  document.getElementById("app-footer").innerHTML = `
  <footer>© 仙加味｜補養是一種節奏</footer>
  `;
}

function loadLine(){
  const btn=document.createElement("a");
  btn.href="https://lin.ee/sHZW7NkR";
  btn.className="line-btn";
  btn.innerText="LINE";
  document.body.appendChild(btn);
}

window.onload=()=>{
  loadHeader();
  loadFooter();
  loadLine();
}
