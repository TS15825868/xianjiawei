(function(){

function getBasePrefix(){
  return location.pathname.includes('/articles/') ? '../' : '';
}

/* ===== 漢堡開關 ===== */
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

/* ===== 文章卡片 ===== */
function articleCard(article, prefix=''){
  const href = `${prefix}articles/${article.url}`;
  const image = article.image.startsWith('images/')
    ? `${prefix}${article.image}`
    : article.image;

  return `
  <a href="${href}" class="product-card scroll-card">
    <img src="${image}" alt="${article.title}" loading="lazy">
    <h3>${article.title}</h3>
    <p>${article.summary || '查看內容'}</p>
  </a>`;
}

document.addEventListener('DOMContentLoaded', () => {

  const prefix = getBasePrefix();
  const menu = document.getElementById('menuOverlay');
  const btn = document.querySelector('.menu-btn');

  /* ===== 漢堡選單（封頂完整版🔥）===== */
  if(menu){
    menu.innerHTML = `

      <a href="${prefix}index.html">首頁</a>

      <div class="menu-group">
        <div class="menu-title">了解龜鹿</div>
        <a href="${prefix}brand.html">品牌故事</a>
        <a href="${prefix}guilu-series.html">龜鹿系列</a>
        <a href="${prefix}choose.html">怎麼選龜鹿</a>
      </div>

      <div class="menu-group">
        <div class="menu-title">使用方式</div>
        <a href="${prefix}how-to-use.html">怎麼使用</a>
        <a href="${prefix}recipes.html">料理補養</a>
      </div>

      <div class="menu-group">
        <div class="menu-title">內容知識</div>
        <a href="${prefix}articles.html">龜鹿知識</a>
        <a href="${prefix}faq.html">常見問題</a>
      </div>

      <div class="menu-group">
        <div class="menu-title">產品專區</div>
        <a href="${prefix}product.html">產品總覽</a>
        <a href="${prefix}product.html?id=guilu-gao">龜鹿膏</a>
        <a href="${prefix}product.html?id=guilu-drink">龜鹿飲</a>
        <a href="${prefix}product.html?id=guilu-block">龜鹿湯塊</a>
        <a href="${prefix}product.html?id=antler-powder">鹿茸粉</a>
      </div>

      <a href="https://lin.ee/sHZW7NkR?text=${encodeURIComponent('我想了解龜鹿怎麼選')}" class="btn btn-line">
        LINE詢問 →
      </a>
    `;

    /* 點背景關閉 */
    menu.addEventListener('click',(e)=>{
      if(e.target === menu) toggleMenu(false);
    });

    /* 點選連結關閉 */
    menu.querySelectorAll('a').forEach(link=>{
      link.addEventListener('click', ()=>toggleMenu(false));
    });
  }

  if(btn){
    btn.addEventListener('click', ()=>toggleMenu());
  }

  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') toggleMenu(false);
  });

  /* ===== 滾動動畫 ===== */
  const revealEls = document.querySelectorAll('.reveal');

  if('IntersectionObserver' in window && revealEls.length){
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('show');
          obs.unobserve(entry.target);
        }
      });
    },{threshold:.14});

    revealEls.forEach(el=>obs.observe(el));
  }else{
    revealEls.forEach(el=>el.classList.add('show'));
  }

  /* ===== 文章系統 ===== */
  if(typeof ARTICLES !== 'undefined' && Array.isArray(ARTICLES)){

    const articleGrid = document.getElementById('article-grid');

    if(articleGrid){
      articleGrid.innerHTML =
        ARTICLES.slice(0,12)
        .map(article => articleCard(article, prefix))
        .join('');
    }

    ['culture','knowledge','product','recipe'].forEach(cat=>{
      const node = document.getElementById(`article-grid-${cat}`);
      if(node){
        node.innerHTML =
          ARTICLES
          .filter(a=>a.category===cat)
          .map(article => articleCard(article, prefix))
          .join('');
      }
    });
  }

  /* ===== 導流按鈕 ===== */
  document.querySelectorAll('.choose-btn[data-product]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.getAttribute('data-product');
      if(id){
        location.href = `${prefix}product.html?id=${encodeURIComponent(id)}`;
      }
    });
  });

});
})();
