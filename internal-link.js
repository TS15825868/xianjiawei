document.querySelectorAll("article p").forEach(p=>{
p.innerHTML = p.innerHTML
.replace(/龜鹿膏/g,'<a href="../product.html?id=guilu-gao">龜鹿膏</a>')
.replace(/龜鹿飲/g,'<a href="../product.html?id=guilu-drink">龜鹿飲</a>')
.replace(/龜鹿湯塊/g,'<a href="../product.html?id=guilu-block">龜鹿湯塊</a>');
});
