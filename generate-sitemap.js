const fs = require("fs");

const baseURL = "https://ts15825868.github.io/xianjiawei";

const pages = [
"",
"guilu-series.html",
"qixuan-tea.html",
"articles.html",
"recipes.html",
"choose.html",
"faq.html",
"brand.html"
];

const articles = [
"what-is-guilu.html",
"guilu-gao.html",
"guilu-drink.html",
"guilu-block.html",
"lurong-powder.html",
"qixuan-guilu-mix.html",
"guilu-chicken-soup.html",
"guilu-pork-ribs.html",
"guilu-herbal-soup.html"
];

let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

pages.forEach(p=>{
xml += `
<url>
<loc>${baseURL}/${p}</loc>
<changefreq>monthly</changefreq>
<priority>0.8</priority>
</url>
`;
});

articles.forEach(a=>{
xml += `
<url>
<loc>${baseURL}/articles/${a}</loc>
<changefreq>yearly</changefreq>
<priority>0.7</priority>
</url>
`;
});

xml += `</urlset>`;

fs.writeFileSync("sitemap.xml",xml);

console.log("sitemap generated");
