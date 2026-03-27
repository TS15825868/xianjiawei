// menu
const menuBtn = document.querySelector('.menu-btn');
const menu = document.querySelector('.menu-panel');

menuBtn?.addEventListener('click', () => {
  menu.classList.toggle('active');
});

document.addEventListener('click', (e) => {
  if (!menu?.contains(e.target) && !menuBtn?.contains(e.target)) {
    menu?.classList.remove('active');
  }
});

// modal
function openModal() {
  document.querySelector('.modal').classList.add('active');
  document.body.classList.add('modal-open');
}

function closeModal() {
  document.querySelector('.modal').classList.remove('active');
  document.body.classList.remove('modal-open');
}

// ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});
