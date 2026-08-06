const DATA_URL = 'content/public-post-library.json?v=20260806-2';
const STORAGE_KEY = 'xjw-public-publishing-records-v1';
const PLATFORM_URLS = {
  'Facebook': 'https://www.facebook.com/',
  'Instagram': 'https://www.instagram.com/',
  'LINE VOOM': 'https://manager.line.biz/',
  'Google 商家最新動態': 'https://business.google.com/',
  'Google 商家': 'https://business.google.com/'
};

const state = {
  data: null,
  records: loadRecords(),
  query: '',
  filter: 'pending'
};

const el = (id) => document.getElementById(id);
const esc = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

function loadRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
  render();
}

function recordFor(post) {
  return state.records[post.id] || {};
}

function sourceLocked(post) {
  return post.status === 'published' || post.prevent_republish === true;
}

function imageNeedsReplacement(post) {
  return !post.image_url || /needs-replacement|missing|low|unusable/i.test(post.image_status || '');
}

function effectiveStatus(post) {
  if (sourceLocked(post)) return 'published';
  const record = recordFor(post);
  if (record.publishedAt) return 'published';
  if (record.reviewedAt) return 'approved';
  return 'pending';
}

function statusText(post) {
  if (sourceLocked(post)) return '已發布鎖定';
  const record = recordFor(post);
  if (record.publishedAt) return '本機已發布';
  if (record.reviewedAt) return '已核准';
  return '待審核';
}

function toast(message) {
  const node = el('toast');
  node.textContent = message;
  node.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('show'), 2600);
}

async function copyText(text, success = '已複製') {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
  toast(success);
}

function toggleReview(post) {
  if (sourceLocked(post) || recordFor(post).publishedAt) return;
  const current = recordFor(post);
  if (current.reviewedAt) {
    if (!confirm(`要取消「${post.title}」的核准狀態嗎？`)) return;
    state.records[post.id] = { ...current, reviewedAt: null };
  } else {
    if (imageNeedsReplacement(post)) {
      const proceed = confirm('這篇圖片被標示為待更換。仍要先核准文案嗎？圖片在發布前仍需更換。');
      if (!proceed) return;
    } else if (!confirm(`已確認「${post.title}」的文案、圖片與產品規格都正確嗎？`)) {
      return;
    }
    state.records[post.id] = { ...current, reviewedAt: new Date().toISOString() };
  }
  saveRecords();
}

