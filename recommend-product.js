/* Product Recommendation */

(function(){

const container = document.createElement("section");

container.className = "section reveal";

container.innerHTML = `

<h2>相關產品</h2>

<div class="product-grid">

<a href="../product.html?id=guilu-gao" class="product-card">
<h3>龜鹿膏</h3>
<p>日常補養型態</p>
</a>

<a href="../product.html?id=guilu-drink" class="product-card">
<h3>龜鹿飲</h3>
<p>即飲型態</p>
</a>

<a href="../product.html?id=lurong-powder" class="product-card">
<h3>鹿茸粉</h3>
<p>飲品搭配</p>
</a>

</div>

`;

document.body.appendChild(container);

})();
