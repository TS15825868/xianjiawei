
function toggleMenu(){
  const drawer=document.getElementById("siteDrawer")||document.getElementById("drawer");
  const backdrop=document.getElementById("drawerBackdrop");
  if(drawer){
    drawer.classList.toggle("open");
  }
  if(backdrop){
    backdrop.classList.toggle("show");
  }
}

function closeMenu(){
  const drawer=document.getElementById("siteDrawer")||document.getElementById("drawer");
  const backdrop=document.getElementById("drawerBackdrop");
  if(drawer){
    drawer.classList.remove("open");
  }
  if(backdrop){
    backdrop.classList.remove("show");
  }
}


document.addEventListener("DOMContentLoaded",()=>{
const grid=document.querySelector("#productGrid");
if(grid){
fetch("products.json")
.then(r=>r.json())
.then(products=>{
products.forEach(p=>{
const card=document.createElement("div");
card.className="card";
card.innerHTML=`
<img src="${p.image}" alt="${p.name}">
<h3>${p.name}</h3>
<p>${p.size}</p>
<a class="btn" href="product.html?id=${p.id}">查看</a>
`;
grid.appendChild(card);
});
});
}

/* video filter */
document.querySelectorAll(".video-filter button").forEach(btn=>{
btn.onclick=()=>{
const cat=btn.dataset.filter;
document.querySelectorAll(".video-card").forEach(v=>{
if(cat==="all"||v.dataset.cat===cat){
v.style.display="block";
}else{
v.style.display="none";
}
});
};
});
});
