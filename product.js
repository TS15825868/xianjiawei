(function(){

const params = new URLSearchParams(window.location.search);
const id = params.get('id');

fetch('./products.json')
.then(function(res){ return res.json(); })
.then(function(data){

var product = data.products.find(function(p){
  return p.id === id;
}) || data.products[0];

document.getElementById('product-image').src = product.image;
document.getElementById('product-title').textContent = product.name;

document.getElementById('product-summary').textContent =
product.desc + "，適合日常補養使用。";

document.getElementById('product-sizes').textContent =
product.sizes.join(' / ');

document.getElementById('product-package').textContent =
product.package;

document.getElementById('product-line').href =
"https://lin.ee/sHZW7NkR?text=" + encodeURIComponent("我想了解" + product.name + "搭配");

document.getElementById('product-ingredients').innerHTML =
product.ingredients.map(function(i){
  return "<li>" + i + "</li>";
}).join('');

document.getElementById('product-uses').innerHTML =
product.uses.map(function(i){
  return "<li>" + i + "</li>";
}).join('');

});

})();
