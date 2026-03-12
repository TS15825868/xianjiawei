function toggleMenu(){
  document.getElementById("drawer").classList.toggle("open")
}


/* 讀取產品 */

async function loadProducts(){

  const res = await fetch("products.json")
  const data = await res.json()

  const grid = document.getElementById("productGrid")

  if(!grid) return

  data.products.forEach(p=>{

    const card = document.createElement("div")
    card.className="card"

    card.innerHTML=`

      <img src="${p.image}" alt="${p.name}">

      <h3>${p.name}</h3>

      <p>${p.description}</p>

      <button class="btn" onclick="openProduct('${p.id}')">
      查看
      </button>

    `

    grid.appendChild(card)

  })

}



/* 打開產品 */

async function openProduct(id){

  const res = await fetch("products.json")
  const data = await res.json()

  const p = data.products.find(x=>x.id===id)

  const modal = document.getElementById("productModal")
  const body = document.getElementById("modalBody")

  body.innerHTML = `

    <h2>${p.name}</h2>

    <p>${p.description}</p>

    <h4>成分</h4>

    <ul>
      ${p.ingredients.map(i=>`<li>${i}</li>`).join("")}
    </ul>

    <h4>使用方式</h4>

    <ul>
      ${p.usage.map(i=>`<li>${i}</li>`).join("")}
    </ul>

  `

  modal.classList.add("show")

}


/* 關閉 modal */

function closeModal(){
  document.getElementById("productModal").classList.remove("show")
}



/* 點背景關閉 */

document.addEventListener("click",function(e){

  const modal = document.getElementById("productModal")

  if(e.target === modal){
    closeModal()
  }

})



document.addEventListener("DOMContentLoaded",loadProducts)
