(function(){

/* ===== 漢堡選單 ===== */
function toggleMenu(force){
  const menu = document.getElementById('menuOverlay');
  if(!menu) return;

  const shouldOpen = typeof force === 'boolean'
    ? force
    : !menu.classList.contains('active');

  menu.classList.toggle('active', shouldOpen);
  document.body.style.overflow = shouldOpen ? 'hidden' : '';
}

window.toggleMenu = toggleMenu;

/* ===== 初始化 ===== */
document.addEventListener('DOMContentLoaded', () => {

  const menu = document.getElementById('menuOverlay');
  const btn = document.querySelector('.menu-btn');

  /* ===== 漢堡內容（全站統一🔥）===== */
  if(menu){
    menu.innerHTML = `
      <a href="index.html">首頁</a>

      <a href="choose.html">怎麼選龜鹿</a>
      <a href="combo.html">套餐推薦</a>
      <a href="how-to-use.html">怎麼使用</a>

      <a href="articles.html">龜鹿知識</a>
      <a href="faq.html">FAQ</a>

      <a href="product.html">產品總覽</a>

      <a href="https://lin.ee/sHZW7NkR">LINE詢問</a>
    `;

    /* 點背景關閉 */
    menu.addEventListener('click',(e)=>{
      if(e.target === menu) toggleMenu(false);
    });

    /* 點連結關閉 */
    menu.querySelectorAll('a').forEach(link=>{
      link.addEventListener('click', ()=>toggleMenu(false));
    });
  }

  /* 漢堡按鈕 */
  if(btn){
    btn.addEventListener('click', ()=>toggleMenu());
  }

  /* ESC 關閉 */
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') toggleMenu(false);
  });

  /* ===== LINE 點擊追蹤（SEO＋轉換🔥）===== */
  document.querySelectorAll('a[href*="lin.ee"]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(typeof gtag === 'function'){
        gtag('event','line_click',{
          event_category:'engagement',
          event_label:'LINE'
        });
      }
    });
  });

});

})();
