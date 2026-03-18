document.addEventListener("DOMContentLoaded", () => {

const menu = document.getElementById("menuOverlay");
const btn = document.querySelector(".menu-btn");

menu.innerHTML = `
<a href="index.html">首頁</a>
<a href="guilu-series.html">龜鹿系列</a>
<a href="choose.html">怎麼選龜鹿</a>
<a href="articles.html">龜鹿知識</a>
<a href="faq.html">FAQ</a>

<a href="https://lin.ee/sHZW7NkR?text=我想詢問龜鹿產品" class="btn btn-line">
LINE詢問
</a>
`;

btn.addEventListener("click", ()=>{
menu.classList.toggle("active");
});

menu.querySelectorAll("a").forEach(link=>{
link.addEventListener("click", ()=>{
menu.classList.remove("active");
});
});

});
