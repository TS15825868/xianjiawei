function toggleMenu(){
  const drawer = document.getElementById("drawer")
  if(drawer){
    drawer.classList.toggle("open")
  }
}

async function loadProducts(){
  const grid = document.getElementById("productGrid")
  if(!grid) return

  try{
    const res = await fetch("products.json")
    const data = await res.json()

    grid.innerHTML = ""

    data.products.forEach(product => {
      const card = document.createElement("div")
      card.className = "card"

      card.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <button class="btn" type="button" onclick="openProduct('${product.id}')">查看</button>
      `

      grid.appendChild(card)
    })
  }catch(error){
    grid.innerHTML = `
      <div class="content-block">
        <p>產品資料載入中發生問題，請稍後再試。</p>
      </div>
    `
  }
}

async function openProduct(id){
  const modal = document.getElementById("productModal")
  const body = document.getElementById("modalBody")
  if(!modal || !body) return

  try{
    const res = await fetch("products.json")
    const data = await res.json()
    const product = data.products.find(item => item.id === id)

    if(!product) return

    const sizesHtml = product.sizes && product.sizes.length
      ? `
        <h4>規格</h4>
        <ul>${product.sizes.map(size => `<li>${size}</li>`).join("")}</ul>
      `
      : ""

    body.innerHTML = `
      <h2>${product.name}</h2>
      <p>${product.description}</p>

      ${sizesHtml}

      <h4>成分</h4>
      <ul>${product.ingredients.map(item => `<li>${item}</li>`).join("")}</ul>

      <h4>使用方式</h4>
      <ul>${product.usage.map(item => `<li>${item}</li>`).join("")}</ul>
    `

    modal.classList.add("show")
  }catch(error){
    body.innerHTML = `<p>產品資料讀取失敗。</p>`
    modal.classList.add("show")
  }
}

function closeModal(){
  const modal = document.getElementById("productModal")
  if(modal){
    modal.classList.remove("show")
  }
}

function recommendProduct(){
  const useType = document.getElementById("useType")
  const habitType = document.getElementById("habitType")
  const drinkType = document.getElementById("drinkType")
  const result = document.getElementById("recommendResult")

  if(!useType || !habitType || !drinkType || !result) return

  const use = useType.value
  const habit = habitType.value
  const drink = drinkType.value

  let title = ""
  let text = ""

  if(use === "eat"){
    title = "推薦：龜鹿膏"
    text = "適合偏好直接食用或加入溫水飲用的日常使用方式。"
  }else if(use === "drink"){
    title = "推薦：龜鹿飲"
    text = "適合希望開封即可飲用、節奏較忙碌的日常型態。"
  }else if(use === "cook"){
    title = "推薦：龜鹿湯塊"
    text = "適合雞湯、排骨湯與日常燉煮料理。"
  }else if(use === "mix"){
    title = "推薦：鹿茸粉 / 龜鹿調飲粉"
    text = "適合熱水、茶飲、咖啡等沖泡方式。"
  }else{
    title = "請先選擇使用方式"
    text = "先選擇你的日常使用習慣，系統才會推薦適合型態。"
  }

  if(use === "mix" && drink === "drink"){
    text = "若偏好茶飲或咖啡等日常飲品，較適合鹿茸粉或龜鹿調飲粉。"
  }

  if(use === "cook" && habit === "family"){
    text = "若以家庭燉湯為主，龜鹿湯塊會是較直覺的選擇。"
  }

  result.innerHTML = `
    <div class="card">
      <h3>${title}</h3>
      <p>${text}</p>
      <div class="btn-row">
        <a class="btn" href="guilu-series.html">查看產品</a>
        <a class="btn" href="https://lin.ee/sHZW7NkR" target="_blank" rel="noopener">LINE詢問</a>
      </div>
    </div>
  `
}

document.addEventListener("click", function(event){
  const modal = document.getElementById("productModal")
  if(modal && event.target === modal){
    closeModal()
  }
})

document.addEventListener("DOMContentLoaded", function(){
  loadProducts()

  document.querySelectorAll(".acc-q").forEach(question => {
    question.addEventListener("click", function(){
      const item = this.parentElement
      item.classList.toggle("open")
    })
  })
})
