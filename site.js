document.addEventListener("DOMContentLoaded", function () {
  const menuBtn = document.querySelector(".menu-btn");
  const menu = document.querySelector(".menu");
  const modal = document.getElementById("productModal");
  const modalClose = document.getElementById("modalClose");
  const modalBody = document.getElementById("modalBody");
  const productCards = document.querySelectorAll(".product-card");

  const products = {
    gao: {
      title: "仙加味・龜鹿膏",
      subtitle: "傳統熬製濃縮",
      mainImage: "images/guilu-gao-100g.jpg",
      description: "承襲傳統熬製工序，以龜板與鹿角為基礎，經長時間慢火熬製濃縮製成，保留原料風味與質地，可作為日常飲食補養參考。",
      specs: ["100g"],
      usage: "可直接食用，亦可加入溫熱開水攪拌後飲用。",
      pairing: "可搭配日常飲用方式，也可加入雞湯或燉湯料理。",
      gallery: [
        "images/guilu-gao-texture.jpg",
        "images/guilu-gao-drink.jpg",
        "images/guilu-gao-cooking.jpg"
      ]
    },
    drink: {
      title: "仙加味・龜鹿飲",
      subtitle: "即開即飲",
      mainImage: "images/guilu-drink-30cc.jpg",
      description: "提供 30cc 小瓶裝與 180cc 袋裝兩種規格，方便依照日常需求選擇。",
      specs: ["30cc 小瓶裝", "180cc 袋裝"],
      usage: "可直接飲用；如有需要，也可先溫熱後飲用。",
      pairing: "適合日常即飲使用，外出攜帶也方便。",
      gallery: [
        "images/guilu-drink-30cc.jpg",
        "images/guilu-drink-180cc.jpg"
      ]
    },
    block: {
      title: "仙加味・龜鹿湯塊",
      subtitle: "燉湯料理使用",
      mainImage: "images/guilu-block-piece.jpg",
      description: "以湯塊形式設計，方便加入雞湯、排骨湯或其他燉湯料理使用。",
      specs: ["75g", "300g", "600g"],
      usage: "可依料理份量加入湯塊燉煮，作為日常料理搭配使用。",
      pairing: "適合雞湯、排骨湯、藥膳湯品等料理方式。",
      gallery: [
        "images/guilu-block-piece.jpg",
        "images/guilu-block-box.jpg",
        "images/guilu-block-stack.jpg"
      ]
    },
    lurong: {
      title: "仙加味・鹿茸粉",
      subtitle: "日常補養",
      mainImage: "images/lurong-powder.jpg",
      description: "粉末形式設計，方便搭配日常飲食使用。",
      specs: ["75g"],
      usage: "可依個人習慣搭配沖泡或加入日常飲食。",
      pairing: "適合搭配溫熱飲品或其他日常食用方式。",
      gallery: [
        "images/lurong-powder.jpg"
      ]
    },
    qixuan: {
      title: "柒玄茶・龜鹿調飲粉",
      subtitle: "可加入茶或咖啡",
      mainImage: "images/qixuan-guilu-mix.jpg",
      description: "設計為可加入茶飲、咖啡或其他日常飲品中的調飲粉形式。",
      specs: ["調飲粉"],
      usage: "可加入茶、咖啡或其他飲品中調和使用。",
      pairing: "適合日常飲品搭配，作為便利的補養型態選擇。",
      gallery: [
        "images/qixuan-guilu-mix.jpg"
      ]
    }
  };

  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () {
      menu.classList.toggle("open");
    });

    menu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", function () {
        menu.classList.remove("open");
      });
    });

    document.addEventListener("click", function (e) {
      if (!menu.contains(e.target) && !menuBtn.contains(e.target)) {
        menu.classList.remove("open");
      }
    });
  }

  function renderModal(product) {
    const galleryHtml = product.gallery.map(src => `<img src="${src}" alt="${product.title}">`).join("");
    const specsHtml = product.specs.map(item => `<span class="chip">${item}</span>`).join("");

    modalBody.innerHTML = `
      <div class="modal-top">
        <div>
          <img class="modal-main-image" src="${product.mainImage}" alt="${product.title}">
        </div>
        <div>
          <h2 class="modal-title">${product.title}</h2>
          <p class="modal-subtitle">${product.subtitle}</p>
          <p class="modal-text">${product.description}</p>

          <div class="modal-block">
            <h3>規格</h3>
            <div class="spec-list">${specsHtml}</div>
          </div>

          <div class="modal-block">
            <h3>食用方式</h3>
            <p class="modal-text">${product.usage}</p>
          </div>

          <div class="modal-block">
            <h3>料理搭配</h3>
            <p class="modal-text">${product.pairing}</p>
          </div>
        </div>
      </div>

      <div class="modal-block">
        <h3>產品圖片</h3>
        <div class="modal-gallery">${galleryHtml}</div>
      </div>
    `;
  }

  function openModal(key) {
    const product = products[key];
    if (!product || !modal || !modalBody) return;
    renderModal(product);
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }

  productCards.forEach(card => {
    card.addEventListener("click", function () {
      openModal(this.dataset.product);
    });
  });

  if (modalClose) {
    modalClose.addEventListener("click", closeModal);
  }

  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeModal();
      if (menu) menu.classList.remove("open");
    }
  });
});
