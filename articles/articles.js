const ARTICLES = [

{
title:"什麼是龜鹿",
url:"what-is-guilu.html",
category:"knowledge"
},

{
title:"龜鹿怎麼吃",
url:"how-to-eat-guilu.html",
category:"eat"
},

{
title:"鹿茸粉怎麼吃",
url:"lurong-how.html",
category:"drink"
},

{
title:"鹿茸牛奶",
url:"lurong-milk.html",
category:"drink"
},

{
title:"鹿茸咖啡",
url:"lurong-coffee.html",
category:"drink"
},

{
title:"鹿茸茶",
url:"lurong-tea.html",
category:"drink"
},

{
title:"龜鹿雞湯",
url:"guilu-chicken-soup.html",
category:"recipe"
},

{
title:"龜鹿燉排骨",
url:"guilu-pork-ribs.html",
category:"recipe"
},

{
title:"龜鹿藥膳湯",
url:"guilu-herbal-soup.html",
category:"recipe"
}

];



/* 自動推薦系統 */

(function(){

if(!location.pathname.includes("/articles/")) return;

const current = location.pathname.split("/").pop();

const currentArticle = ARTICLES.find(a=>a.url===current);

if(!currentArticle) return;

const sameCategory = ARTICLES.filter(a =>
a.category===currentArticle.category && a.url!==current
);



const others = ARTICLES.filter(a =>
a.category!==currentArticle.category
);



const recommended = [...sameCategory,...others].slice(0,3);


const html = `

<section class="section">

<h2 class="center">猜你想看</h2>

<div class="product-grid">

${recommended.map(a=>`

<a href="${a.url}" class="product-card">

<h3>${a.title}</h3>

</a>

`).join("")}

</div>

</section>

`;



const main = document.querySelector("main");

if(main){

main.insertAdjacentHTML("beforeend",html);

}

})();
