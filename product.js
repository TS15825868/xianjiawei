
const params=new URLSearchParams(location.search)
const id=params.get('id')

fetch('products.json')
.then(r=>r.json())
.then(data=>{

const p=data.find(x=>x.id===id)
const box=document.getElementById('detail')

box.innerHTML=`
<img src="${p.image}" style="width:320px">
<h1>${p.name}</h1>
<p>${p.desc}</p>
<p>規格：${p.sizes.join(' / ')}</p>
<a href="https://lin.ee/sHZW7NkR">LINE詢問</a>
`
})
