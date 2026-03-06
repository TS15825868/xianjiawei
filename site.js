function toggleMenu(open){
  const d = document.getElementById('drawer');
  const o = document.getElementById('overlay');

  if(!d || !o) return;

  const willOpen = (typeof open === 'boolean') ? open : !d.classList.contains('open');

  if(willOpen){
    // ✅ iOS Safari：開啟時鎖定成實際高度，避免底部露出/捲到底被擋
    d.style.height = window.innerHeight + 'px';

    d.classList.add('open');
    o.classList.add('open');
    document.body.classList.add('menu-open');
  }else{
    d.classList.remove('open');
    o.classList.remove('open');
    document.body.classList.remove('menu-open');
    d.style.height = '';
  }
}

// ESC 關閉
document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape') toggleMenu(false);
});

// 點 overlay 關閉
document.addEventListener('click', (e)=>{
  if(e.target && e.target.id === 'overlay') toggleMenu(false);
});

// 點抽屜連結就關閉（可選）
document.addEventListener('click', (e)=>{
  const d = document.getElementById('drawer');
  if(!d || !d.classList.contains('open')) return;

  const link = e.target.closest('a');
  if(link && d.contains(link)) toggleMenu(false);
});

// 旋轉/縮放時更新高度
window.addEventListener('resize', ()=>{
  const d = document.getElementById('drawer');
  if(d && d.classList.contains('open')){
    d.style.height = window.innerHeight + 'px';
  }
});

// Floating LINE button（全站共用）
document.addEventListener('DOMContentLoaded', ()=>{
  if(document.querySelector('.line-float')) return;

  const a = document.createElement('a');
  a.className = 'line-float';
  a.href = 'https://lin.ee/sHZW7NkR';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.setAttribute('aria-label', 'LINE 詢問');
  a.innerHTML = `<span class="line-float__text">LINE</span>`;

  document.body.appendChild(a);
});


// TikTok embeds for videos page
document.addEventListener('click', (e)=>{
  const btn = e.target.closest('.video-load');
  if(!btn) return;
  const wrap = btn.closest('.video-embed');
  if(!wrap) return;
  const videoId = wrap.getAttribute('data-video-id');
  if(!videoId) return;
  wrap.innerHTML = `<iframe class="video-frame" src="https://www.tiktok.com/embed/v2/${videoId}" allowfullscreen loading="lazy"></iframe>`;
});
