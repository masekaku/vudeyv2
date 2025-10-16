// generate-sitemap.js
const fs = require("fs");
const path = require("path");

const baseUrl = "https://videyweb.web.id";
const rootDir = __dirname;

// Ambil semua file HTML di root (kecuali sitemap sendiri)
const htmlFiles = fs
  .readdirSync(rootDir)
  .filter(
    (file) =>
      file.endsWith(".html") &&
      !["sitemap.html", "sitemap.xml"].includes(file)
  );

const urls = htmlFiles.map((file) => {
  const loc =
    file === "index.html"
      ? `${baseUrl}/`
      : `${baseUrl}/${file.replace(".html", "")}`;
  return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <priority>${file === "index.html" ? "1.0" : "0.8"}</priority>
  </url>`;
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

// Simpan file sitemap.xml baru
fs.writeFileSync(path.join(rootDir, "sitemap.xml"), xml);
console.log("✅ sitemap.xml berhasil dibuat!");