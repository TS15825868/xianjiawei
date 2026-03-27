function loadLayout(){

const header = `
<header class="header">
<a href="index.html" class="logo">
<img src="images/logo.png">
</a>
<div class="menu-btn" onclick="toggleMenu()">☰</div>
</header>
`;

const menu = `
<div id="menu" class="menu-overlay">

<div class="menu-inner">

<div class="menu-top">
<div class="menu-close" onclick="toggleMenu()">✕</div>
</div>

<div class="menu-main">
<a href="index.html">首頁</a>
<a href="products.html">產品介紹</a>
<a href="choose.html">怎麼選</a>
<a href="combo.html">套餐搭配</a>
<a href="recipes.html">料理搭配</a>
<a href="knowledge.html">使用指南</a>
<a href="brand.html">品牌故事</a>
<a href="faq.html">FAQ</a>
<a href="contact.html">聯絡</a>
</div>

<div class="menu-bottom">
<p>需要幫你搭配？</p>
<a href="https://lin.ee/sHZW7NkR" class="menu-line-btn">
LINE直接詢問
</a>
</div>

</div>

</div>
`;

const footer = `
<footer class="footer">
<p>© 仙加味</p>
<p class="footer-sub">萬華起家・延續鹿角工序</p>
<a href="https://lin.ee/sHZW7NkR">LINE聯絡</a>
</footer>
`;

document.body.insertAdjacentHTML("afterbegin", header + menu);
document.body.insertAdjacentHTML("beforeend", footer);

}

document.addEventListener("DOMContentLoaded", loadLayout);
