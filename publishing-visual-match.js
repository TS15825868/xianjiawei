(() => {
  'use strict';

  const DATA_URL = 'content/public-post-library.json?v=20260806-visual-match-v1';
  const STORAGE_KEY = 'xjw-public-visual-match-v1';
  const DIMENSIONS = [
    ['product', '產品／規格／價格'],
    ['season', '季節'],
    ['context', '情境'],
    ['temperature', '冷熱'],
    ['expression', '表情'],
    ['action', '動作']
  ];

  let postsById = new Map();
  let checks = loadChecks();

  function loadChecks() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return value && typeof value === 'object' ? value : {};
    } catch {
      return {};
    }
  }

  function saveChecks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
    decorateCards();
    decorateDialog();
  }

  function esc(value = '') {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function isLocked(post) {
    return post?.status === 'published' || post?.prevent_republish === true;
  }

  function imageBlocked(post) {
    return !post?.image_url || /needs-replacement|missing|low|unusable/i.test(post?.image_status || '');
  }

  function checkedCount(postId) {
    const record = checks[postId] || {};
    return DIMENSIONS.filter(([key]) => record[key] === true).length;
  }

  function allMatched(postId) {
    return checkedCount(postId) === DIMENSIONS.length;
  }

  function textOf(post) {
    return [post?.id, post?.title, post?.copy, post?.image_prompt].filter(Boolean).join(' ');
  }

  function expectedProduct(post, text) {
    if (/TRIAL|試喝/.test(text)) return '30cc小玻璃罐×3罐為主；30cc售價60元、11罐600元；180cc鋁袋200元、11包2,000元。';
    if (/30cc|DRINK-30/.test(text)) return '只使用30cc小玻璃罐正式原圖，裸罐無貼紙；不可出現180cc鋁袋或「玻璃瓶」。';
    if (/180cc|DRINK-180/.test(text)) return '只使用180cc鋁袋正式原圖，不得誤放30cc小玻璃罐。';
    if (/龜鹿膏|GAO-100/.test(text)) return '龜鹿膏100g／罐正式原圖，包裝、文字與比例不可改。';
    if (/湯塊|SOUP-75/.test(text)) return '龜鹿湯塊75g藍盒、8塊裝、每塊約9.375g；不得誤放其他規格。';
    if (/龜鹿膠|JIAO-600/.test(text)) return '龜鹿膠600g紫盒、32塊裝、每塊約18.75g；不得誤放藍盒。';
    if (/鹿茸粉|LUERONG/.test(text)) return '鹿茸粉75g白色塑膠罐正式原圖，不改包裝。';
    if (/產品|系列|選擇|使用方式|搭配/.test(text)) return '文案提到的所有產品都必須使用正式原圖，規格正確且不得互換。';
    return '未特別提產品時，不強行加入不相關產品；若有產品，仍須使用正式原圖。';
  }

  function expectedSeason(text) {
    if (/四季|春天|夏天|秋天|冬天/.test(text)) return '畫面需清楚呼應四季或文案指定季節，不能只用單一無關品牌圖。';
    if (/悶熱|炎熱|補水/.test(text)) return '炎熱、夏季或悶熱天氣感；發布前確認當日天氣。';
    if (/溫差|薄外套/.test(text)) return '換季或早晚溫差情境；發布前確認當日天氣。';
    if (/下雨|雨天/.test(text)) return '雨天、陰雨或室內避雨情境；發布前確認當日天氣。';
    return '可採四季皆宜的中性日常畫面，但不可出現與文案明顯衝突的季節。';
  }

  function expectedContext(text) {
    if (/試喝/.test(text)) return '試喝活動海報／三罐30cc展示／官方LINE申請。';
    if (/燉湯|雞湯|排骨湯|料理|燉煮/.test(text)) return '廚房、餐桌、湯鍋或家常燉煮情境，不能配官方LINE或純聯絡圖。';
    if (/保存|冷藏|密封|陰涼/.test(text)) return '居家保存、冰箱、密封或乾燥收納情境。';
    if (/官方 LINE|官方LINE|聯絡/.test(text)) return '品牌與官方LINE導流情境，不放公開地址或電話。';
    if (/忙碌|喘息|休息|工作/.test(text)) return '工作空檔、休息、喝溫水或放慢步調的生活情境。';
    if (/悶熱|溫差|下雨|天氣/.test(text)) return '與當日天氣相符的戶外／室內生活情境。';
    if (/品牌|萬華|傳承/.test(text)) return '萬華品牌、傳承或品牌介紹情境。';
    return '文案主題對應的產品展示或日常生活情境，不能使用無關暫代圖。';
  }

  function expectedTemperature(text) {
    if (/悶熱|炎熱|清爽|補水/.test(text)) return '呈現清爽與補水，但不可暗示冰飲；龜鹿飲仍以常溫或溫熱為主。';
    if (/溫水|溫熱|隔水加熱|熱水|燉湯|燉煮|湯品|冬天/.test(text)) return '呈現溫熱、熱水、蒸氣或燉煮感，不可配冰塊或冰飲畫面。';
    if (/冷藏|保存/.test(text)) return '依保存規則呈現冷藏或常溫收納，不要與食用溫度混淆。';
    return '冷熱可中性，但不得與文案中的溫熱／清爽要求相反。';
  }

  function expectedExpression(text) {
    if (/試喝|官方LINE|介紹|選擇/.test(text)) return '親切、自然、邀請或說明的表情，不誇張推銷。';
    if (/忙碌|喘息|休息|下雨/.test(text)) return '放鬆、平靜、溫和，不可過度興奮。';
    if (/悶熱|溫差|提醒|保存/.test(text)) return '關心、提醒、專注或自然表情。';
    if (/料理|燉湯|燉煮/.test(text)) return '專注料理、期待或溫暖享用的表情。';
    return '自然、親切、符合仙加味品牌，不使用誇張療效式表情。';
  }

  function expectedAction(text) {
    if (/試喝/.test(text)) return '展示3罐30cc試喝品、指向官方LINE或進行申請說明。';
    if (/隔水加熱/.test(text)) return '展示未開封產品隔水加熱，或溫熱後準備飲用。';
    if (/飲用|溫水|補水/.test(text)) return '手持、飲用、準備溫水或攜帶飲品；動作需符合文案。';
    if (/燉湯|雞湯|排骨湯|料理|燉煮/.test(text)) return '備料、放入湯鍋、攪拌、燉煮、盛湯或溫熱享用。';
    if (/保存|冷藏|密封/.test(text)) return '密封、收納、放入冰箱或置於陰涼處。';
    if (/薄外套|溫差/.test(text)) return '攜帶或穿上薄外套。';
    if (/下雨/.test(text)) return '撐傘、收傘、室內整理或喝溫水。';
    if (/選擇|比較|指南|使用方式/.test(text)) return '比較產品、指引、說明或示範使用方式。';
    return '動作必須服務文案主題，不可只是無關站立或擺拍。';
  }

  function expectations(post) {
    const text = textOf(post);
    return {
      product: expectedProduct(post, text),
      season: expectedSeason(text),
      context: expectedContext(text),
      temperature: expectedTemperature(text),
      expression: expectedExpression(text),
      action: expectedAction(text)
    };
  }

  function installStyles() {
    if (document.getElementById('xjwVisualMatchStyles')) return;
    const style = document.createElement('style');
    style.id = 'xjwVisualMatchStyles';
    style.textContent = `
      .visual-match-box{margin-top:14px;padding:14px;border:1px solid #cfd8e3;border-radius:16px;background:#f8fafc}
      .visual-match-box h3{margin:0;color:#0b1f3b;font-size:17px}
      .visual-match-intro{margin:5px 0 12px;color:#667085;font-size:12px;line-height:1.55}
      .visual-match-list{display:grid;gap:9px}
      .visual-match-item{display:grid;grid-template-columns:26px 82px 1fr;gap:8px;align-items:start;padding:9px;border:1px solid #dde3ea;border-radius:12px;background:#fff;cursor:pointer}
      .visual-match-item input{width:20px;height:20px;margin:1px 0 0;accent-color:#1f5a47}
      .visual-match-item strong{color:#0b1f3b;font-size:13px}
      .visual-match-item span{color:#475467;font-size:12px;line-height:1.55}
      .visual-match-progress{margin:9px 0 0;font-size:12px;font-weight:800;color:#8a4b08}
      .visual-match-progress.complete{color:#116149}
      .visual-match-card-note{margin:8px 0;padding:8px 10px;border-radius:10px;background:#fff5e6;color:#8a4b08;font-size:12px;font-weight:800}
      .visual-match-card-note.complete{background:#edf7f2;color:#116149}
      .visual-match-card-note.blocked{background:#fff1f0;color:#b42318}
      @media(max-width:560px){.visual-match-item{grid-template-columns:25px 70px 1fr}.visual-match-item span{font-size:11px}}
    `;
    document.head.appendChild(style);
  }

  function cardId(card) {
    return card?.dataset?.id || card?.querySelector('[data-view]')?.dataset?.view || '';
  }

  function decorateCards() {
    document.querySelectorAll('.post-card').forEach((card) => {
      const id = cardId(card);
      const post = postsById.get(id);
      if (!post) return;
      let note = card.querySelector('[data-visual-match-card]');
      if (!note) {
        note = document.createElement('div');
        note.dataset.visualMatchCard = 'true';
        const actions = card.querySelector('.card-actions');
        actions?.parentNode?.insertBefore(note, actions);
      }
      if (!note) return;
      if (isLocked(post)) {
        note.className = 'visual-match-card-note complete';
        note.textContent = '已發布鎖定｜不需重新核准';
      } else if (imageBlocked(post)) {
        note.className = 'visual-match-card-note blocked';
        note.textContent = '圖片待更換｜禁止核准與發布';
      } else {
        const count = checkedCount(id);
        note.className = `visual-match-card-note ${count === DIMENSIONS.length ? 'complete' : ''}`;
        note.textContent = `圖文匹配 ${count}／${DIMENSIONS.length}｜季節・情境・冷熱・表情・動作都要一致`;
      }
    });
  }

  function currentDialogId() {
    const root = document.getElementById('dialogContent');
    const button = root?.querySelector('[data-id],[data-copy],[data-review],[data-share],[data-chatgpt]');
    return button?.dataset?.id || button?.dataset?.copy || button?.dataset?.review || button?.dataset?.share || button?.dataset?.chatgpt || '';
  }

  function decorateDialog() {
    const root = document.getElementById('dialogContent');
    if (!root || !document.getElementById('postDialog')?.open) return;
    const id = currentDialogId();
    const post = postsById.get(id);
    if (!post || isLocked(post)) return;
    root.querySelectorAll('[data-visual-match-box]').forEach((node) => node.remove());
    const details = expectations(post);
    const record = checks[id] || {};
    const count = checkedCount(id);
    const box = document.createElement('section');
    box.className = 'visual-match-box';
    box.dataset.visualMatchBox = 'true';
    box.innerHTML = `
      <h3>發布前六項圖文匹配</h3>
      <p class="visual-match-intro">請直接查看圖片逐項確認。沒有特定要求時，也要確認畫面沒有與文案衝突。</p>
      ${imageBlocked(post) ? '<div class="visual-match-card-note blocked">此圖已標示待更換，完成換圖前不可核准或發布。</div>' : ''}
      <div class="visual-match-list">
        ${DIMENSIONS.map(([key, label]) => `
          <label class="visual-match-item">
            <input type="checkbox" data-match-id="${esc(id)}" data-match-key="${esc(key)}" ${record[key] === true ? 'checked' : ''} ${imageBlocked(post) ? 'disabled' : ''}>
            <strong>${esc(label)}</strong>
            <span>${esc(details[key])}</span>
          </label>
        `).join('')}
      </div>
      <p class="visual-match-progress ${count === DIMENSIONS.length ? 'complete' : ''}">已確認 ${count}／${DIMENSIONS.length} 項${count === DIMENSIONS.length ? '，可以進行核准。' : '，尚不可核准或發布。'}</p>
      <div class="dialog-actions"><button class="button secondary small" type="button" data-copy-visual-prompt="${esc(id)}">複製完整換圖指令</button></div>
    `;
    const right = root.querySelector('.dialog-grid > div:last-child');
    right?.appendChild(box);
  }

  function openPostDialog(id) {
    const card = document.querySelector(`.post-card[data-id="${CSS.escape(id)}"]`);
    const button = card?.querySelector('[data-view]');
    if (button) setTimeout(() => button.click(), 0);
  }

  function blockMessage(post) {
    if (imageBlocked(post)) return '這篇圖片已標示待更換，請先製作並換成符合文案的新圖。';
    return '圖文六項匹配尚未全部確認。請先檢查產品／規格／價格、季節、情境、冷熱、表情與動作。';
  }

  function visualPrompt(post) {
    const details = expectations(post);
    return [
      '請依照仙加味正式視覺規範，製作一張可發布的繁體中文社群圖片。',
      '',
      `貼文標題：${post.title || ''}`,
      `貼文文案：${post.copy || ''}`,
      '',
      `產品／規格／價格：${details.product}`,
      `季節：${details.season}`,
      `情境：${details.context}`,
      `冷熱：${details.temperature}`,
      `表情：${details.expression}`,
      `動作：${details.action}`,
      '',
      `原始圖片要求：${post.image_prompt || '產品只使用正式原圖等比例呈現，不重畫、不改包裝與規格。'}`,
      '',
      '固定規範：官網版仙加味小老闆；圍裙紅色直式印章；小鹿與小烏龜不可省略；繁體中文；避免療效宣稱、簡體字、錯字、產品裁切、包裝重畫或規格更改。'
    ].join('\n');
  }

  async function copyText(text) {
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
  }

  function intercept(event) {
    const target = event.target.closest('button,[data-platform]');
    if (!target) return;
    const id = target.dataset.review || target.dataset.published || target.dataset.share || target.dataset.platform && target.dataset.id || target.dataset.chatgpt || target.dataset.copyVisualPrompt;
    const post = id ? postsById.get(id) : null;
    if (!post) return;

    if (target.dataset.copyVisualPrompt) {
      event.preventDefault();
      event.stopImmediatePropagation();
      copyText(visualPrompt(post)).then(() => alert('完整換圖指令已複製，可貼到ChatGPT製作。'));
      return;
    }

    if (target.dataset.chatgpt) {
      event.preventDefault();
      event.stopImmediatePropagation();
      copyText(visualPrompt(post)).then(() => {
        window.open('https://chatgpt.com/', '_blank', 'noopener');
        alert('完整生成指令已複製，請貼到ChatGPT。');
      });
      return;
    }

    const guarded = target.dataset.review || target.dataset.published || target.dataset.share || target.dataset.platform;
    if (!guarded || isLocked(post)) return;
    if (imageBlocked(post) || !allMatched(post.id)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      alert(blockMessage(post));
      openPostDialog(post.id);
    }
  }

  async function init() {
    installStyles();
    try {
      const response = await fetch(`${DATA_URL}&t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      postsById = new Map((data.posts || []).map((post) => [post.id, post]));
    } catch (error) {
      console.error('六項圖文匹配資料載入失敗', error);
    }

    document.addEventListener('click', intercept, true);
    document.addEventListener('change', (event) => {
      const input = event.target.closest('[data-match-id][data-match-key]');
      if (!input) return;
      const id = input.dataset.matchId;
      const key = input.dataset.matchKey;
      checks[id] = { ...(checks[id] || {}), [key]: input.checked };
      saveChecks();
    });

    const observer = new MutationObserver(() => {
      decorateCards();
      decorateDialog();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    decorateCards();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
