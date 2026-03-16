/* =========================
   Article Recommendation
========================= */

(function(){

/* 只在文章頁面啟動 */

if(!location.pathname.includes("articles/")) return;


/* 避免重複插入 */

if(document.querySelector(".related-articles")) return;


/* 找到文章主內容 */

const main = document.querySelector("main") || document.body;


/* 建立推薦區塊 */

const container = document.createElement("section");

container.className = "section reveal related-articles";

container.innerHTML = `

<h2>相關閱讀</h2>

<div class="product-grid">

<a href="../articles/what-is-guilu.html" class="product-card">
<h3>什麼是龜鹿</h3>
<p>龜板與鹿角的飲食文化</p>
</a>

<a href="../articles/how-to-eat-guilu.html" class="product-card">
<h3>龜鹿怎麼吃</h3>
<p>日常食用方式整理</p>
</a>

<a href="../articles/guilu-drink-how.html" class="product-card">
<h3>龜鹿飲怎麼喝</h3>
<p>即飲與加熱方式</p>
</a>

</div>


<h2 style="margin-top:60px;">料理搭配</h2>

<div class="product-grid">

<a href="../articles/guilu-chicken-soup.html" class="product-card">
<h3>龜鹿雞湯</h3>
<p>燉雞湯料理</p>
</a>

<a href="../articles/guilu-pork-ribs.html" class="product-card">
<h3>龜鹿排骨湯</h3>
<p>家常燉湯</p>
</a>

<a href="../articles/lurong-coffee.html" class="product-card">
<h3>鹿茸咖啡</h3>
<p>飲品搭配</p>
</a>

</div>


<h2 style="margin-top:60px;">相關產品</h2>

<div class="product-grid">

<a href="../product.html?id=guilu-gao&from=articles" class="product-card">
<h3>龜鹿膏</h3>
<p>日常補養型態</p>
</a>

<a href="../product.html?id=guilu-drink&from=articles" class="product-card">
<h3>龜鹿飲</h3>
<p>即飲型態</p>
</a>

<a href="../product.html?id=lurong-powder&from=articles" class="product-card">
<h3>鹿茸粉</h3>
<p>飲品搭配</p>
</a>

</div>

`;


/* 插入文章底部 */

main.appendChild(container);


/* 觸發 reveal 動畫 */

setTimeout(()=>{

container.classList.add("show");

},200);

})();
