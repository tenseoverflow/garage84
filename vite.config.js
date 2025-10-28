import tailwindcss from "@tailwindcss/vite";
import { readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import eslint from "vite-plugin-eslint";
import { ViteMinifyPlugin } from "vite-plugin-minify";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Generate input entries for all index.html files
function getHtmlEntries() {
  const srcDir = resolve(__dirname, "src");
  const entries = {};

  // Add root index.html
  entries["index"] = resolve(srcDir, "index.html");

  // Scan for subdirectories with index.html
  const dirs = readdirSync(srcDir, { withFileTypes: true });
  dirs.forEach((dir) => {
    if (
      dir.isDirectory() &&
      dir.name !== "assets" &&
      dir.name !== "css" &&
      dir.name !== "js"
    ) {
      entries[`${dir.name}/index`] = resolve(srcDir, dir.name, "index.html");
    }
  });

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
      "@assets": resolve(__dirname, "./assets"),
      "@js": resolve(__dirname, "./src/js"),
      "@css": resolve(__dirname, "./src/css"),
    },
  },
  server: {
    port: 3000,
  },
  plugins: [
    tailwindcss(),
    eslint(),
    // HTML minification
    ViteMinifyPlugin({
      removeComments: true,
    }),
  ],
});
