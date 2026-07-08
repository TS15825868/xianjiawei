(() => {
  const CORE_SRC = 'site-v287-core.js?v=293.0';

  function loadCore() {
    if (document.readyState === 'loading') {
      document.write('<script src="' + CORE_SRC + '"><\/script>');
      return;
    }

    const script = document.createElement('script');
    script.src = CORE_SRC;
    document.head.appendChild(script);
  }

  function normalizeMenu() {
    const panel = document.querySelector('.site-menu__panel');
    if (!panel || panel.dataset.navVersion === '293') return;

    panel.querySelectorAll('.menu-group').forEach(group => group.remove());
    const lineBlock = panel.querySelector('.menu-line-cta');
    const menuHtml = `
      <div class="menu-group">
        <h4>主要導覽</h4>
        <a href="index.html">首頁</a>
        <a href="products.html">產品總覽</a>
        <a href="choose.html">怎麼選</a>
        <a href="guide.html">怎麼使用</a>
        <a href="brand.html">品牌故事</a>
        <a href="faq.html">常見問題</a>
        <a href="contact.html">聯絡我們</a>
      </div>
      <div class="menu-group">
        <h4>更多內容</h4>
        <a href="combo.html">食補搭配</a>
        <a href="recipes.html">料理搭配</a>
        <a href="knowledge.html">漢方知識館</a>
        <a href="hanfang-baike.html">漢方百科</a>
        <a href="video.html">觀點影片</a>
        <a href="dm.html">產品整理</a>
        <a href="sources.html">資料來源</a>
      </div>`;

    if (lineBlock) lineBlock.insertAdjacentHTML('beforebegin', menuHtml);
    panel.dataset.navVersion = '293';
  }

  function normalizeButtons() {
    const directMap = new Map([
      ['這個適合我嗎？', 'LINE 詢問產品'],
      ['怎麼選龜鹿？', 'LINE 幫我比較產品'],
      ['LINE 幫我選用途方向', 'LINE 幫我比較產品'],
      ['LINE 幫我看這組適不適合', 'LINE 詢問搭配方式']
    ]);

    document.querySelectorAll('a.btn-line').forEach(link => {
      const current = link.textContent.trim();
      if (directMap.has(current)) link.textContent = directMap.get(current);
    });

    document.querySelectorAll('.product-card').forEach(card => {
      const name = card.querySelector('h3')?.textContent.trim();
      const link = card.querySelector('a.btn-line');
      if (name && link) link.textContent = `詢問${name}`;
    });

    const menuTitle = document.querySelector('.menu-line-cta__title');
    if (menuTitle) menuTitle.textContent = '官方 LINE 詢問';
  }

  function normalizeDynamicUi() {
    normalizeMenu();
    normalizeButtons();
  }

  function scheduleNormalization() {
    [0, 120, 350, 800, 1600, 3000].forEach(delay => {
      window.setTimeout(normalizeDynamicUi, delay);
    });
  }

  loadCore();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleNormalization, { once: true });
  } else {
    scheduleNormalization();
  }
})();
