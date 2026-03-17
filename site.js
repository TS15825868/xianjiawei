document.addEventListener("DOMContentLoaded", () => {

// CTA 強化
document.querySelectorAll("article").forEach(el=>{
const cta = `
<section class="cta">
<h2>想了解怎麼搭配？</h2>
<a href="https://lin.ee/sHZW7NkR" class="btn btn-dark">LINE詢問</a>
</section>`;
el.insertAdjacentHTML("beforeend", cta);
});

});
