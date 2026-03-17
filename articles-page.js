const related = document.getElementById("related-articles");

if (related && typeof ARTICLES !== "undefined") {

const current = location.pathname.split("/").pop();
const currentArticle = ARTICLES.find(a => a.url === current);

let list = ARTICLES.filter(a => a.url !== current);

/* 同tag優先 */
if(currentArticle){
list.sort((a,b)=>{
const aMatch = a.tags?.some(t=>currentArticle.tags?.includes(t)) ? 1 : 0;
const bMatch = b.tags?.some(t=>currentArticle.tags?.includes(t)) ? 1 : 0;
return bMatch - aMatch;
});
}

list = list.slice(0,3);

let html = "";

list.forEach(a=>{
html += `
<a href="${a.url}" class="product-card">
<h3>${a.title}</h3>
<p>${a.summary}</p>
</a>
`;
});

related.innerHTML = html;

}
