document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("menuOverlay");
  const btn = document.querySelector(".menu-btn");
  if (!menu || !btn) return;

  menu.innerHTML = `
    <a href="index.html">首頁</a>
    <a href="guilu-series.html">龜鹿系列</a>
    <a href="choose.html">怎麼選龜鹿</a>
    <a href="recipes.html">料理搭配</a>
    <a href="articles.html">龜鹿知識</a>
    <a href="brand.html">品牌故事</a>
    <a href="faq.html">FAQ</a>
    <a href="https://lin.ee/sHZW7NkR?text=我想詢問仙加味產品" class="btn btn-line">LINE 詢問</a>
  `;

  const setOpen = (open) => {
    menu.classList.toggle("active", open);
    document.body.classList.toggle("menu-open", open);
    btn.setAttribute("aria-expanded", String(open));
  };

  btn.addEventListener("click", () => setOpen(!menu.classList.contains("active")));
  window.toggleMenu = () => setOpen(!menu.classList.contains("active"));

  menu.addEventListener("click", (e) => {
    if (e.target === menu) setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  document.querySelectorAll(".faq-item").forEach((item) => {
    const q = item.querySelector(".faq-q");
    const a = item.querySelector(".faq-a");
    if (!q || !a) return;
    a.hidden = true;
    q.addEventListener("click", () => {
      const isOpen = !a.hidden;
      a.hidden = isOpen;
      q.setAttribute("aria-expanded", String(!isOpen));
    });
  });
});
