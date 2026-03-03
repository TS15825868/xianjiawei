/* =========================================================
   TaiShing Site - main.js (Final)
   - Header padding-top auto fix
   - Compact header on scroll
   - Reveal animations（✅ iOS/Safari 首屏不再空白）
   - Floating LINE button helper（用既有 .line-float，沒有才自動生成）
   - Mobile 漢堡選單：點外面 or 捲動自動收合
   ========================================================= */
(function () {
  "use strict";

  function setMainPaddingTop() {
    const header = document.querySelector(".site-header");
    const main = document.querySelector(".site-main");
    if (!header || !main) return;
    const h = header.offsetHeight || 0;
    main.style.paddingTop = `${h + 18}px`;
  }

  function setupCompactHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const onScroll = () => {
      if (window.scrollY > 24) header.classList.add("header--compact");
      else header.classList.remove("header--compact");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ✅ 修正：首屏元素先顯示，避免 iOS/Safari IntersectionObserver 延遲導致空白
  function setupReveal() {
    const targets = document.querySelectorAll(".reveal, .reveal-up");
    if (!targets.length) return;

    function forceRevealAboveFold() {
      const vh = window.innerHeight || 0;
      targets.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.95) el.classList.add("is-visible");
      });
    }

    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "80px 0px 80px 0px" }
    );

    targets.forEach((el) => io.observe(el));

    // 立刻跑一次 + 載入後再補一次（更穩）
    forceRevealAboveFold();
    window.addEventListener("load", forceRevealAboveFold);
    setTimeout(forceRevealAboveFold, 250);
  }

  // 使用現有 .line-float；沒有才建立
  function setupLineFloat() {
    const LINE_URL = "https://lin.ee/sHZW7NkR";

    // 1. 先找看頁面上有沒有 .line-float
    let btn = document.querySelector(".line-float");

    // 2. 如果沒有，就自動生成一顆 .line-float
    if (!btn) {
      btn = document.createElement("a");
      btn.href = LINE_URL;
      btn.className = "line-float";
      btn.target = "_blank";
      btn.rel = "noopener";
      btn.setAttribute("aria-label", "透過 LINE 聯絡我們");

      const img = document.createElement("img");
      img.src = "images/line-float-icon.png";
      img.alt = "LINE";

      btn.appendChild(img);
      document.body.appendChild(btn);
    } else {
      // 保險起見，確保屬性正確
      if (!btn.getAttribute("href")) btn.href = LINE_URL;
      if (!btn.getAttribute("target")) btn.target = "_blank";
      if (!btn.getAttribute("rel")) btn.rel = "noopener";
      if (!btn.getAttribute("aria-label")) {
        btn.setAttribute("aria-label", "透過 LINE 聯絡我們");
      }
    }

    // 3. toast 元件（如果沒存在就建立一個）
    let toast = document.querySelector(".line-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "line-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }

    // 4. 夜間模式 class
    try {
      const h = new Date().getHours();
      if (h >= 19 || h <= 6) btn.classList.add("is-night");
    } catch (_) {}

    // 5. 監控是否接近 footer（縮小、位移用 .is-compact）
    const footer = document.querySelector(".site-footer");
    const updateCompact = () => {
      if (!footer) return;
      const footerTop = footer.getBoundingClientRect().top + window.scrollY;
      const viewportBottom = window.scrollY + window.innerHeight;
      const nearFooter = viewportBottom > footerTop - 120;
      btn.classList.toggle("is-compact", nearFooter);
    };

    updateCompact();
    window.addEventListener("scroll", updateCompact, { passive: true });
    window.addEventListener("resize", updateCompact);

    // 6. 點擊時顯示提示文字
    btn.addEventListener("click", () => {
      if (!toast) return;
      toast.textContent = "正在前往 LINE 諮詢…";
      toast.classList.add("is-show");
      setTimeout(() => toast.classList.remove("is-show"), 1200);
    });
  }

  function setupNavToggle() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".site-nav");
    if (!toggle || !nav) return;

    function closeNav() {
      nav.classList.remove("is-open");
      toggle.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    // default state
    if (!toggle.hasAttribute("aria-expanded")) {
      toggle.setAttribute("aria-expanded", "false");
    }

    // 點漢堡：開 / 關
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      const next = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", next);
      toggle.classList.toggle("is-open", next);
      toggle.setAttribute("aria-expanded", next ? "true" : "false");
    });

    // 點選選單項目後自動收合（含同頁錨點）
    const links = nav.querySelectorAll(".nav-link");
    links.forEach(function (link) {
      link.addEventListener("click", function () {
        if (nav.classList.contains("is-open")) closeNav();
      });
    });

    // 點選「非 nav / 非漢堡」的地方，自動收合
    document.addEventListener("click", function (e) {
      const clickInsideNav = nav.contains(e.target);
      const clickOnToggle = toggle.contains(e.target);
      if (!clickInsideNav && !clickOnToggle) closeNav();
    });

    // 手機版：開始捲動就自動收合
    window.addEventListener(
      "scroll",
      function () {
        if (window.innerWidth <= 768 && nav.classList.contains("is-open")) {
          closeNav();
        }
      },
      { passive: true }
    );
  }

  // ------------------------------
  // ✅ 全站統一：漢堡選單順序 + 拿掉「LINE」項目
  // - 以 JS 生成選單，避免每頁 HTML 都要同步修改
  // - 仍保留各頁面 CTA / 浮動 LINE 按鈕（不影響）
  // ------------------------------
  function setupUnifiedNav() {
    const navUl = document.querySelector(".site-nav ul");
    if (!navUl) return;

    // 你要的固定順序（全站一致）
    const items = [
      { href: "index.html", label: "首頁", key: "home" },
      { href: "index.html#all-products", label: "產品總覽", key: "products" },
      { href: "guide.html", label: "依需求挑選", key: "guide" },
      { href: "tcm.html", label: "中醫觀點", key: "tcm" },
      { href: "about.html", label: "關於我們", key: "about" },
      { href: "faq.html", label: "常見問題", key: "faq" },
      { href: "contact.html", label: "聯絡我們", key: "contact" }
      // ❌ LINE：依你的需求，從漢堡選單移除
    ];

    const path = (window.location.pathname || "").split("/").pop() || "index.html";
    const hash = window.location.hash || "";

    function isActive(key) {
      if (key === "home") return path === "" || path === "index.html";
      if (key === "products") return (path === "" || path === "index.html") && hash === "#all-products";
      if (key === "guide") return path === "guide.html";
      if (key === "tcm") return path === "tcm.html";
      if (key === "about") return path === "about.html";
      if (key === "faq") return path === "faq.html";
      if (key === "contact") return path === "contact.html";
      return false;
    }

    // 生成 HTML
    navUl.innerHTML = items
      .map((it) => {
        const active = isActive(it.key) ? " nav-link--active" : "";
        // 站內連結一律同分頁，不加 target
        return `<li><a href="${it.href}" class="nav-link${active}">${it.label}</a></li>`;
      })
      .join("");
  }

  
  // ------------------------------
  // ✅ 產品「不換頁」彈窗：載入「原本詳細頁」內容（不換頁）
  // - 觸發：.js-product-modal（連結 href 保留原詳情頁，利於 SEO/分享）
  // - 內容：抓取 href 頁面中的 <main>（或 .site-main）塞進彈窗
  // - 支援：Esc/背景/按鈕關閉、頁內錨點在彈窗內滾動、快速跳轉目錄
  // ------------------------------
  function setupProductModalFromPages() {
    // ✅ 全站都要啟用「產品連結 -> 彈窗」的統一規則：
    // - 即使某頁面沒有 .js-product-modal，也要能攔截內容區域內指向產品詳情頁的連結
    // - 避免 FAQ / 故事頁等頁面因為沒有 trigger class 而漏掉彈窗行為

    const modal = ensureProductModal();
    const overlay = modal.querySelector('.modal-overlay');
    const dialog = modal.querySelector('.modal-dialog');
    const titleEl = modal.querySelector('.modal-title');
    const tocEl = modal.querySelector('.modal-toc');
    const bodyEl = modal.querySelector('.modal-body');
    const closeBtn = modal.querySelector('.modal-close');
    let tocToggleBtn = modal.querySelector('.modal-toc-toggle');
    // Back-compat: if modal existed from old build without the toggle button, inject it.
    if (!tocToggleBtn && closeBtn && closeBtn.parentElement) {
      tocToggleBtn = document.createElement('button');
      tocToggleBtn.type = 'button';
      tocToggleBtn.className = 'modal-toc-toggle';
      tocToggleBtn.setAttribute('aria-label', '顯示目錄');
      tocToggleBtn.setAttribute('aria-pressed', 'false');
      tocToggleBtn.textContent = '目錄';
      closeBtn.parentElement.insertBefore(tocToggleBtn, closeBtn);
    }

    // CTA link for "先聊聊狀況" button inside the TOC
    const LINE_URL = 'https://lin.ee/sHZW7NkR';

    let lastFocus = null; // element to restore focus to when modal closes
    let scrollY = 0;

    function focusRestore(el) {
      if (!el || !document.contains(el) || typeof el.focus !== 'function') return;

      const isNaturallyFocusable = (
        el.matches('a[href], button, input, select, textarea, summary') ||
        el.hasAttribute('tabindex')
      );

      let madeTabbable = false;
      if (!isNaturallyFocusable) {
        el.setAttribute('tabindex', '-1');
        madeTabbable = true;
      }

      try {
        // Avoid scroll jumps when possible
        el.focus({ preventScroll: true });
      } catch (e) {
        el.focus();
      }

      if (madeTabbable) {
        // Keep DOM clean
        el.removeAttribute('tabindex');
      }
    }

    function lockScroll() {
      // Robust scroll lock (esp. iOS/Safari): freeze body at current scroll position
      scrollY = window.scrollY || document.documentElement.scrollTop || 0;
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
    }

    function unlockScroll() {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    }

    function openModal(triggerEl) {
      // Prefer the actual click trigger (link/card) over document.activeElement
      lastFocus = triggerEl || document.activeElement;
      modal.classList.remove('is-closing');
      modal.classList.remove('is-body-scrolled');
      lockScroll();
      modal.setAttribute('aria-hidden', 'false');
      modal.classList.add('is-open');
      // focus close for accessibility
      setTimeout(() => closeBtn && closeBtn.focus(), 0);
    }

    function closeModal() {
      if (!modal.classList.contains('is-open')) return;
      if (modal.classList.contains('is-closing')) return;

      // Fade-out animation
      modal.classList.add('is-closing');
      setTimeout(() => {
        modal.classList.remove('is-open');
        modal.classList.remove('is-closing');
        modal.classList.remove('is-body-scrolled');
        modal.setAttribute('aria-hidden', 'true');
        unlockScroll();

        // restore focus back to the trigger element
        if (lastFocus) setTimeout(() => focusRestore(lastFocus), 0);
      }, 200);
    }

    function setLoading(titleText) {
      titleEl.textContent = titleText || '產品介紹';
      tocEl.innerHTML = '';
      bodyEl.innerHTML = (
        '<div class="modal-loading">'
        + '<div class="modal-loading-bar"></div>'
        + '<div class="modal-loading-bar"></div>'
        + '<div class="modal-loading-bar"></div>'
        + '</div>'
      );
    }

    function buildToc(container) {
      const all = Array.from(container.querySelectorAll('h2[id], h3[id]'))
        .filter(h => (h.textContent || '').trim().length > 0);

      if (!all.length) {
        tocEl.innerHTML = '';
        return;
      }

      // Prefer a few practical jumps: 規格 / 成分 / 吃法 / FAQ / 保存 / 注意
      const prefer = [
        { key: 'aud',   re: /(適合|族群|對象|誰適合|推薦對象)/ },
        { key: 'spec',  re: /(規格|容量|重量|包裝|內容量)/ },
        { key: 'ing',   re: /(成分|原料|配方|內容物)/ },
        { key: 'use',   re: /(吃法|用法|使用|怎麼吃|沖泡|料理)/ },
        { key: 'faq',   re: /(常見問題|FAQ)/i },
        { key: 'keep',  re: /(保存|存放|冷藏|保存方式)/ },
        { key: 'note',  re: /(注意|提醒|不建議|不適合|禁忌)/ },
        // Optional CTA-like heading; will be transformed into LINE consultation button
        { key: 'chat',  re: /(先聊聊狀況|再評估|評估是否適用|聊聊狀況)/ }
      ];

      const picked = [];
      const usedKeys = new Set();

      for (const h of all) {
        const t = (h.textContent || '').trim();
        for (const p of prefer) {
          if (usedKeys.has(p.key)) continue;
          if (p.re.test(t)) {
            picked.push(h);
            usedKeys.add(p.key);
            break;
          }
        }
      }

      // Fill remaining slots with the first few headings (keep overall order)
      for (const h of all) {
        if (picked.includes(h)) continue;
        picked.push(h);
        if (picked.length >= 8) break;
      }

      const labelFor = (text) => {
        const t = (text || '').trim();
        if (/(先聊聊狀況|聊聊狀況|再評估|評估是否適用)/.test(t)) return '先聊聊狀況';
        if (/(適合|族群|對象|誰適合|推薦對象)/.test(t)) return '適合族群';
        if (/(吃法|用法|使用|怎麼吃|沖泡|料理)/.test(t)) return '使用方式';
        if (/(常見問題|FAQ)/i.test(t)) return '常見問題';
        if (/(成分|原料|配方|內容物)/.test(t)) return '成份';
        if (/(規格|容量|重量|包裝|內容量)/.test(t)) return '規格';
        if (/(保存|存放|冷藏|保存方式)/.test(t)) return '保存';
        if (/(注意|提醒|不建議|不適合|禁忌)/.test(t)) return '注意';
        return t;
      };

      const frag = document.createDocumentFragment();
      picked.slice(0, 8).forEach(h => {
        const raw = (h.textContent || '').trim();
        const label = labelFor(raw);

        const a = document.createElement('a');
        a.className = 'modal-toc-link';

        // Transform specific heading into LINE CTA button
        if (label === '先聊聊狀況') {
          a.classList.add('modal-toc-cta');
          a.href = LINE_URL;
          a.target = '_blank';
          a.rel = 'noopener';
        } else {
          a.href = '#' + h.id;
        }

        a.textContent = label;
        frag.appendChild(a);
      });

      tocEl.innerHTML = '';
      tocEl.appendChild(frag);
    }

    function scrollToAnchor(anchorId) {
      const target = bodyEl.querySelector('#' + CSS.escape(anchorId));
      if (!target) return;
      const top = target.getBoundingClientRect().top - bodyEl.getBoundingClientRect().top + bodyEl.scrollTop - 8;
      bodyEl.scrollTo({ top, behavior: 'smooth' });
    }

    // TOC quick-jump inside modal (避免只改 hash、不滾動)
    tocEl.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      // CTA button opens LINE; do not intercept
      if (link.classList.contains('modal-toc-cta')) return;
      const href = link.getAttribute('href') || '';
      if (!href.startsWith('#')) return;
      e.preventDefault();
      scrollToAnchor(href.slice(1));
    });

    async function loadPageIntoModal(href, fallbackTitle) {
      setLoading(fallbackTitle);

      try {
        // ✅ 若使用者以本機檔案（file://）直接開啟，瀏覽器多半會阻擋 fetch。
        //    這會造成「彈窗開了但沒有產品內容」。此情境直接跳頁，避免空白。
        if (location.protocol === 'file:') {
          location.href = href;
          return;
        }

        const res = await fetch(href, { cache: 'no-store' });
        if (!res.ok) throw new Error('Fetch failed: ' + res.status);
        const html = await res.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // Title
        const pageTitle = (doc.querySelector('title')?.textContent || '').trim();
        titleEl.textContent = pageTitle || fallbackTitle || '產品介紹';

        // Main
        const main = doc.querySelector('main') || doc.querySelector('.site-main') || doc.body;
        const wrapper = document.createElement('div');
        wrapper.className = 'modal-page';
        wrapper.innerHTML = main.innerHTML;

        // Remove nested floating LINE buttons or duplicate wrappers if any
        wrapper.querySelectorAll('.line-float, .site-header, .site-footer, script, noscript').forEach(el => el.remove());

        // ✅ 詳情頁多數區塊使用 .reveal 動畫；在彈窗內沒有 IntersectionObserver 觸發，
        //    會導致「圖片/文字看不到」。在彈窗中直接強制顯示。
        wrapper.querySelectorAll('.reveal, .reveal-up').forEach(el => {
          el.classList.add('is-visible');
        });

        // ✅ 將詳情頁內的「← 返回產品列表」在彈窗模式下改成「關閉」並直接關閉彈窗
        wrapper.querySelectorAll('.back-link').forEach((a) => {
          a.textContent = '關閉';
          a.setAttribute('href', '#');
          a.setAttribute('role', 'button');
          a.classList.add('modal-close-link');
          a.addEventListener('click', (evt) => {
            evt.preventDefault();
            closeModal();
          });
        });

        // Ensure IDs exist for headings so toc/anchors work reliably
        const used = new Set();
        const slugify = (text) => {
          const base = (text || '')
            .toString()
            .trim()
            .toLowerCase()
            // keep chinese/english/nums, collapse others into '-'
            .replace(/[^\u4e00-\u9fff\w\s-]+/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
          return base || 'section';
        };

        wrapper.querySelectorAll('h2, h3').forEach((h, idx) => {
          const rawId = (h.getAttribute('id') || '').trim();
          let id = rawId || slugify(h.textContent);
          // Guarantee uniqueness
          let n = 1;
          let candidate = id;
          while (used.has(candidate) || wrapper.querySelector('#' + CSS.escape(candidate))) {
            n += 1;
            candidate = id + '-' + n;
          }
          id = candidate;
          used.add(id);
          h.id = id;
        });

        // Inject
        bodyEl.innerHTML = '';
        bodyEl.appendChild(wrapper);
        buildToc(wrapper);

        // If URL already has hash, scroll to it
        const hashIndex = href.indexOf('#');
        if (hashIndex > -1) {
          const anchorId = href.slice(hashIndex + 1);
          setTimeout(() => scrollToAnchor(anchorId), 60);
        } else {
          bodyEl.scrollTop = 0;
        }
      } catch (err) {
        console.error(err);
        titleEl.textContent = fallbackTitle || '產品介紹';
        tocEl.innerHTML = '';
        bodyEl.innerHTML = (
          '<div class="modal-error">'
          + '<p>目前無法載入產品內容。你可以改用「開啟完整頁」查看。</p>'
          + '<p style="margin-top:12px;">'
          +   '<a class="btn-outline-gold" href="' + href + '">開啟完整頁</a>'
          + '</p>'
          + '</div>'
        );
      }
    }

    // Trigger click (event delegation)
    // ✅ 全站「產品詳情頁」連結一律彈窗（但不動 header/nav/footer 的必要導頁）
    if (!document.documentElement.dataset.productModalDelegated) {
      document.documentElement.dataset.productModalDelegated = '1';

      // Product detail pages that should open in modal when clicked within page content
      const PRODUCT_DETAIL_PAGES = new Set([
        'guilu.html',
        'guilu-drink.html',
        'soup.html',
        'antler.html',
        'lurong.html',
        'guilu-line.html'
      ]);

      const isInterceptCandidate = (a) => {
        if (!a) return false;

        // Exclude navigation + footer (必要導頁行為不改)
        if (a.closest('.site-header, .site-nav, .site-footer')) return false;
        if (a.classList.contains('nav-link')) return false;

        const href = (a.getAttribute('href') || '').trim();
        if (!href) return false;
        if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
        if (href.startsWith('#')) return false; // same-page anchors remain as-is

        // Normalize to filename (remove query/hash, leading ./)
        const noQuery = href.split('?')[0];
        const noHash = noQuery.split('#')[0];
        const file = noHash.replace(/^\.\//, '').split('/').pop();

        return PRODUCT_DETAIL_PAGES.has(file);
      };

      document.addEventListener('click', (e) => {
        const a = e.target.closest('a');
        if (!a) return;

        // Allow Cmd/Ctrl/Shift/Alt click to keep default behavior (new tab / select)
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        // 1) Explicit triggers keep working
        if (a.classList.contains('js-product-modal')) {
          const href = a.getAttribute('href');
          if (!href) return;
          e.preventDefault();
          const title = a.getAttribute('aria-label') || a.getAttribute('title') || (a.textContent || '').trim() || '產品介紹';
          loadPageIntoModal(href, title);
          openModal(a);
          return;
        }

        // 2) Any internal link pointing to product detail pages inside content -> modal
        if (isInterceptCandidate(a)) {
          const href = a.getAttribute('href');
          e.preventDefault();
          const title = a.getAttribute('aria-label') || a.getAttribute('title') || (a.textContent || '').trim() || '產品介紹';
          loadPageIntoModal(href, title);
          openModal(a);
        }
      });
    }

    // Close handlers
    if (overlay) overlay.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Stop click bubbling inside dialog
    if (dialog) dialog.addEventListener('click', (e) => e.stopPropagation());

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });

    // Inner links: for hash links, scroll inside modal; external links open new tab
    bodyEl.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href') || '';

      if (href.startsWith('#')) {
        e.preventDefault();
        scrollToAnchor(href.slice(1));
        return;
      }

      // If link points to another product/detail page on same site, open in modal
      if (!href.startsWith('http') && (href.endsWith('.html') || href.includes('.html#'))) {
        e.preventDefault();
        loadPageIntoModal(href, a.textContent.trim() || '內容');
      }
    });

    // Fade out TOC when user scrolls down inside the modal (reduces top obstruction on mobile)
    bodyEl.addEventListener('scroll', () => {
      const y = bodyEl.scrollTop || 0;
      modal.classList.toggle('is-body-scrolled', y > 56);
    }, { passive: true });

    // When TOC is faded out (is-body-scrolled), provide a small "目錄" button to bring it back on-demand.
    let tocPeekTimer = null;

    function setTocToggleState() {
      if (!tocToggleBtn) return;
      const peek = modal.classList.contains('is-toc-peek');
      tocToggleBtn.setAttribute('aria-pressed', peek ? 'true' : 'false');
      tocToggleBtn.setAttribute('aria-label', peek ? '收起目錄' : '顯示目錄');
      tocToggleBtn.textContent = peek ? '收起' : '目錄';
    }

    if (tocToggleBtn) {
      tocToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Toggle "peek" mode: show TOC temporarily without forcing scroll-to-top.
        const next = !modal.classList.contains('is-toc-peek');
        modal.classList.toggle('is-toc-peek', next);
        setTocToggleState();

        if (tocPeekTimer) clearTimeout(tocPeekTimer);
        if (next) {
          // Auto-hide after a short duration to avoid blocking content.
          tocPeekTimer = setTimeout(() => {
            modal.classList.remove('is-toc-peek');
            setTocToggleState();
          }, 6000);

          // Focus the first TOC link if available (accessibility + fast navigation)
          const firstLink = tocEl ? tocEl.querySelector('a') : null;
          if (firstLink) {
            try { firstLink.focus({ preventScroll: true }); } catch (_) { firstLink.focus(); }
          }
        }
      });
      setTocToggleState();
    }

    // If user scrolls again, dismiss peek mode (so it doesn't keep covering content).
    bodyEl.addEventListener('scroll', () => {
      if (modal.classList.contains('is-toc-peek')) {
        modal.classList.remove('is-toc-peek');
        setTocToggleState();
      }
    }, { passive: true });

    function ensureProductModal() {
      let existing = document.getElementById('productModal');
      if (existing) return existing;

      const modalEl = document.createElement('div');
      modalEl.id = 'productModal';
      modalEl.className = 'modal';
      modalEl.setAttribute('role', 'dialog');
      modalEl.setAttribute('aria-modal', 'true');
      modalEl.setAttribute('aria-hidden', 'true');

      modalEl.innerHTML = (
        '<div class="modal-overlay" aria-hidden="true"></div>'
        + '<div class="modal-dialog" role="document">'
          + '<div class="modal-head">'
            + '<div class="modal-head-left">'
              + '<div class="modal-title">產品介紹</div>'
              + '<div class="modal-toc" aria-label="快速跳轉"></div>'
            + '</div>'
            + '<div class="modal-head-right">'
              + '<button type="button" class="modal-toc-toggle" aria-label="顯示目錄" aria-pressed="false">目錄</button>'
              + '<button type="button" class="modal-close" aria-label="關閉">×</button>'
            + '</div>'
          + '</div>'
          + '<div class="modal-body" tabindex="0"></div>'
        + '</div>'
      );

      document.body.appendChild(modalEl);
      return modalEl;
    }
  }

function setupBackLinks() {
    const backButtons = document.querySelectorAll(".back-link");
    if (!backButtons.length) return;

    const nav = document.querySelector(".site-nav");

    function closeNav() {
      if (nav && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
      }
    }

    backButtons.forEach((btn) => {
      btn.addEventListener("click", function (event) {
        event.preventDefault();
        closeNav();
        window.location.href = "index.html#all-products";
      });
    });
  }

  function init() {
    setMainPaddingTop();
    setupBackLinks();
    setupUnifiedNav();
    setupNavToggle();
    setupCompactHeader();
    setupReveal();
    setupLineFloat();
    setupProductModalFromPages();

    window.addEventListener("resize", setMainPaddingTop);

    // ✅ 載入完成再補跑一次，避免首屏計算因字體/圖片造成偏差
    window.addEventListener("load", setMainPaddingTop);
    setTimeout(setMainPaddingTop, 250);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
