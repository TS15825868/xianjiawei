'use strict';

/**
 * Home page modal opener (v8.3)
 * - Opens product modal from homepage featured card
 * Data source: products.json
 */

(function () {
  // Bind to any clickable element on the home page.
  const triggers = () => Array.from(document.querySelectorAll('[data-home-open]'));
  if (triggers().length === 0) return;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  let flat = [];
  let raw = null;
  let modalEl = null;

  function flatten(data) {
    const out = [];
    (data.categories || []).forEach(cat => {
      (cat.items || []).forEach(it => out.push({ ...it, _catId: cat.id, _catName: cat.name }));
    });
    return out;
  }

  function ensureModal() {
    if (modalEl) return;

    modalEl = document.createElement('div');
    modalEl.className = 'modal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-hidden', 'true');
    modalEl.innerHTML = `
      <div class="modal-backdrop" data-close></div>
      <div class="modal-card" role="document">
        <div class="modal-top">
          <div class="modal-title" id="modalTitle">產品規格</div>
          <button class="modal-close" type="button" data-close aria-label="關閉">×</button>
        </div>
        <div class="modal-body" id="modalBody"></div>
        <div class="modal-bottom">
          <a class="btn" href="contact.html">立即詢問</a>
          <button class="btn ghost" type="button" data-close>返回</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalEl);

    modalEl.addEventListener('click', (e) => {
      const t = e.target;
      if (t && t.hasAttribute && t.hasAttribute('data-close')) closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalEl.classList.contains('is-open')) closeModal();
    });
  }

  function openModal(item) {
    ensureModal();
    const titleEl = modalEl.querySelector('#modalTitle');
    const bodyEl = modalEl.querySelector('#modalBody');

    const img = (item.images && item.images[0]) ? item.images[0] : 'images/product-guiku-main.jpg';

    const specs = (item.specs && item.specs.length)
      ? `<div class="specs">${item.specs.map(s => `
          <div class="spec">
            <div class="k">${esc(s.k)}</div>
            <div class="v">${esc(s.v)}</div>
          </div>
        `).join('')}</div>`
      : '';

    const highlights = (item.highlights && item.highlights.length)
      ? `<div class="section">
           <div class="section-title">重點特色</div>
           <ul class="bullets">${item.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
         </div>` : '';

    const suggest = (item.suggest && item.suggest.length)
      ? `<div class="section">
           <div class="section-title">日常吃法（參考）</div>
           <div class="muted">${item.suggest.map(s => `• ${esc(s)}`).join('<br>')}</div>
         </div>` : '';

    const details = (item.details && item.details.length)
      ? `<div class="section">
           <div class="section-title">補充說明</div>
           <div>${item.details.map(p => `<p style="margin:0 0 10px;">${esc(p)}</p>`).join('')}</div>
         </div>` : '';

    const notes = (item.notes && item.notes.length)
      ? `<div class="info-card" style="margin-top:12px;">
           <div class="info-title">提醒</div>
           <div class="muted">${item.notes.map(n => `• ${esc(n)}`).join('<br>')}</div>
         </div>` : '';

    titleEl.textContent = `${item.name}${item.size ? '｜' + item.size : ''}`;

    bodyEl.innerHTML = `
      <div class="modal-hero">
        <img src="${esc(img)}" alt="${esc(item.name)}" loading="lazy">
        <div class="modal-meta">
          <div class="badge ghost">${esc(item._catName || '')}</div>
        </div>
      </div>
      ${specs}
      ${highlights}
      ${suggest}
      ${details}
      ${notes}
    `;

    modalEl.classList.add('is-open');
    modalEl.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('menu-open');
  }

  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('is-open');
    modalEl.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('menu-open');
  }

  async function boot() {
    try {
      const res = await fetch('products.json', { cache: 'no-store' });
      raw = await res.json();
      flat = flatten(raw);

      triggers().forEach(el => {
        el.addEventListener('click', (e) => {
          // allow inner links/buttons to work normally
          const a = e.target && e.target.closest ? e.target.closest('a') : null;
          if (a) return;
          const id = el.getAttribute('data-home-open');
          const item = flat.find(x => x.id === id);
          if (item) openModal(item);
        });
      });
    } catch (e) {
      // silently fail on home
    }
  }

  boot();
})();
