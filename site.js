
async function loadProducts(){
const res=await fetch('products.json')
const data=await res.json()

const grid=document.getElementById('products')
if(grid){
data.forEach(p=>{
const card=document.createElement('div')
card.className='card'
card.innerHTML=`
<img src="${p.image}">
<h3>${p.name}</h3>
<p>${p.desc}</p>
<p>${p.sizes.join(' / ')}</p>
<a class="btn" href="product.html?id=${p.id}">查看詳情</a>
`
grid.appendChild(card)
})
}
}
document.addEventListener('DOMContentLoaded',loadProducts)
