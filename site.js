"use strict";

(function(){

function openLine(msg){
  window.open("https://lin.ee/sHZW7NkR?text=" + encodeURIComponent(msg));
}
window.openLine = openLine;

/* ===== 漢堡 ===== */
function toggleMenu(force){
  const m = document.getElementById('menuOverlay');
  if(!m) return;

  const open = typeof force === 'boolean'
    ? force
    : !m.classList.contains('active');

  m.classList.toggle('active', open);
  document.body.style.overflow = open ? 'hidden':'';
}
window.toggleMenu = toggleMenu;

/* ===== AI推薦（網站版）===== */
function recommend(level){

  let text = "";

  if(level === "start"){
    text = "建議先從：龜鹿膏 或 龜鹿飲";
  }

  if(level === "daily"){
    text = "建議：龜鹿膏 + 龜鹿湯塊";
  }

  if(level === "pro"){
    text = "建議：龜鹿膏 + 龜鹿飲 + 龜鹿湯塊 + 鹿茸粉";
  }

  document.getElementById("result").innerHTML = `
    <h3>推薦結果</h3>
    <p>${text}</p>
    <button onclick="openLine('依推薦幫我搭配')">👉 LINE直接幫我配</button>
  `;
}
window.recommend = recommend;

/* ===== 彈窗 ===== */
function openProduct(name){

  const modal = document.getElementById("modal");

  modal.innerHTML = `
  <div class="modal-box">

    <div onclick="closeModal()" class="close">✕</div>

    <h2>${name}</h2>

    <p>
    以龜板萃取物與鹿角萃取物為基礎，
    製成日常可使用的型態。
    </p>

    <h3>使用方式</h3>
    <ul>
      <li>日常食用</li>
      <li>搭配熱水或料理</li>
    </ul>

    <button onclick="openLine('我想了解${name}')">
      👉 官方 LINE 諮詢
    </button>

  </div>
  `;

  modal.classList.add("show");
}
window.openProduct = openProduct;

function closeModal(){
  document.getElementById("modal").classList.remove("show");
}
window.closeModal = closeModal;

/* ===== 初始化 ===== */
document.addEventListener("DOMContentLoaded",()=>{

  const menu = document.getElementById("menuOverlay");

  if(menu){
    menu.innerHTML = `

    <a onclick="openLine('幫我搭配')">👉 官方 LINE 諮詢</a>

    <div class="group">產品</div>
    <a href="product.html">產品總覽</a>

    <div class="group">推薦</div>
    <a href="recommend.html">自動推薦</a>

    <div class="group">使用</div>
    <a href="how-to-use.html">使用方式</a>
    <a href="recipes.html">料理搭配</a>

    <div class="group">知識</div>
    <a href="guilu-what.html">龜鹿是什麼</a>
    <a href="video.html">影片</a>

    <div class="group">其他</div>
    <a href="faq.html">FAQ</a>
    `;
  }

});

})();
