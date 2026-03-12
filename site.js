async function loadProducts(){

const res = await fetch("products.json")
const data = await res.json()

const grid = document.getElementById("productGrid")

if(!grid) return

data.products.forEach(p=>{

const card = document.createElement("div")
card.className="card"

card.innerHTML=`

<h3>${p.name}</h3>

<p>${p.description}</p>

<button class="btn" onclick="openProduct('${p.id}')">
查看
</button>

`

grid.appendChild(card)

})

}



async function openProduct(id){

const res = await fetch("products.json")
const data = await res.json()

const p = data.products.find(x=>x.id===id)

const modal = document.getElementById("productModal")

const body = document.getElementById("modalBody")

let html = ""

html += `<h2>${p.name}</h2>`

html += `<p>${p.description}</p>`

if(p.size){

html += `<h3>規格</h3>`

html += `<p>${p.size}</p>`

}

if(p.ingredients){

html += `<h3>成分</h3>`

html += `<p>${p.ingredients.join("、")}</p>`

}

if(p.price){

html += `<h3>優惠</h3>`

html += `<p>單罐 $${p.price.single}</p>`

if(p.price.two){

html += `<p>2罐 $${p.price.two}</p>`

}

if(p.price.three_avg){

html += `<p>3罐以上平均 $${p.price.three_avg}</p>`

}

}

body.innerHTML = html

modal.style.display="flex"

}



function closeModal(){

document.getElementById("productModal").style.display="none"

}



function toggleMenu(){

document.getElementById("drawer").classList.toggle("open")

}



function closeMenu(){

document.getElementById("drawer").classList.remove("open")

}



document.addEventListener("DOMContentLoaded",loadProducts)
