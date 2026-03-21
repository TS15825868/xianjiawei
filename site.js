// ===== 初始化 =====
document.addEventListener("DOMContentLoaded", () => {

  // ===== 漢堡選單 =====
  const menuBtn = document.querySelector(".menu-btn");
  const menuOverlay = document.getElementById("menuOverlay");

  if (menuBtn && menuOverlay) {
    menuBtn.addEventListener("click", () => {
      menuOverlay.classList.add("active");
    });
  }

  // ===== 點背景關閉 =====
  if (menuOverlay) {
    menuOverlay.addEventListener("click", (e) => {
      if (e.target === menuOverlay) {
        closeMenu();
      }
    });
  }

});

// ===== 關閉選單（全站可用）=====
function closeMenu() {
  const menuOverlay = document.getElementById("menuOverlay");
  if (menuOverlay) {
    menuOverlay.classList.remove("active");
  }
}
