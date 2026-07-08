(() => {
  const CORE_SRC = 'site-v287-core.js?v=288.0';
  const LINE_URL = 'https://line.me/R/oaMessage/%40762jybnm/?' + encodeURIComponent('我想詢問仙加味全系列產品與下單方式。');

  function injectLaunchBanner() {
    if (document.querySelector('[data-live-launch="v288"]')) return;

    const style = document.createElement('style');
    style.setAttribute('data-live-launch-style', 'v288');
    style.textContent = `
      .site-launch-bar{position:relative;z-index:30;background:linear-gradient(135deg,#7b1e1e,#9b2b26);color:#fff;border-bottom:1px solid rgba(255,255,255,.18)}
      .site-launch-bar__inner{max-width:1180px;margin:0 auto;padding:11px 22px;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;text-align:center;font-size:14px;line-height:1.55}
      .site-launch-bar__inner strong{font-size:15px;letter-spacing:.02em}
      .site-launch-bar__inner span{color:rgba(255,255,255,.92)}
      .site-launch-bar__inner a{display:inline-flex;align-items:center;justify-content:center;min-height:34px;padding:6px 14px;border-radius:999px;background:#fff;color:#7b1e1e;font-weight:800;text-decoration:none;box-shadow:0 4px 12px rgba(0,0,0,.12)}
      .site-launch-bar__inner a:hover{transform:translateY(-1px)}
      @media(max-width:720px){.site-launch-bar__inner{padding:10px 14px;gap:6px}.site-launch-bar__inner strong,.site-launch-bar__inner span{width:100%}.site-launch-bar__inner a{margin-top:3px}}
    `;
    document.head.appendChild(style);

    const banner = document.createElement('section');
    banner.className = 'site-launch-bar';
    banner.dataset.liveLaunch = 'v288';
    banner.setAttribute('aria-label', '全系列開放下單通知');
    banner.innerHTML = `
      <div class="site-launch-bar__inner">
        <strong>全系列已開放詢問與下單</strong>
        <span>產品盒裝到貨後，將依訂單順序確認並安排出貨。</span>
        <a href="${LINE_URL}" target="_blank" rel="noopener">LINE 詢問與下單</a>
      </div>`;

    const header = document.getElementById('site-header');
    if (header && header.parentNode) {
      header.insertAdjacentElement('afterend', banner);
    } else {
      document.body.insertAdjacentElement('afterbegin', banner);
    }
  }

  if (document.readyState === 'loading') {
    document.write('<script src="' + CORE_SRC + '"><\\/script>');
    document.addEventListener('DOMContentLoaded', injectLaunchBanner, { once: true });
  } else {
    const script = document.createElement('script');
    script.src = CORE_SRC;
    script.onload = injectLaunchBanner;
    document.head.appendChild(script);
  }
})();
