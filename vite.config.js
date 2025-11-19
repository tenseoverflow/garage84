import tailwindcss from "@tailwindcss/vite";
import { readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import eslint from "vite-plugin-eslint";
import { ViteMinifyPlugin } from "vite-plugin-minify";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Generate input entries for all index.html files recursively
function getHtmlEntries() {
  const srcDir = resolve(__dirname, "src");
  const entries = {};
  const excludeDirs = ["assets", "css", "js"];

  // Recursive function to scan directories
  function scanDirectory(dir, relativePath = "") {
    const items = readdirSync(dir, { withFileTypes: true });

    items.forEach((item) => {
      if (item.isDirectory() && !excludeDirs.includes(item.name)) {
        const newRelativePath = relativePath
          ? `${relativePath}/${item.name}`
          : item.name;
        scanDirectory(resolve(dir, item.name), newRelativePath);
      } else if (item.isFile() && item.name === "index.html") {
        const entryName = relativePath ? `${relativePath}/index` : "index";
        entries[entryName] = resolve(dir, item.name);
      }
    });
  }

  scanDirectory(srcDir);
  return entries;
}

export default defineConfig({
  root: resolve(__dirname, "./src"),
  publicDir: resolve(__dirname, "./public"),
  build: {
    emptyOutDir: true,
    outDir: resolve(__dirname, "./dist"),
    sourcemap: true,
    rollupOptions: {
      input: getHtmlEntries(),
    },
  },
  resolve: {
    alias: {
      "@js": resolve(__dirname, "./src/js"),
      "@css": resolve(__dirname, "./src/css"),
    },
  },
  server: {
    port: 3000,
  },
  appType: "mpa",
  plugins: [
    tailwindcss(),
    eslint(),
    // HTML minification
    ViteMinifyPlugin({
      removeComments: true,
    }),
  ],
});