function ensureReviewed(post) {
  if (sourceLocked(post) || recordFor(post).publishedAt) return true;
  if (recordFor(post).reviewedAt) return true;
  if (!confirm('這篇尚未標記核准。請先確認文案、圖片、產品規格與價格都正確。現在要標記為已核准嗎？')) return false;
  state.records[post.id] = { ...recordFor(post), reviewedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
  return true;
}

function parsePlatforms(value, fallback = []) {
  const list = String(value || '')
    .split(/[、,，\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return list.length ? [...new Set(list)] : fallback;
}

function markPublished(post) {
  if (sourceLocked(post)) return;
  if (!ensureReviewed(post)) return;
  const existing = recordFor(post);
  if (existing.publishedAt) {
    if (!confirm('要清除這支手機上保存的已發布標記嗎？公開Git原始資料不會被刪除。')) return;
    state.records[post.id] = { ...existing, publishedAt: null, publishedPlatforms: [] };
    saveRecords();
    return;
  }
  const targets = Array.isArray(post.platforms) ? post.platforms : [];
  const answer = prompt('輸入這次已完成發布的平台，可用逗號分隔：', targets.join('、'));
  if (answer === null) return;
  const platforms = parsePlatforms(answer, targets);
  if (!platforms.length) {
    alert('至少要填入一個已發布平台。');
    return;
  }
  state.records[post.id] = {
    ...existing,
    reviewedAt: existing.reviewedAt || new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    publishedPlatforms: platforms,
    sourceVersion: state.data?.version || ''
  };
  saveRecords();
  toast('已保存發布紀錄，這篇不會再列入待處理');
}

async function sharePost(post) {
  if (!ensureReviewed(post)) return;
  const shareData = { title: post.title, text: post.copy };
  try {
    if (post.image_url) {
      const response = await fetch(post.image_url, { cache: 'no-store' });
      if (response.ok) {
        const blob = await response.blob();
        const extension = blob.type.includes('png') ? 'png' : blob.type.includes('webp') ? 'webp' : blob.type.includes('svg') ? 'svg' : 'jpg';
        const file = new File([blob], `${post.id}.${extension}`, { type: blob.type || 'image/jpeg' });
        if (navigator.canShare?.({ files: [file] })) shareData.files = [file];
      }
    }
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
  } catch (error) {
    if (error?.name === 'AbortError') return;
  }
  await copyText(post.copy, '文案已複製；請開啟圖片與平台發布');
  if (post.image_url) window.open(post.image_url, '_blank', 'noopener');
}

async function openPlatform(post, platform) {
  if (!ensureReviewed(post)) return;
  const target = PLATFORM_URLS[platform] || 'https://www.google.com/';
  const opened = window.open('about:blank', '_blank');
  await copyText(post.copy, `文案已複製，正在開啟${platform}`);
  if (opened) {
    opened.opener = null;
    opened.location.href = target;
  } else {
    window.location.href = target;
  }
}

async function openChatGPT(post) {
  const prompt = [
    '請依照仙加味正式視覺規範，為以下貼文製作一張可發布的繁體中文社群圖片。',
    '',
    `貼文標題：${post.title}`,
    `貼文文案：${post.copy}`,
    '',
    `圖片要求：${post.image_prompt || '使用仙加味官網版小老闆與固定夥伴；產品只能使用正式原圖等比例呈現，不重畫、不改包裝與規格。'}`,
    '',
    '請避免療效宣稱、錯字、簡體字、裁切產品或改變產品包裝。'
  ].join('\n');
  const opened = window.open('https://chatgpt.com/', '_blank', 'noopener');
  await copyText(prompt, '生成圖片指令已複製，請貼到ChatGPT');
  return opened;
}

function exportRecords() {
  const payload = {
    exportedAt: new Date().toISOString(),
    source: 'TS15825868/xianjiawei/content/public-post-library.json',
    sourceVersion: state.data?.version || '',
    records: state.records
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `仙加味貼文發布紀錄-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  toast('發布紀錄已匯出');
}

function matchesFilter(post) {
  const query = state.query.trim().toLowerCase();
  const haystack = [post.id, post.title, post.copy, post.image_prompt, ...(post.platforms || [])].join(' ').toLowerCase();
  if (query && !haystack.includes(query)) return false;
  const status = effectiveStatus(post);
  if (state.filter === 'all') return true;
  if (state.filter === 'needs-image') return imageNeedsReplacement(post) && !sourceLocked(post);
  return status === state.filter;
}

function cardHtml(post) {
  const record = recordFor(post);
  const status = effectiveStatus(post);
  const locked = sourceLocked(post);
  const needsImage = imageNeedsReplacement(post);
  const platformHtml = (post.platforms || []).map((item) => `<span class="platform-chip">${esc(item)}</span>`).join('');
  const localInfo = record.publishedAt
    ? `<div class="review-note">本機紀錄：${esc(new Date(record.publishedAt).toLocaleString('zh-TW'))}<br>${esc((record.publishedPlatforms || []).join('、'))}</div>`
    : record.reviewedAt
      ? `<div class="review-note">已於這支裝置完成圖文核准。</div>`
      : `<div class="review-note ${needsImage ? 'warning' : ''}">${needsImage ? '圖片目前標示為待更換；可先複製生成指令。' : '發布前請先核准圖文。'}</div>`;
  const image = post.image_url
    ? `<img src="${esc(post.image_url)}" alt="${esc(post.title)}" loading="lazy" decoding="async">`
    : '<div class="state-card">尚無圖片</div>';
  return `<article class="post-card ${locked ? 'locked' : ''} ${needsImage ? 'needs-image' : ''}" data-id="${esc(post.id)}">
    <div class="image-wrap">${image}<span class="image-state">${esc(post.image_status || (needsImage ? '待補圖' : '圖片候選'))}</span></div>
    <div class="card-body">
      <div class="card-title-row"><h2>${esc(post.title || post.id)}</h2><span class="status ${status}">${esc(statusText(post))}</span></div>
      <p class="excerpt">${esc(post.copy || '')}</p>
      <div class="platforms">${platformHtml}</div>
      ${localInfo}
      <div class="card-actions">
        <button class="button secondary small" type="button" data-view="${esc(post.id)}">查看完整</button>
        <button class="button secondary small" type="button" data-copy="${esc(post.id)}">複製文案</button>
        ${post.image_url ? `<a class="button secondary small" href="${esc(post.image_url)}" target="_blank" rel="noopener">開啟圖片</a>` : ''}
        ${!locked && !record.publishedAt ? `<button class="button ${record.reviewedAt ? 'secondary' : 'green'} small" type="button" data-review="${esc(post.id)}">${record.reviewedAt ? '取消核准' : '核准圖文'}</button>` : ''}
        ${!locked ? `<button class="button ${record.publishedAt ? 'secondary' : 'orange'} small" type="button" data-published="${esc(post.id)}">${record.publishedAt ? '取消本機標記' : '標記已發布'}</button>` : ''}
      </div>
    </div>
  </article>`;
}

function renderMetrics(posts) {
  el('metricTotal').textContent = posts.length;
  el('metricPending').textContent = posts.filter((post) => !sourceLocked(post) && !recordFor(post).publishedAt).length;
  el('metricLocked').textContent = posts.filter(sourceLocked).length;
  el('metricLocal').textContent = posts.filter((post) => Boolean(recordFor(post).publishedAt)).length;
}

function render() {
  if (!state.data) return;
  const posts = Array.isArray(state.data.posts) ? state.data.posts : [];
  renderMetrics(posts);
  const filtered = posts.filter(matchesFilter);
  el('postList').innerHTML = filtered.length
    ? filtered.map(cardHtml).join('')
    : '<section class="state-card">目前沒有符合條件的貼文。</section>';
}

function findPost(id) {
  return state.data?.posts?.find((post) => post.id === id) || null;
}

function openDialog(post) {
  const record = recordFor(post);
  const locked = sourceLocked(post);
  const platforms = (post.platforms || []).map((platform) => {
    const url = PLATFORM_URLS[platform];
    return url ? `<button class="button secondary small" type="button" data-platform="${esc(platform)}" data-id="${esc(post.id)}">開啟${esc(platform)}</button>` : '';
  }).join('');
  el('dialogContent').innerHTML = `<div class="dialog-grid">
    <div>
      ${post.image_url ? `<img class="dialog-image" src="${esc(post.image_url)}" alt="${esc(post.title)}">` : '<div class="state-card">尚無圖片</div>'}
      <p class="meta-line">貼文ID：${esc(post.id)}</p>
      <p class="meta-line">圖片狀態：${esc(post.image_status || '未標示')}</p>
      ${post.image_prompt ? `<div class="prompt-box"><strong>缺圖／換圖指令</strong><br>${esc(post.image_prompt)}</div>` : ''}
    </div>
    <div>
      <h2>${esc(post.title)}</h2>
      <div class="platforms">${(post.platforms || []).map((item) => `<span class="platform-chip">${esc(item)}</span>`).join('')}</div>
      <div class="dialog-copy">${esc(post.copy || '')}</div>
      <div class="dialog-actions">
        <button class="button primary" type="button" data-copy="${esc(post.id)}">複製文案</button>
        ${post.image_url ? `<a class="button secondary" href="${esc(post.image_url)}" target="_blank" rel="noopener">開啟原圖</a>` : ''}
        <button class="button green" type="button" data-share="${esc(post.id)}" ${locked ? 'disabled' : ''}>分享圖片與文案</button>
        ${post.image_prompt ? `<button class="button secondary" type="button" data-chatgpt="${esc(post.id)}">到ChatGPT製作新圖</button>` : ''}
      </div>
      <div class="platform-actions">${locked ? '<span class="review-note">這篇已發布鎖定，不可重複發布。</span>' : platforms}</div>
      ${!locked ? `<div class="dialog-actions">
        <button class="button ${record.reviewedAt ? 'secondary' : 'green'}" type="button" data-review="${esc(post.id)}">${record.reviewedAt ? '取消核准' : '核准圖文'}</button>
        <button class="button ${record.publishedAt ? 'secondary' : 'orange'}" type="button" data-published="${esc(post.id)}">${record.publishedAt ? '取消本機發布標記' : '完成後標記已發布'}</button>
      </div>` : ''}
    </div>
  </div>`;
  el('postDialog').showModal();
}

async function loadData() {
  el('loadingState').hidden = false;
  el('errorState').hidden = true;
  el('postList').innerHTML = '';
  try {
    const response = await fetch(`${DATA_URL}&t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Git資料讀取失敗（HTTP ${response.status}）`);
    const data = await response.json();
    if (!Array.isArray(data.posts)) throw new Error('公開貼文母本格式不正確');
    state.data = data;
    el('loadingState').hidden = true;
    render();
  } catch (error) {
    el('loadingState').hidden = true;
    el('errorMessage').textContent = error.message || String(error);
    el('errorState').hidden = false;
  }
}

function bind() {
  el('searchInput').addEventListener('input', (event) => { state.query = event.target.value; render(); });
  el('statusFilter').addEventListener('change', (event) => { state.filter = event.target.value; render(); });
  el('exportButton').addEventListener('click', exportRecords);
  el('reloadButton').addEventListener('click', loadData);
  el('retryButton').addEventListener('click', loadData);
  document.addEventListener('click', async (event) => {
    const target = event.target.closest('button,[data-view]');
    if (!target || !state.data) return;
    const id = target.dataset.view || target.dataset.copy || target.dataset.review || target.dataset.published || target.dataset.share || target.dataset.chatgpt || target.dataset.id;
    const post = id ? findPost(id) : null;
    if (target.dataset.view && post) openDialog(post);
    if (target.dataset.copy && post) await copyText(post.copy, '貼文文案已複製');
    if (target.dataset.review && post) { toggleReview(post); if (el('postDialog').open) openDialog(post); }
    if (target.dataset.published && post) { markPublished(post); if (el('postDialog').open) openDialog(post); }
    if (target.dataset.share && post) await sharePost(post);
    if (target.dataset.chatgpt && post) await openChatGPT(post);
    if (target.dataset.platform && post) await openPlatform(post, target.dataset.platform);
  });
}

bind();
loadData();
