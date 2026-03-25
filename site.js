(function(){

/* ===== LINE 快速導流🔥 ===== */
function openLine(msg){
  const base = "https://lin.ee/sHZW7NkR";
  window.open(base + "?text=" + encodeURIComponent(msg));
}
window.openLine = openLine;

/* ===== 漢堡選單 ===== */
function toggleMenu(force){
  const menu = document.getElementById('menuOverlay');
  if(!menu) return;

  const open = typeof force === 'boolean'
    ? force
    : !menu.classList.contains('active');

  menu.classList.toggle('active', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
window.toggleMenu = toggleMenu;

/* ===== 初始化 ===== */
document.addEventListener('DOMContentLoaded', () => {

  const menu = document.getElementById('menuOverlay');

  if(menu){
    menu.innerHTML = `
      <a onclick="openLine('幫我搭配')">👉 直接幫我配</a>

      <a href="index.html">首頁</a>
      <a href="product.html">產品總覽</a>
      <a href="choose.html">怎麼選龜鹿</a>
      <a href="combo.html">套餐推薦</a>
      <a href="how-to-use.html">怎麼使用</a>
      <a href="articles.html">龜鹿知識</a>
      <a href="faq.html">FAQ</a>
    `;

    menu.addEventListener('click',(e)=>{
      if(e.target === menu) toggleMenu(false);
    });

    menu.querySelectorAll('a').forEach(a=>{
      a.addEventListener('click',()=>toggleMenu(false));
    });
  }

  document.querySelector('.menu-btn')?.addEventListener('click',toggleMenu);

});

})();
