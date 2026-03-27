// ===== 漢堡 =====
const menuBtn = document.querySelector('.menu-btn');
const menu = document.querySelector('.menu-panel');

menuBtn.addEventListener('click', () => {
  menu.classList.toggle('active');
});

// 點外面關閉
document.addEventListener('click', (e) => {
  if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
    menu.classList.remove('active');
  }
});

// ===== Modal =====
function openModal() {
  document.querySelector('.modal').classList.add('active');
  document.body.classList.add('modal-open');
}

function closeModal() {
  document.querySelector('.modal').classList.remove('active');
  document.body.classList.remove('modal-open');
}
