(function(){

if(typeof ARTICLES==="undefined"){
console.warn("ARTICLES 未載入");
return;
}

const container=document.getElementById("popular-articles");

if(!container) return;


/* =========================
取得熱門文章
========================= */

const popular=ARTICLES
.filter(a=>a.popular===true)
.slice(0,3);


/* =========================
生成卡片
========================= */

let html="";

popular.forEach(article=>{

html+=`

<a href="articles/${article.url}" class="product-card reveal">

<img
src="${article.image}"
alt="${article.title}"
loading="lazy"
onerror="this.src='images/logo-seal.png';this.classList.add('img-placeholder');"
>

<h3>${article.title}</h3>

<p>${article.summary || "龜鹿知識"}</p>

</a>

`;

});

container.innerHTML=html;


/* =========================
Reveal 動畫
========================= */

requestAnimationFrame(()=>{

container.querySelectorAll(".reveal").forEach(el=>{
el.classList.add("show");
});

});

})();
