(function(){

/* ===== LINE ===== */
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

/* ===== AI推薦（核心🔥）===== */
function recommendFlow(step, value){

  const box = document.getElementById("aiBox");

  if(step === 1){
    box.innerHTML = `
      <h3>你現在的狀態</h3>
      <button onclick="recommendFlow(2,'start')">入門開始</button>
      <button onclick="recommendFlow(2,'daily')">日常補養</button>
      <button onclick="recommendFlow(2,'pro')">完整搭配</button>
    `;
    return;
  }

  if(step === 2){
    let result = "";

    if(value === "start"){
      result = "建議：龜鹿膏 或 龜鹿飲（先建立習慣）";
    }

    if(value === "daily"){
      result = "建議：龜鹿膏＋龜鹿湯塊（最多人這樣用）";
    }

    if(value === "pro"){
      result = "建議：龜鹿膏＋龜鹿飲＋龜鹿湯塊＋鹿茸粉（完整搭配）";
    }

    box.innerHTML = `
      <h3>推薦結果</h3>
      <p>${result}</p>

      <button onclick="openLine('依照推薦幫我搭配')">
        👉 直接幫我搭配
      </button>

      <button onclick="recommendFlow(1)">
        重新選擇
      </button>
    `;
  }

}
window.recommendFlow = recommendFlow;

/* ===== 產品彈窗（成交版🔥）===== */
function openProduct(name){

  const modal = document.getElementById("productModal");

  modal.innerHTML = `
  <div class="modal-content">

    <div class="modal-close" onclick="closeModal()">✕</div>

    <h2>${name}</h2>

    <p>
    以龜板萃取物與鹿角萃取物為基礎，
    轉化為日常可使用的型態。
    </p>

    <h3>適合這樣的你</h3>
    <ul>
      <li>想建立日常習慣</li>
      <li>不想太複雜</li>
    </ul>

    <h3>常見使用方式</h3>
    <ul>
      <li>每日食用</li>
      <li>搭配熱水或料理</li>
    </ul>

    <button onclick="openLine('我想了解${name}')">
      👉 官方 LINE 諮詢
    </button>

  </div>
  `;

  modal.classList.add("active");
}
window.openProduct = openProduct;

function closeModal(){
  document.getElementById("productModal").classList.remove("active");
}
window.closeModal = closeModal;

/* ===== 初始化 ===== */
document.addEventListener("DOMContentLoaded",()=>{

  const menu = document.getElementById("menuOverlay");

  if(menu){
    menu.innerHTML = `
      <a onclick="openLine('幫我搭配')">👉 官方 LINE 諮詢</a>

      <div class="menu-group">產品系列</div>
      <a href="product.html">龜鹿系列</a>

      <div class="menu-group">推薦</div>
      <a href="recommend.html">AI推薦</a>

      <div class="menu-group">使用</div>
      <a href="how-to-use.html">怎麼使用</a>
      <a href="recipes.html">料理搭配</a>

      <div class="menu-group">內容</div>
      <a href="video.html">影片</a>
      <a href="faq.html">FAQ</a>

      <div class="menu-group">品牌</div>
      <a href="brand.html">品牌介紹</a>
    `;
  }

});
})();
