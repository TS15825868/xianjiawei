(function () {
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  const productImage = document.getElementById("product-image");
  const productTitle = document.getElementById("product-title");
  const productSummary = document.getElementById("product-summary");
  const productSizes = document.getElementById("product-sizes");
  const productPackage = document.getElementById("product-package");
  const productIngredients = document.getElementById("product-ingredients");
  const productUses = document.getElementById("product-uses");
  const breadcrumb = document.getElementById("breadcrumb-product");
  const productInfo = document.querySelector(".product-info");

  const titleMap = {
    "guilu-gao.html": "龜鹿膏介紹",
    "guilu-drink.html": "龜鹿飲介紹",
    "guilu-block.html": "龜鹿湯塊介紹",
    "lurong-powder.html": "鹿茸粉介紹",
    "what-is-guilu.html": "什麼是龜鹿",
    "guilu-chicken-soup.html": "龜鹿雞湯",
    "guilu-pork-soup.html": "龜鹿排骨湯",
    "guilu-drink-guide.html": "龜鹿飲飲用指南",
    "lurong-coffee.html": "鹿茸粉搭咖啡",
    "lurong-milk.html": "鹿茸粉搭牛奶"
  };

  const getArticleTitle = (url) => {
    const slug = url.split("/").pop();
    if (titleMap[slug]) return titleMap[slug];
    if (typeof ARTICLES !== "undefined") {
      const hit = ARTICLES.find((item) => item.url === slug);
      if (hit?.title) return hit.title;
    }
    return slug.replace(".html", "").replaceAll("-", " ");
  };

  const cardGrid = (title, items, label) => {
    if (!items?.length) return "";
    return `
      <section class="info-card reveal">
        <h3>${title}</h3>
        <div class="product-grid" style="margin-top:16px">
          ${items.map((url) => `
            <a href="articles/${url}" class="product-card">
              <h3>${getArticleTitle(url)}</h3>
              <p>${label}</p>
            </a>
          `).join("")}
        </div>
      </section>
    `;
  };

  fetch("products.json")
    .then((res) => res.json())
    .then((data) => {
      if (!data || !Array.isArray(data.products)) return;
      const product = data.products.find((p) => p.id === id) || data.products[0];
      if (!product) return;

      document.title = `${product.name}｜仙加味`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && product.desc) metaDesc.setAttribute("content", product.desc);
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) ogTitle.setAttribute("content", `${product.name}｜仙加味`);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc && product.desc) ogDesc.setAttribute("content", product.desc);
      const ogImage = document.querySelector('meta[property="og:image"]');
      if (ogImage) ogImage.setAttribute("content", product.seoImage || product.image);

      if (breadcrumb) breadcrumb.textContent = product.name;
      if (productImage) {
        productImage.src = product.image || "images/logo-seal.png";
        productImage.alt = `仙加味 ${product.name}`;
      }
      if (productTitle) productTitle.textContent = product.name;
      if (productSummary) productSummary.textContent = product.desc || "";
      if (productPackage) productPackage.textContent = product.package || "—";

      if (productSizes) {
        productSizes.innerHTML = (product.sizes || [])
          .map((size) => `<span class="tag">${size}</span>`)
          .join("") || '<span class="tag">依現場規格為準</span>';
      }

      if (productIngredients) {
        const items = Array.isArray(product.ingredients) ? product.ingredients : [];
        productIngredients.innerHTML = items.map((item) => `<li>${item}</li>`).join("") || "<li>請以產品標示為準</li>";
      }

      if (productUses) {
        const items = Array.isArray(product.uses) ? product.uses : [];
        productUses.innerHTML = items.map((item) => `<li>${item}</li>`).join("") || "<li>請透過 LINE 詢問使用方式</li>";
      }

      const normalizedArticles = (product.articles || []).filter(Boolean);
      const normalizedRecipes = (product.recipes || []).filter(Boolean);
      const relatedProducts = data.products.filter((p) => p.id !== product.id).slice(0, 3);

      if (productInfo) {
        productInfo.insertAdjacentHTML(
          "beforeend",
          cardGrid("延伸閱讀", normalizedArticles, "查看內容") +
            cardGrid("料理搭配", normalizedRecipes, "料理方式") +
            (relatedProducts.length
              ? `
                <section class="info-card reveal">
                  <h3>其他產品</h3>
                  <div class="product-grid" style="margin-top:16px">
                    ${relatedProducts
                      .map(
                        (p) => `
                      <a href="product.html?id=${p.id}" class="product-card">
                        <h3>${p.name}</h3>
                        <p>${p.desc || ""}</p>
                      </a>`
                      )
                      .join("")}
                  </div>
                </section>`
              : "")
        );
      }

      const schema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.desc || "",
        image: product.seoImage || product.image,
        sku: product.id,
        brand: { "@type": "Brand", name: "仙加味" },
        url: location.href,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "TWD",
          availability: "https://schema.org/InStock"
        }
      };

      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.text = JSON.stringify(schema);
      document.head.appendChild(script);
    })
    .catch((err) => {
      console.error("products.json 讀取失敗:", err);
    });
})();
