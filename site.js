
function toggleMenu(){
  const drawer = document.getElementById("siteDrawer") || document.getElementById("drawer");
  const backdrop = document.getElementById("drawerBackdrop");
  const btn = document.querySelector(".menu-btn");
  if(!drawer) return;
  const isOpen = drawer.classList.contains("open");
  if(isOpen){
    closeMenu();
  }else{
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden","false");
    if(backdrop) backdrop.classList.add("show");
    if(btn) btn.setAttribute("aria-expanded","true");
    document.body.style.overflow = "hidden";
  }
}

function closeMenu(){
  const drawer = document.getElementById("siteDrawer") || document.getElementById("drawer");
  const backdrop = document.getElementById("drawerBackdrop");
  const btn = document.querySelector(".menu-btn");
  if(drawer){
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden","true");
  }
  if(backdrop) backdrop.classList.remove("show");
  if(btn) btn.setAttribute("aria-expanded","false");
  document.body.style.overflow = "";
}

document.addEventListener("keydown", (e)=>{
  if(e.key === "Escape") closeMenu();
});

document.addEventListener("DOMContentLoaded", ()=>{
  const grid = document.querySelector("#productGrid");
  if(grid){
    fetch("products.json")
      .then(r=>r.json())
      .then(products=>{
        const path = location.pathname;
        let list = products;
        if(path.includes("guilu-series")){
          list = products.filter(p => p.cat === "guilu");
        }else if(path.includes("qixuan-tea")){
          list = products.filter(p => p.cat === "qixuan");
        }
        grid.innerHTML = "";
        list.forEach(p=>{
          const card = document.createElement("div");
          card.className = "card";
          card.innerHTML = `
            <img src="${p.image}" alt="${p.name}">
            <h3>${p.name}</h3>
            <p>${p.size}</p>
            <a class="btn" href="product.html?id=${p.id}">查看</a>
          `;
          grid.appendChild(card);
        });
      });
  }

  document.querySelectorAll(".video-filter button").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const cat = btn.dataset.filter;
      document.querySelectorAll(".video-card").forEach(v=>{
        const matched = cat === "all" || v.dataset.cat === cat;
        v.style.display = matched ? "block" : "none";
      });
    });
  });
});
