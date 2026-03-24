(function(){

function getBasePrefix(){
  return location.pathname.includes('/articles/') ? '../' : '';
}

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

/* ===== 文章卡 ===== */
function articleCard(article, prefix=''){
  const href = `${prefix}articles/${article.url}`;
  const image = article.image.startsWith('images/')
    ? `${prefix}${article.image}`
    : article.image;

  return `
  <a href="${href}" class="product-card">
    <img src="${image}" alt="${article.title}" loading="lazy">
    <h3>${article.title}</h3>
    <p>${article.summary || '查看內容'}</p>
  </a>`;
}

document.addEventListener('DOMContentLoaded', () => {

  const prefix = getBasePrefix();
  const menu = document.getElementById('menuOverlay');
  const btn = document.querySelector('.menu-btn');

  /* ===== 漢堡內容（封頂完整版🔥）===== */
  if(menu){
    menu.innerHTML = `

      <a href="${prefix}index.html">首頁</a>

      <div class="menu-group">
        <div class="menu-title">了解</div>
        <a href="${prefix}brand.html">品牌故事</a>
        <a href="${prefix}guilu-series.html">龜鹿系列</a>
        <a href="${prefix}choose.html">怎麼選龜鹿</a>
      </div>

      <div class="menu-group">
        <div class="menu-title">使用</div>
        <a href="${prefix}how-to-use.html">怎麼使用</a>
        <a href="${prefix}recipes.html">料理補養</a>
      </div>

      <div class="menu-group">
        <div class="menu-title">內容</div>
        <a href="${prefix}articles.html">龜鹿知識</a>
        <a href="${prefix}faq.html">FAQ</a>
      </div>

      <div class="menu-group">
        <div class="menu-title">產品</div>
        <a href="${prefix}product.html">產品總覽</a>
        <a href="${prefix}combo.html">套餐推薦</a>
      </div>

      <a href="https://lin.ee/sHZW7NkR?text=我想了解龜鹿怎麼選"
      class="btn btn-line">
        LINE詢問 →
      </a>
    `;

    menu.addEventListener('click',(e)=>{
      if(e.target === menu) toggleMenu(false);
    });

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
  if('IntersectionObserver' in window){
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('show');
          obs.unobserve(entry.target);
        }
      });
    });
    revealEls.forEach(el=>obs.observe(el));
  }

  /* ===== 圖片lazy優化 ===== */
  document.querySelectorAll('img').forEach(img=>{
    img.setAttribute('loading','lazy');
    img.onload = ()=> img.classList.add('loaded');
  });

  /* ===== LINE成交追蹤🔥 ===== */
  document.querySelectorAll('a[href*="lin.ee"]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      if(typeof gtag === 'function'){
        gtag('event','line_click',{
          event_category:'conversion',
          event_label: location.pathname
        });
      }
    });
  });

});
})();
