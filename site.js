// 產品載入
async function loadProducts(){

const res = await fetch("/products.json")
const data = await res.json()

const grid = document.getElementById("productGrid")
if(!grid) return

data.products.forEach(p=>{

const card=document.createElement("div")
card.className="card fade-in"

card.innerHTML=`
<h3>${p.name}</h3>
<p>${p.description}</p>
<button class="btn" onclick="openProduct('${p.id}')">查看</button>
`

grid.appendChild(card)

})

}



// 開啟產品 Modal
async function openProduct(id){

const res=await fetch("/products.json")
const data=await res.json()

const p=data.products.find(x=>x.id===id)

const modal=document.getElementById("productModal")
const body=document.getElementById("modalBody")

let html=`
<h2>${p.name}</h2>
<p>${p.description}</p>
`

if(p.size){
html+=`
<h3>規格</h3>
<p>${p.size}</p>
`
}

if(p.ingredients){
html+=`
<h3>成分</h3>
<p>${p.ingredients.join("、")}</p>
`
}

if(p.usage){
html+=`
<h3>食用方式</h3>
<p>${p.usage}</p>
`
}

html+=`
<div style="margin-top:24px">
<a class="btn" href="https://lin.ee/sHZW7NkR" target="_blank">
LINE詢問
</a>
</div>
`

body.innerHTML=html
modal.classList.add("show")

}



// 關閉 modal
function closeModal(){
document.getElementById("productModal").classList.remove("show")
}



// Menu
function toggleMenu(){
document.getElementById("drawer").classList.toggle("open")
}

function closeMenu(){
document.getElementById("drawer").classList.remove("open")
}



// Apple風格滾動動畫
const observer=new IntersectionObserver(entries=>{
entries.forEach(entry=>{
if(entry.isIntersecting){
entry.target.classList.add("fade-show")
}
})
})

document.querySelectorAll(".fade-in").forEach(el=>{
observer.observe(el)
})



document.addEventListener("DOMContentLoaded",loadProducts)
