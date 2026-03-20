(function(){

function getBasePrefix(){
  if(location.pathname.includes('/articles/')) return '../';
  return '';
}

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

document.addEventListener('DOMContentLoaded', () => {

  const prefix = getBasePrefix();
  const menu = document.getElementById('menuOverlay');
  const btn = document.querySelector('.menu-btn');

  if(menu){
    menu.innerHTML = `
      <div class="menu-full">

        <div class="menu-close" onclick="toggleMenu(false)">✕</div>

        <div class="menu-block">
          <a href="${prefix}index.html">首頁</a>
          <a href="${prefix}brand.html">品牌</a>
        </div>

        <div class="menu-block">
          <a href="${prefix}guilu-series.html">龜鹿系列</a>
          <a href="${prefix}choose.html">怎麼選</a>
        </div>

        <div class="menu-block">
          <a href="${prefix}recipes.html">料理</a>
          <a href="${prefix}faq.html">FAQ</a>
        </div>

        <div class="menu-block">
          <a href="https://lin.ee/sHZW7NkR?text=幫我搭配龜鹿">
            👉 幫我搭配
          </a>
        </div>

      </div>
    `;

    menu.addEventListener('click',(e)=>{
      if(e.target === menu) toggleMenu(false);
    });
  }

  if(btn){
    btn.addEventListener('click', ()=>toggleMenu());
  }

});
})();
