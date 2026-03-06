'use strict';

/**
 * Products page renderer (v9.0)
 * - Search by keyword
 * - Filter by category (gel/drink/block/powder)
 * - One card per product (same款不同規格整合)
 * - Modal supports variant selector (規格/容量切換)
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
  let groups = []; // grouped products
  let activeFilter = 'all';
  let query = '';

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const norm = (s) => String(s ?? '').toLowerCase().replace(/\s+/g, '');

  function slug(s) {
    return norm(s).replace(/[^\w\u4e00-\u9fff-]+/g, '').slice(0, 48) || 'item';
  }

  function buildGroups(data) {
    const out = [];
    (data.categories || []).forEach(cat => {
      const map = new Map();
      (cat.items || []).forEach(it => {
        const key = `${cat.id}::${it.name}`;
        if (!map.has(key)) {
          map.set(key, {
            id: `${cat.id}_${slug(it.name)}`,
            name: it.name,
            catId: cat.id,
            catName: cat.name,
            variants: []
          });
        }
        map.get(key).variants.push({ ...it });
      });

      // sort variants (try numeric in size first)
      map.forEach(g => {
        g.variants.sort((a, b) => {
          const na = parseFloat(String(a.size || '').replace(/[^\d.]/g, '')) || 0;
          const nb = parseFloat(String(b.size || '').replace(/[^\d.]/g, '')) || 0;
          return na - nb;
        });
        // primary variant: prefer non-規劃中, else first
        const primary = g.variants.find(v => !String(v.size || '').includes('規劃中')) || g.variants[0];
        g.primaryId = primary?.id || g.variants[0]?.id;
        g.primary = primary;
        out.push(g);
      });
    });
    return out;
  }

  function matchesGroup(g, q) {
    if (!q) return true;
    const nq = norm(q);
    const tokens = nq.split(/[,，]/).map(t => t.trim()).filter(Boolean);
    if (tokens.length === 0) return true;

    const blob = [
      g.name,
      g.catName,
      ...(g.variants || []).flatMap(v => [
        v.size,
        ...(v.keywords || []),
        ...(v.highlights || []),
        ...(v.details || []),
        ...(v.notes || []),
        ...(v.specs || []).map(s => `${s.k}:${s.v}`)
      ])
    ].join(' ');

    const nblob = norm(blob);

    return tokens.every(t => nblob.includes(t));
  }

  function applyFilterAndQuery() {
    const filtered = groups.filter(g => {
      const okFilter = (activeFilter === 'all') ? true : g.catId === activeFilter;
      const okQuery = matchesGroup(g, query);
      return okFilter && okQuery;
    });

    return filtered;
  }

  function renderList() {
    const data = applyFilterAndQuery();

    metaEl.textContent = `顯示 ${data.length} 項`;

    listEl.innerHTML = data.map(g => {
      const v = g.primary || g.variants[0];
      const img = (v.images && v.images[0]) ? v.images[0] : 'images/placeholder.jpg';
      const sizeLine = (g.variants.length > 1)
        ? `${esc(v.size || '')}｜共 ${g.variants.length} 種規格`
        : esc(v.size || '');
      const hl = (v.highlights || []).slice(0, 2).map(x => `<li>${esc(x)}</li>`).join('');

      return `
        <article class="p-card" data-gid="${esc(g.id)}">
          <div class="p-img">
            <button class="p-imgbtn" type="button" data-open="${esc(g.id)}" aria-label="開啟規格">
              <img src="${esc(img)}" alt="${esc(g.name)} ${esc(v.size || '')}" loading="lazy">
            </button>
          </div>
          <div class="p-body">
            <div class="p-kicker">${esc(g.catName)}</div>
            <h3 class="p-title">${esc(g.name)}</h3>
            <div class="p-size">${sizeLine}</div>
            ${hl ? `<ul class="p-hl">${hl}</ul>` : ''}
            <div class="p-actions">
              <button class="btn-outline" type="button" data-open="${esc(g.id)}">規格 / 內容</button>
              <a class="btn-outline" href="line.html">LINE 詢問</a>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // bind open
    listEl.querySelectorAll('[data-open]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const gid = e.currentTarget.getAttribute('data-open');
        const g = groups.find(x => x.id === gid);
        if (g) openModal(g, g.primaryId);
      });
    });
  }

  // Modal
  const modal = document.getElementById('pModal');
  const modalOverlay = document.getElementById('pModalOverlay');
  const modalClose = document.getElementById('pModalClose');
  const modalBody = document.getElementById('pModalBody');
  const modalTitle = document.getElementById('pModalTitle');
  const modalBottom = document.getElementById('pModalBottom');

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    
  }

  function renderVariantContent(v) {
    const img = (v.images && v.images[0]) ? v.images[0] : '';
    const specs = (v.specs || []).map(s =>
      `<div class="spec"><div class="k">${esc(s.k)}</div><div class="v">${esc(s.v)}</div></div>`
    ).join('');
    const highlights = (v.highlights || []).map(x => `<li>${esc(x)}</li>`).join('');
    const details = (v.details || []).map(x => `<li>${esc(x)}</li>`).join('');
    const suggest = (v.suggest || []).map(x => `<li>${esc(x)}</li>`).join('');
    const notes = (v.notes || []).map(x => `<li class="muted">${esc(x)}</li>`).join('');

    return `
      <div class="modal-hero">
        ${img ? `<img src="${esc(img)}" alt="${esc(v.name)} ${esc(v.size || '')}" loading="lazy">` : `<div></div>`}
        <div>
          <div class="modal-meta">
            <span class="chip">${esc(v.size || '')}</span>
          </div>

          ${highlights ? `<h4>重點</h4><ul class="bullets">${highlights}</ul>` : ''}
          ${details ? `<h4>說明</h4><ul class="bullets">${details}</ul>` : ''}
        </div>
      </div>

      ${specs ? `<h4 style="margin-top:14px">規格</h4><div class="specs">${specs}</div>` : ''}

      ${suggest ? `<h4 style="margin-top:14px">建議</h4><ul class="bullets">${suggest}</ul>` : ''}

      ${notes ? `<h4 style="margin-top:14px">備註</h4><ul class="bullets">${notes}</ul>` : ''}
    `;
  }

  function openModal(g, variantId) {
    if (!modal || !modalBody) return;

    const v0 = g.variants.find(v => v.id === variantId) || g.primary || g.variants[0];

    if (modalTitle) modalTitle.textContent = g.name;

    const variantBtns = (g.variants.length > 1)
      ? `<div class="variant-bar" role="tablist" aria-label="選擇規格">
          ${g.variants.map(v => {
            const active = v.id === v0.id ? 'is-active' : '';
            return `<button class="chip ${active}" type="button" data-vid="${esc(v.id)}">${esc(v.size || '')}</button>`;
          }).join('')}
        </div>`
      : '';

    modalBody.innerHTML = `
      <div class="modal-meta">
        <span class="chip">${esc(g.catName)}</span>
        ${v0.size ? `<span class="chip">${esc(v0.size)}</span>` : ''}
      </div>
      ${variantBtns}
      <div id="variantMount">
        ${renderVariantContent(v0)}
      </div>
    `;

    if (modalBottom) {
      modalBottom.innerHTML = `
        <a class="btn-outline" href="line.html">LINE 詢問規格</a>
        <button class="btn-outline" type="button" id="pModalClose2">關閉</button>
      `;
      const c2 = document.getElementById('pModalClose2');
      if (c2) c2.addEventListener('click', closeModal);
    }

    // bind variant switches
    const mount = modalBody.querySelector('#variantMount');
    modalBody.querySelectorAll('[data-vid]').forEach(b => {
      b.addEventListener('click', () => {
        const vid = b.getAttribute('data-vid');
        const v = g.variants.find(x => x.id === vid);
        if (!v) return;
        modalBody.querySelectorAll('.variant-bar .chip').forEach(x => x.classList.remove('is-active'));
        b.classList.add('is-active');
        mount.innerHTML = renderVariantContent(v);
      });
    });

    modal.classList.add('is-open');
  }

  if (modalOverlay) modalOverlay.addEventListener('click', closeModal);
  if (modalClose) modalClose.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // UI bindings
  chips.forEach(ch => ch.addEventListener('click', () => {
    chips.forEach(x => x.classList.remove('active'));
    ch.classList.add('active');
    activeFilter = ch.getAttribute('data-filter') || 'all';
    renderList();
  }));

  qEl.addEventListener('input', () => {
    query = qEl.value || '';
    renderList();
  });

  if (clearBtn) clearBtn.addEventListener('click', () => {
    qEl.value = '';
    query = '';
    renderList();
    qEl.focus();
  });

  // Load data
  fetch('products.json', { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
      raw = data;
      groups = buildGroups(data);

      // default active chip
      const activeChip = chips.find(x => x.classList.contains('active')) || chips[0];
      activeFilter = activeChip?.getAttribute('data-filter') || 'all';

      // support deep-link: ?open=<variantId> or #<variantId>
      const params = new URLSearchParams(location.search);
      const openId = params.get('open') || (location.hash ? location.hash.slice(1) : '');
      if (openId) {
        const g = groups.find(g => g.variants.some(v => v.id === openId));
        if (g) {
          renderList();
          openModal(g, openId);
          return;
        }
      }

      renderList();
    })
    .catch(() => {
      metaEl.textContent = '載入失敗';
    });
})();
