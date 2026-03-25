(function(){

function openLine(msg){
  window.open("https://lin.ee/sHZW7NkR?text=" + encodeURIComponent(msg));
}
window.openLine = openLine;

function toggleMenu(force){
  const m = document.getElementById('menuOverlay');
  if(!m) return;

  const open = typeof force === 'boolean'
    ? force
    : !m.classList.contains('active');

  m.classList.toggle('active', open);
  document.body.style.overflow = open ? 'hidden':'';
}
window.toggleMenu = toggleMenu;

document.addEventListener('DOMContentLoaded',()=>{

  const menu = document.getElementById('menuOverlay');

  if(menu){
    menu.innerHTML = `
      <a onclick="openLine('幫我搭配')">👉 官方 LINE 諮詢</a>

      <div class="menu-group">產品系列</div>
      <a href="product.html">龜鹿系列</a>

      <div class="menu-group">使用指南</div>
      <a href="choose.html">怎麼選</a>
      <a href="how-to-use.html">怎麼使用</a>

      <div class="menu-group">內容知識</div>
      <a href="video.html">影片專區</a>
      <a href="articles.html">龜鹿知識</a>

      <div class="menu-group">品牌</div>
      <a href="brand.html">品牌介紹</a>

      <div class="menu-group">其他</div>
      <a href="faq.html">FAQ</a>
    `;
  }

  document.querySelector('.menu-btn')?.addEventListener('click',toggleMenu);

});

})();
