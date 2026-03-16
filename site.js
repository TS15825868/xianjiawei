
const menuBtn = document.getElementById('menuBtn');
const menuOverlay = document.getElementById('menuOverlay');
if (menuBtn && menuOverlay) {
  const closeMenu = () => menuOverlay.classList.remove('show');
  menuBtn.addEventListener('click', (e) => { e.stopPropagation(); menuOverlay.classList.toggle('show'); });
  menuOverlay.addEventListener('click', (e) => { if (e.target === menuOverlay) closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
}
const cards = document.querySelectorAll('.card');
cards.forEach(card => {
  card.addEventListener('mousemove', (e) => {
    if (window.innerWidth < 960) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left; const y = e.clientY - rect.top;
    const rotateY = (x - rect.width / 2) / 28; const rotateX = (rect.height / 2 - y) / 28;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});
