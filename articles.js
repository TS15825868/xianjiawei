const container = document.getElementById("article-grid");

if(container){
  ARTICLES.forEach(a=>{
    const el = document.createElement("a");
    el.href = a.link;
    el.className = "product-card";
    el.innerHTML = `<h3>${a.title}</h3>`;
    container.appendChild(el);
  });
}
