import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const clientDir = path.join(root, "client");
const publicDir = path.join(clientDir, "public");
const configured = (process.env.VITE_PUBLIC_URL || process.env.APP_PUBLIC_URL || "http://localhost:3000").replace(/\/+$/, "");

const templatePath = path.join(clientDir, "index.template.html");
const indexTemplate = fs.readFileSync(templatePath, "utf8");
fs.writeFileSync(path.join(clientDir, "index.html"), indexTemplate.replaceAll("__PUBLIC_URL__", configured));

const paths = [
  ["/", "monthly", "1.0"],
  ["/education", "monthly", "0.9"],
  ["/policy-form", "monthly", "0.8"],
  ["/strategy", "monthly", "0.7"],
  ["/contact", "monthly", "0.6"],
  ["/terms", "yearly", "0.3"],
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map(([p, freq, pri]) => `  <url>\n    <loc>${configured}${p}</loc>\n    <changefreq>${freq}</changefreq>\n    <priority>${pri}</priority>\n  </url>`).join("\n")}\n</urlset>\n`;
fs.writeFileSync(path.join(publicDir, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(publicDir, "robots.txt"), `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /storage/\n\nSitemap: ${configured}/sitemap.xml\n`);
