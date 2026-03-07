
(function(){
  'use strict';

  const CURRENT = (location.pathname.split('/').pop() || 'index.html');

  const NAV_GROUPS = [
    {
      title: '產品',
      links: [
        ['guilu-series.html', '龜鹿系列'],
        ['products.html', '產品總覽'],
        ['choose.html', '怎麼挑龜鹿']
      ]
    },
    {
      title: '龜鹿知識',
      links: [
        ['what-is-guilu.html', '龜鹿是什麼'],
        ['ingredients.html', '食材介紹'],
        ['guilu-howto-eat.html', '食用方式'],
        ['pairing.html', '怎麼搭配'],
        ['seasons.html', '四季建議'],
        ['guilu-recipes.html', '料理食譜'],
        ['videos.html', '知識影片']
      ]
    },
    {
      title: '品牌',
      links: [
        ['brand-story.html', '品牌故事'],
        ['brand-origin.html', '品牌由來'],
        ['founder.html', '創始人故事'],
        ['about.html', '關於我們']
      ]
    },
    {
      title: '客服',
      links: [
        ['faq.html', '常見問題'],
        ['contact.html', '聯絡我們'],
        ['line.html', 'LINE 詢問']
      ]
    }
  ];

  function ensureOverlay(){
    let overlay = document.getElementById('overlay');
    if(!overlay){
      overlay = document.createElement('div');
      overlay.id = 'overlay';
      overlay.className = 'overlay';
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  function normalizeLinks(){
    document.querySelectorAll('[href="usage.html"]').forEach(a => a.setAttribute('href', 'guilu-howto-eat.html'));
    document.querySelectorAll('[src="usage.html"]').forEach(a => a.setAttribute('src', 'guilu-howto-eat.html'));
    document.querySelectorAll('a[href="javascript:void(0)"]').forEach(a => {
      a.setAttribute('role', 'button');
      a.setAttribute('href', '#');
    });
  }

  function isActive(href){
    return CURRENT === href;
  }

  function renderDrawer(){
    let drawer = document.getElementById('drawer');
    if(!drawer) return;

    const groupsHtml = NAV_GROUPS.map(group => {
      const links = group.links.map(([href,label]) => {
        const cls = isActive(href) ? 'drawer-link is-current' : 'drawer-link';
        return `<a class="${cls}" href="${href}">${label}</a>`;
      }).join('');

      return `
        <section class="drawer-panel">
          <div class="drawer-panel__title">${group.title}</div>
          <div class="drawer-links">${links}</div>
        </section>`;
    }).join('');

    drawer.setAttribute('aria-hidden','true');
    drawer.innerHTML = `
      <div class="drawer-top">
        <div class="drawer-title">仙加味・龜鹿</div>
        <button class="drawer-close" type="button" aria-label="關閉選單">✕</button>
      </div>
      <div class="drawer-scroll">
        <a class="drawer-home ${isActive('index.html') ? 'is-current' : ''}" href="index.html">首頁</a>
        ${groupsHtml}
        <div class="drawer-cta">
          <a class="btn line btn-wide" href="line.html">LINE 詢問</a>
        </div>
        <div class="drawer-end"></div>
      </div>`;
  }

  function renderTopnav(){
    const nav = document.querySelector('.topnav');
    if(!nav) return;

    const groupsHtml = NAV_GROUPS.map(group => {
      const first = group.links[0];
      const active = group.links.some(([href]) => isActive(href)) ? ' is-current' : '';
      const drop = group.links.map(([href,label]) => `<a href="${href}" class="${isActive(href) ? 'is-current' : ''}" role="menuitem">${label}</a>`).join('');
      return `<li class="nav-item has-drop${active}"><a href="${first[0]}">${group.title}</a><div class="drop" role="menu">${drop}</div></li>`;
    }).join('');

    nav.innerHTML = `<ul>
      <li class="nav-item ${isActive('index.html') ? 'is-current' : ''}"><a href="index.html">首頁</a></li>
      ${groupsHtml}
    </ul>`;
  }



  function syncMobileNavState(){
    const mobile = window.matchMedia('(max-width: 980px)').matches;
    document.querySelectorAll('.topnav').forEach(nav => {
      if(mobile){
        nav.setAttribute('aria-hidden','true');
      }else{
        nav.removeAttribute('aria-hidden');
      }
    });
  }

  function bindMenu(){
    const drawer = document.getElementById('drawer');
    const overlay = ensureOverlay();
    if(!drawer) return;

    const closeBtn = drawer.querySelector('.drawer-close');
    if(closeBtn){
      closeBtn.addEventListener('click', () => toggleMenu(false));
    }

    overlay.addEventListener('click', () => toggleMenu(false));

    document.querySelectorAll('.hamburger').forEach(btn => {
      btn.addEventListener('click', () => toggleMenu(true));
    });

    drawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => toggleMenu(false));
    });
  }

  function bindVideoButtons(){
    document.addEventListener('click', (e)=>{
      const btn = e.target.closest('.video-load');
      if(!btn) return;
      const wrap = btn.closest('.video-embed');
      if(!wrap) return;
      const videoId = wrap.getAttribute('data-video-id');
      if(!videoId) return;
      wrap.innerHTML = `<iframe class="video-frame" src="https://www.tiktok.com/embed/v2/${videoId}" allowfullscreen loading="lazy"></iframe>`;
    });
  }

  function ensureLineFloat(){
    if(document.querySelector('.line-float')) return;
    const a = document.createElement('a');
    a.className = 'line-float';
    a.href = 'line.html';
    a.setAttribute('aria-label', 'LINE 詢問');
    a.innerHTML = '<span class="line-float__text">LINE</span>';
    document.body.appendChild(a);
  }

  function syncCurrentPageState(){
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if(!href || href.startsWith('http') || href.startsWith('#')) return;
      const file = href.split('?')[0].split('#')[0];
      if(file === CURRENT){
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  window.toggleMenu = function(open){
    const drawer = document.getElementById('drawer');
    const overlay = ensureOverlay();
    if(!drawer || !overlay) return;

    const willOpen = (typeof open === 'boolean') ? open : !drawer.classList.contains('open');
    drawer.classList.toggle('open', willOpen);
    overlay.classList.toggle('open', willOpen);
    drawer.setAttribute('aria-hidden', willOpen ? 'false' : 'true');
    document.body.classList.toggle('menu-open', willOpen);
    document.documentElement.classList.toggle('menu-open', willOpen);
  };

  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') toggleMenu(false);
  });

  window.addEventListener('resize', syncMobileNavState);

  document.addEventListener('DOMContentLoaded', ()=>{
    normalizeLinks();
    renderDrawer();
    renderTopnav();
    bindMenu();
    syncMobileNavState();
    bindVideoButtons();
    ensureLineFloat();
    syncCurrentPageState();
  });
})();
