(() => {
  'use strict';

  const POLICY_URL = 'content/public-visual-match-policy.json?v=20260806-1';
  let mismatches = {};

  function installStyles() {
    if (document.getElementById('xjwKnownMismatchStyles')) return;
    const style = document.createElement('style');
    style.id = 'xjwKnownMismatchStyles';
    style.textContent = `
      .known-mismatch-warning{margin:10px 0;padding:10px 12px;border-radius:12px;background:#fff1f0;color:#b42318;font-size:12px;line-height:1.6;font-weight:700}
      .known-mismatch-warning strong{display:block;color:#8f1717;margin-bottom:3px}
      .post-card.known-mismatch{border:2px solid #d92d20}
    `;
    document.head.appendChild(style);
  }

  function getId(node) {
    return node?.dataset?.review || node?.dataset?.published || node?.dataset?.share || node?.dataset?.chatgpt || node?.dataset?.id || node?.closest('.post-card')?.dataset?.id || '';
  }

  function currentDialogId() {
    const root = document.getElementById('dialogContent');
    const button = root?.querySelector('[data-review],[data-published],[data-share],[data-chatgpt],[data-id]');
    return getId(button);
  }

  function decorateCards() {
    document.querySelectorAll('.post-card').forEach((card) => {
      const id = card.dataset.id;
      const item = mismatches[id];
      card.classList.toggle('known-mismatch', Boolean(item));
      card.querySelectorAll('[data-known-mismatch-card]').forEach((node) => node.remove());
      if (!item) return;
      const warning = document.createElement('div');
      warning.dataset.knownMismatchCard = 'true';
      warning.className = 'known-mismatch-warning';
      warning.innerHTML = `<strong>圖片待更換｜禁止核准與發布</strong>${item.reason}`;
      const actions = card.querySelector('.card-actions');
      actions?.parentNode?.insertBefore(warning, actions);
    });
  }

  function decorateDialog() {
    const dialog = document.getElementById('postDialog');
    const root = document.getElementById('dialogContent');
    if (!dialog?.open || !root) return;
    const id = currentDialogId();
    const item = mismatches[id];
    root.querySelectorAll('[data-known-mismatch-dialog]').forEach((node) => node.remove());
    if (!item) return;
    const warning = document.createElement('section');
    warning.dataset.knownMismatchDialog = 'true';
    warning.className = 'known-mismatch-warning';
    warning.innerHTML = `<strong>這張圖與文案不符合，不能發布</strong>${item.reason}<br><br><strong>換圖要求</strong>${item.required_replacement}`;
    const right = root.querySelector('.dialog-grid > div:last-child');
    right?.prepend(warning);
  }

  function intercept(event) {
    const target = event.target.closest('button,[data-platform]');
    if (!target) return;
    const guarded = target.dataset.review || target.dataset.published || target.dataset.share || target.dataset.platform;
    if (!guarded) return;
    const id = getId(target);
    const item = mismatches[id];
    if (!item) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    alert(`這張圖與文案不符合，不能核准或發布。\n\n原因：${item.reason}\n\n請先換成：${item.required_replacement}`);
    const card = document.querySelector(`.post-card[data-id="${CSS.escape(id)}"]`);
    setTimeout(() => card?.querySelector('[data-view]')?.click(), 0);
  }

  async function init() {
    installStyles();
    try {
      const response = await fetch(`${POLICY_URL}&t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const policy = await response.json();
      mismatches = policy.known_mismatches || {};
    } catch (error) {
      console.error('已知圖文不符清單載入失敗', error);
    }

    document.addEventListener('click', intercept, true);
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
