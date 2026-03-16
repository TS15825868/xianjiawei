const VIDEOS = [

{
title:"中藥版蝦味先，泡製鹿便",
url:"https://www.tiktok.com/embed/7599984981527530772"
},

{
title:"泡製不是泡在水裡",
url:"https://www.tiktok.com/embed/7599654150523079957"
},

{
title:"他摸過上千支鹿",
url:"https://www.tiktok.com/embed/7600388782180945172"
},

{
title:"鬼鬼祟祟向內摸",
url:"https://www.tiktok.com/embed/7597798718720576789"
},

{
title:"吃了沒有效買到假鹿茸",
url:"https://www.tiktok.com/embed/7590648704156142868"
},

{
title:"撻伐章醫師",
url:"https://www.tiktok.com/embed/7571657095880232210"
},

{
title:"鹿角買回家沒有用",
url:"https://www.tiktok.com/embed/7561374523564543249"
},

{
title:"泡製鹿便9",
url:"https://www.tiktok.com/embed/7490604047783726343"
},

{
title:"秘魯人參怎麼吃",
url:"https://www.tiktok.com/embed/7486299595979394312"
},

{
title:"吃鹿便當犁壞田的牛",
url:"https://www.tiktok.com/embed/7488238569224555794"
},

{
title:"女孩不孕吃鹿便",
url:"https://www.tiktok.com/embed/7488239418650807560"
},

{
title:"龜鹿二仙膠預防膝蓋痛",
url:"https://www.tiktok.com/embed/7475988696827727112"
},

{
title:"冬天提高房事不能只吃瑪卡",
url:"https://www.tiktok.com/embed/7473305364415384850"
},

{
title:"超過一甲子保育水鹿角",
url:"https://www.tiktok.com/embed/7446332181263289607"
},

{
title:"烏龜配麋鹿骨頭健康",
url:"https://www.tiktok.com/embed/7445221794769898759"
},

{
title:"龜鹿二仙膠",
url:"https://www.tiktok.com/embed/7444622264642833671"
},

{
title:"鹿角判斷鹿齡",
url:"https://www.tiktok.com/embed/7444467481059560712"
},

{
title:"中醫界LV包",
url:"https://www.tiktok.com/embed/7444051217757752583"
},

{
title:"鹿耳朵",
url:"https://www.tiktok.com/embed/7443754721195691319"
},

{
title:"百年鹿角店",
url:"https://www.tiktok.com/embed/7442637133308759352"
},

{
title:"龜鹿二仙膠為什麼有腥味",
url:"https://www.tiktok.com/embed/7441892944057027896"
},

{
title:"吃過鹿角看過鹿角嗎",
url:"https://www.tiktok.com/embed/7441142424518315280"
},

{
title:"鹿角椅",
url:"https://www.tiktok.com/embed/7440039107708914945"
},

{
title:"鹿茸鹿角怎麼分",
url:"https://www.tiktok.com/embed/7410727121875782919"
}

];


const grid=document.getElementById("video-grid");

let html="";

VIDEOS.forEach(v=>{

html+=`

<div class="product-card">

<h3>${v.title}</h3>

<iframe
src="${v.url}"
width="100%"
height="480"
frameborder="0"
allowfullscreen>
</iframe>

</div>

`;

});

grid.innerHTML=html;
