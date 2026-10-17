"use strict";
/* 仙加味單品真實照片檢視器：手機保留關閉／返回，不跳到無法操作的圖片分頁。 */
(() => {
  if (window.__XJW_PUBLIC_PRODUCT_LIGHTBOX__) return;
  window.__XJW_PUBLIC_PRODUCT_LIGHTBOX__ = true;
  let overlay = null, restoreFocus = null, lastScrollStyle = "";
  const isPhoto = link => /\.(?:png|jpe?g|webp|avif)(?:[?#]|$)/i.test(link);
  function closeViewer() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.body.style.overflow = lastScrollStyle;
    if (restoreFocus && restoreFocus.isConnected) restoreFocus.focus({preventScroll:true});
  }
  function openViewer(anchor) {
    const raw = anchor.getAttribute("href");
    if (!raw || !isPhoto(raw)) return;
    closeViewer();
    restoreFocus = anchor;
    lastScrollStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    overlay = document.createElement("div");
    overlay.className = "xjw-photo-viewer";
    overlay.setAttribute("role","dialog");
    overlay.setAttribute("aria-modal","true");
    overlay.setAttribute("aria-label","仙加味完整商品照片");
    const heading = document.createElement("div");
    heading.className = "xjw-photo-viewer__bar";
    const back = document.createElement("button");
    back.type = "button"; back.className = "xjw-photo-viewer__back";
    back.textContent = "← 返回商品"; back.addEventListener("click",closeViewer);
    const x = document.createElement("button");
    x.type = "button"; x.className = "xjw-photo-viewer__close";
    x.textContent = "✕ 關閉"; x.setAttribute("aria-label","關閉照片");
    x.addEventListener("click",closeViewer);
    heading.append(back,x);
    const img = document.createElement("img");
    img.className = "xjw-photo-viewer__image";
    img.src = raw; img.alt = anchor.querySelector("img")?.alt || anchor.textContent.trim() || "商品實物照片";
    const frame = document.createElement("div");
    frame.className = "xjw-photo-viewer__frame";
    frame.append(img);
    overlay.append(heading,frame);
    overlay.addEventListener("click",event=>{if(event.target===overlay)closeViewer();});
    document.body.append(overlay);
    x.focus({preventScroll:true});
  }
  document.addEventListener("click",event=>{
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest?.("a[href]");
    if (!anchor || !document.body?.matches('[data-page="product-detail"]')) return;
    if (!isPhoto(anchor.getAttribute("href")||"") || !anchor.closest(".product-detail-page")) return;
    event.preventDefault();
    openViewer(anchor);
  },true);
  document.addEventListener("keydown",event=>{
    if (!overlay) return;
    if (event.key === "Escape" || event.key === "Backspace") {
      event.preventDefault(); closeViewer();
    } else if (event.key === "Tab") {
      const btns=overlay.querySelectorAll("button");
      if (event.shiftKey && document.activeElement === btns[0]) {event.preventDefault();btns[1].focus();}
      else if(!event.shiftKey && document.activeElement === btns[1]) {event.preventDefault();btns[0].focus();}
    }
  });
  const style = document.createElement("style");
  style.textContent = [
    ".xjw-photo-viewer{position:fixed;inset:0;z-index:2147483000;background:rgba(16,23,28,.96);display:flex;flex-direction:column;overflow:hidden;padding:0 env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}",
    ".xjw-photo-viewer__bar{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:64px;padding:calc(9px + env(safe-area-inset-top)) 16px 10px;flex-shrink:0;background:#F7F4ED}",
    ".xjw-photo-viewer__bar button{appearance:none;border:1px solid #8b7652;border-radius:10px;padding:12px 16px;background:#F7F4ED;color:#661d22;font:600 16px/1.25 system-ui,sans-serif;cursor:pointer;min-height:48px;touch-action:manipulation}",
    ".xjw-photo-viewer__bar button:focus-visible{outline:3px solid #9e8b62;outline-offset:2px}",
    ".xjw-photo-viewer__frame{flex:1;min-height:0;display:grid;place-items:center;overflow:auto;padding:12px}",
    ".xjw-photo-viewer__image{display:block;max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;background:#F7F4ED;border:0;box-shadow:none}",
    "@media(max-width:600px){.xjw-photo-viewer__bar{padding-inline:12px}.xjw-photo-viewer__bar button{font-size:15px;padding:10px 12px}.xjw-photo-viewer__frame{padding:8px}}"
  ].join("\n");
  document.head.append(style);
})();
