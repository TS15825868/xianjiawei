"use strict";

/* 仙加味網站 UX 優化層｜v409.0 */
(function(){
  const VERSION = '409.0';

  ensureStyleSheet();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => waitForBaseShell());
  } else {
    waitForBaseShell();
  }

  function ensureStyleSheet(){
    if (document.querySelector('link[href*="site-ux-v409.css"]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `site-ux-v409.css?v=${VERSION}`;
    document.head.appendChild(link);
  }

  function waitForBaseShell(attempt = 0){
    const shellReady = document.getElementById('menu-drawer') && document.getElementById('site-footer')?.children.length;
    const dataReady = typeof SITE_DATA !== 'undefined' && SITE_DATA;

    if ((!shellReady || !dataReady) && attempt < 100) {
      window.setTimeout(() => waitForBaseShell(attempt + 1), 60);
      return;
    }

    optimizeMenu();
    appendFooterLinks();
    optimizeHomeProducts();
    renderMobileCompareCards();
    initKnowledgeTabs();
    renderVideoLibrary();
  }

  function lineHref(message = '看產品'){
    try {
      if (typeof buildLineAutoLink === 'function') return buildLineAutoLink(message);
    } catch (error) {
      console.warn('LINE 連結產生器暫時無法使用', error);
    }
    return 'https://lin.ee/sHZW7NkR';
  }

  function optimizeMenu(){
    const panel = document.querySelector('#menu-drawer .site-menu__panel');
    if (!panel || panel.dataset.ux409 === 'true') return;

    panel.dataset.ux409 = 'true';
    panel.innerHTML = `
      <button id="menu-close" class="menu-close" type="button" aria-label="關閉選單">✕</button>

      <div class="menu-quick-actions" aria-label="快速入口">
        <a class="btn btn-outline" href="products.html">查看產品</a>
        <a class="btn btn-outline" href="choose.html">幫我挑選</a>
        <a class="btn btn-outline" href="guide.html">怎麼使用</a>
        <a class="btn btn-line" href="${lineHref('看產品')}" target="_blank" rel="noopener">LINE 詢問</a>
      </div>

      <div class="menu-group">
        <h4>主要內容</h4>
        <a href="index.html">首頁</a>
        <a href="products.html">龜鹿系列</a>
        <a href="choose.html">怎麼選</a>
        <a href="guide.html">食用方式</a>
        <a href="recipes.html">料理搭配</a>
      </div>

      <div class="menu-group">
        <h4>知識與品牌</h4>
        <a href="knowledge.html">知識專區</a>
        <a href="brand.html">品牌故事</a>
        <a href="faq.html">常見問題</a>
      </div>

      <div class="menu-group">
        <h4>服務</h4>
        <a href="contact.html">聯絡我們</a>
      </div>

      <div class="menu-contact-card">
        <p class="eyebrow">官方 LINE</p>
        <strong>產品規格、使用與購買資訊</strong>
        <p class="muted">LINE ID：@762jybnm</p>
        <a class="btn btn-line" href="${lineHref('看產品')}" target="_blank" rel="noopener">前往 LINE 詢問</a>
      </div>
    `;
  }

  function appendFooterLinks(){
    const footerCard = document.querySelector('#site-footer .footer-card');
    if (!footerCard || footerCard.querySelector('.footer-policy-links')) return;

    footerCard.insertAdjacentHTML('beforeend', `
      <nav class="footer-policy-links" aria-label="網站資訊">
        <a href="knowledge.html">知識專區</a>
        <a href="video.html">知識影音</a>
        <a href="sources.html">資料來源與引用原則</a>
        <a href="faq.html">常見問題</a>
      </nav>
    `);
  }

  function optimizeHomeProducts(){
    const grid = document.getElementById('home-products');
    if (!grid || grid.dataset.ux409 === 'true') return;

    grid.dataset.ux409 = 'true';
    grid.querySelectorAll('.product-card').forEach(card => {
      const name = card.querySelector('h3')?.textContent?.trim() || '產品';
      const firstAction = card.querySelector('.product-card__actions .btn');
      if (firstAction) {
        firstAction.textContent = '查看介紹';
        firstAction.setAttribute('aria-label', `查看${name}完整介紹`);
      }
    });
  }

  function renderMobileCompareCards(){
    const target = document.getElementById('mobile-compare-cards');
    if (!target || target.dataset.ux409 === 'true') return;

    const rows = Array.from(document.querySelectorAll('.compare-table tbody tr'));
    if (!rows.length) return;

    target.dataset.ux409 = 'true';
    target.innerHTML = rows.map(row => {
      const cells = Array.from(row.children);
      const productCell = cells[0];
      const link = productCell?.querySelector('a');
      const name = link?.textContent?.trim() || productCell?.textContent?.trim() || '';
      const href = link?.getAttribute('href') || 'products.html';
      const purpose = cells[1]?.textContent?.trim() || '';
      const size = cells[2]?.textContent?.trim() || '';
      const fit = cells[3]?.textContent?.trim() || '';

      return `
        <article class="mobile-compare-card">
          <h3>${escapeHtml(name)}</h3>
          <dl>
            <dt>用途</dt><dd>${escapeHtml(purpose)}</dd>
            <dt>規格</dt><dd>${escapeHtml(size)}</dd>
            <dt>適合</dt><dd>${escapeHtml(fit)}</dd>
          </dl>
          <a class="btn btn-outline" href="${escapeAttribute(href)}">查看產品</a>
        </article>
      `;
    }).join('');
  }

  function initKnowledgeTabs(){
    const tabs = Array.from(document.querySelectorAll('[data-knowledge-tab]'));
    const panels = Array.from(document.querySelectorAll('[data-knowledge-panel]'));
    if (!tabs.length || !panels.length) return;

    const allowed = tabs.map(tab => tab.dataset.knowledgeTab);
    const requested = new URLSearchParams(location.search).get('tab');
    const initial = allowed.includes(requested) ? requested : (allowed[0] || 'articles');

    const activate = id => {
      tabs.forEach(tab => {
        const active = tab.dataset.knowledgeTab === id;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });
      panels.forEach(panel => {
        panel.hidden = panel.dataset.knowledgePanel !== id;
      });
    };

    tabs.forEach(tab => {
      tab.addEventListener('click', () => activate(tab.dataset.knowledgeTab));
      tab.addEventListener('keydown', event => {
        if (!['ArrowLeft','ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const current = tabs.indexOf(tab);
        const direction = event.key === 'ArrowRight' ? 1 : -1;
        const next = tabs[(current + direction + tabs.length) % tabs.length];
        next.focus();
        activate(next.dataset.knowledgeTab);
      });
    });

    activate(initial);
  }

  function renderVideoLibrary(){
    if (document.body.dataset.page !== 'video') return;

    const grid = document.getElementById('video-grid');
    const featured = document.getElementById('video-featured');
    const search = document.getElementById('video-search');
    const filters = Array.from(document.querySelectorAll('[data-video-filter]'));
    const count = document.getElementById('video-count');
    const empty = document.getElementById('video-empty');

    if (!grid || !featured || !filters.length) return;

    const videos = Array.isArray(SITE_DATA?.videos) ? SITE_DATA.videos : [];
    const urlCategory = new URLSearchParams(location.search).get('category');
    const knownCategories = filters.map(button => button.dataset.videoFilter);
    let activeCategory = knownCategories.includes(urlCategory) ? urlCategory : '全部';
    let keyword = '';

    const refresh = () => {
      const filtered = videos.filter(video => {
        const categoryMatch = activeCategory === '全部' || video.category === activeCategory;
        const haystack = `${video.title || ''} ${video.category || ''}`.toLowerCase();
        const keywordMatch = !keyword || haystack.includes(keyword);
        return categoryMatch && keywordMatch;
      });

      filters.forEach(button => {
        const active = button.dataset.videoFilter === activeCategory;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });

      if (count) count.textContent = String(filtered.length);
      if (empty) empty.hidden = filtered.length > 0;

      if (!filtered.length) {
        featured.innerHTML = '';
        grid.innerHTML = '';
        return;
      }

      const first = filtered[0];
      featured.innerHTML = renderFeaturedVideo(first);
      grid.innerHTML = filtered.slice(1).map((video, index) => renderVideoCard(video, index + 2)).join('');
    };

    filters.forEach(button => {
      button.addEventListener('click', () => {
        activeCategory = button.dataset.videoFilter || '全部';
        refresh();
      });
    });

    search?.addEventListener('input', event => {
      keyword = String(event.target.value || '').trim().toLowerCase();
      refresh();
    });

    refresh();
  }

  function renderFeaturedVideo(video){
    const title = displayVideoTitle(video);
    const category = video.category || '知識影音';
    return `
      <article class="card video-featured">
        <a class="video-featured__cover" href="${escapeAttribute(video.url || '#')}" target="_blank" rel="noopener" aria-label="觀看${escapeAttribute(title)}">
          <span class="video-play" aria-hidden="true">▶</span>
          <span class="video-cover-label">${escapeHtml(category)}・精選</span>
        </a>
        <div class="video-featured__body">
          <p class="eyebrow">本次精選</p>
          <h2>${escapeHtml(title)}</h2>
          <p>以公開影音補充食材與日常搭配觀點。點擊後開啟原始影片平台，頁面本身不會自動播放。</p>
          <a class="btn btn-outline" href="${escapeAttribute(video.url || '#')}" target="_blank" rel="noopener">觀看原影片</a>
        </div>
      </article>
    `;
  }

  function renderVideoCard(video, index){
    const title = displayVideoTitle(video);
    const category = video.category || '知識影音';
    return `
      <article class="card video-card-v409">
        <a class="video-card-v409__cover" href="${escapeAttribute(video.url || '#')}" target="_blank" rel="noopener" aria-label="觀看${escapeAttribute(title)}">
          <span class="video-play" aria-hidden="true">▶</span>
          <span class="video-cover-label">${escapeHtml(category)}</span>
        </a>
        <div class="video-card-v409__body">
          <p class="eyebrow">影音 ${String(index).padStart(2,'0')}</p>
          <h3>${escapeHtml(title)}</h3>
          <a class="btn btn-outline" href="${escapeAttribute(video.url || '#')}" target="_blank" rel="noopener">觀看影片</a>
        </div>
      </article>
    `;
  }

  function displayVideoTitle(video){
    const raw = String(video?.title || '公開影音').trim();
    return raw
      .replace(/^龜鹿系列日常觀點\s*(\d+)$/u, '龜鹿日常｜第 $1 集')
      .replace(/^鹿茸系列食材觀點\s*(\d+)$/u, '鹿茸食材｜第 $1 集')
      .replace(/^中醫師公開觀點\s*(\d+)$/u, '中醫師觀點｜第 $1 集');
  }

  function escapeHtml(value){
    return String(value ?? '')
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');
  }

  function escapeAttribute(value){
    return escapeHtml(value);
  }
})();
