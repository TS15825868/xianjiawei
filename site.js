(function(){

/* ===== LINE ===== */
function openLine(msg){
  window.open("https://lin.ee/sHZW7NkR?text=" + encodeURIComponent(msg));
}
window.openLine = openLine;

/* ===== 漢堡控制 ===== */
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

/* ===== 初始化 ===== */
document.addEventListener('DOMContentLoaded',()=>{

  const menu = document.getElementById('menuOverlay');
  const btn = document.querySelector('.menu-btn');

  if(menu){
    menu.innerHTML = `

      <!-- CTA -->
      <a class="menu-cta" onclick="openLine('幫我搭配')">
        👉 官方 LINE 諮詢
      </a>

      <div class="menu-divider"></div>

      <!-- 產品 -->
      <div class="menu-group">產品系列</div>
      <a href="product.html">龜鹿系列</a>
      <a href="qixuan.html">柒玄茶</a>

      <!-- 使用 -->
      <div class="menu-group">怎麼開始</div>
      <a href="choose.html">怎麼選龜鹿</a>
      <a href="how-to-use.html">使用方式</a>
      <a href="recipes.html">料理搭配</a>

      <!-- 知識 -->
      <div class="menu-group">內容知識</div>
      <a href="video.html">影片專區</a>
      <a href="guilu-what.html">龜鹿是什麼</a>
      <a href="guilu-howto.html">龜鹿怎麼吃</a>
      <a href="guilu-recipe.html">龜鹿怎麼煮</a>

      <!-- 品牌 -->
      <div class="menu-group">品牌</div>
      <a href="brand.html">品牌介紹</a>
      <a href="story.html">創始人故事</a>

      <!-- 其他 -->
      <div class="menu-group">其他</div>
      <a href="faq.html">FAQ</a>

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

  if(btn){
    btn.addEventListener('click', ()=>toggleMenu());
  }

  /* ESC關閉 */
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') toggleMenu(false);
  });

});

})();
