'use strict';

/**
 * Products page renderer (v8.1)
 * - Search by keyword
 * - Filter by category (gel/drink/block/powder)
 * Data source: products.json
 */

(function () {
  const listEl = document.getElementById('productList');
  const qEl = document.getElementById('q');
  const clearBtn = document.getElementById('clearBtn');
  const metaEl = document.getElementById('resultMeta');
  const chips = Array.from(document.querySelectorAll('.chip[data-filter]'));

  if (!listEl || !qEl || !metaEl || chips.length === 0) return;

  let raw = null;
  let flat = [];
  let activeFilter = 'all';
  let query = '';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, '');
  const includesAny = (hay, needles) => needles.some(n => hay.includes(n));

  function flatten(data) {
    const out = [];
    (data.categories || []).forEach(cat => {
      (cat.items || []).forEach(it => {
        out.push({
          ...it,
          _catId: cat.id,
          _catName: cat.name
        });
      });
    });
    return out;
  }

  function matches(item, q) {
    if (!q) return true;
    const nq = norm(q);
    const tokens = nq.split(/[,，]/).map(t => t.trim()).filter(Boolean);
    const hay = norm([
      item.name, item.size, item._catName,
      ...(item.highlights || []),
      ...(item.notes || []),
      ...(item.keywords || [])
    ].join(' '));
    return includesAny(hay, tokens.length ? tokens : [nq]);
  }

  function apply() {
    const filtered = flat.filter(it => (activeFilter === 'all' || it._catId === activeFilter))
                         .filter(it => matches(it, query));

    metaEl.textContent = `共 ${filtered.length} 項｜篩選：${activeFilter === 'all' ? '全部' : (filtered[0]?filtered[0]._catName: activeFilter)}｜更新：${raw?.updatedAt ? raw.updatedAt : ''}`.replace(/\s+\| 更新：$/, '');

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="info-card">
          <div class="info-title">沒有符合的結果</div>
          <div class="muted">你可以試試看：改用「75g / 180cc / 100g / 入湯 / 沖泡」等關鍵字，或切回「全部」。</div>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(renderItem).join('\n');
  }

  function renderItem(item) {
    const img = (item.images && item.images[0]) ? item.images[0] : 'images/product-guiku-main.jpg';
    const size = item.size ? `<span class="badge">${esc(item.size)}</span>` : '';
    const cat = item._catName ? `<span class="badge ghost">${esc(item._catName)}</span>` : '';
    const highlights = (item.highlights && item.highlights.length)
      ? `<ul class="bullets">${item.highlights.map(h => `<li>${esc(h)}</li>`).join('')}</ul>`
      : '';
    const notes = (item.notes && item.notes.length)
      ? `<div class="muted" style="margin-top:10px;">${item.notes.map(n => `• ${esc(n)}`).join('<br>')}</div>`
      : '';

    return `
      <article class="card product-card">
        <div class="product-media">
          <img src="${esc(img)}" alt="${esc(item.name)}" loading="lazy">
        </div>
        <div class="product-body">
          <div class="product-top">
            <h3 class="product-title">${esc(item.name)} ${size}</h3>
            <div class="badges">${cat}</div>
          </div>
          ${highlights}
          ${notes}
          <div class="product-actions">
            <a class="btn" href="contact.html">立即詢問</a>
            <a class="btn ghost" href="choose.html">怎麼選擇</a>
          </div>
        </div>
      </article>
    `.trim();
  }

  function setActiveChip(filter) {
    activeFilter = filter;
    chips.forEach(btn => {
      const on = btn.getAttribute('data-filter') === filter;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    apply();
  }

  function initEvents() {
    chips.forEach(btn => {
      btn.addEventListener('click', () => setActiveChip(btn.getAttribute('data-filter')));
    });

    qEl.addEventListener('input', () => {
      query = qEl.value || '';
      apply();
    });

    clearBtn.addEventListener('click', () => {
      qEl.value = '';
      query = '';
      qEl.focus();
      apply();
    });
  }

  async function boot() {
    try {
      const res = await fetch('products.json', { cache: 'no-store' });
      raw = await res.json();
      flat = flatten(raw);
      initEvents();
      apply();
    } catch (e) {
      listEl.innerHTML = `
        <div class="info-card">
          <div class="info-title">讀取產品資料失敗</div>
          <div class="muted">請確認 products.json 是否存在，或重新上傳網站檔案。</div>
        </div>
      `;
    }
  }

  boot();
})();
