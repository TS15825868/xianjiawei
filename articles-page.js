(function(){

const container = document.getElementById("article-grid");

if(!container) return;

/* 確保 articles.js 已載入 */

if(typeof ARTICLES === "undefined"){
console.warn("ARTICLES 未載入");
return;
}

/* 最新文章排前面 */

const list = [...ARTICLES].reverse();

let html = "";

list.forEach(a => {

html += `

<a href="articles/${a.url}" class="product-card reveal">

<img src="${a.image}" alt="${a.title}" loading="lazy">

<h3>${a.title}</h3>

<p>${a.summary || "龜鹿知識"}</p>

</a>

`;

});

container.innerHTML = html;

/* reveal 動畫 */

setTimeout(()=>{

document.querySelectorAll(".reveal").forEach(el=>{
el.classList.add("show");
});

},100);

})();
