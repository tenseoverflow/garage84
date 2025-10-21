import tailwindcss from "@tailwindcss/vite";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import eslint from "vite-plugin-eslint";
import { ViteMinifyPlugin } from "vite-plugin-minify";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: process.env.CI ? "/ITI0105-2025/" : "/",
  root: resolve(__dirname, "./src"),
  publicDir: resolve(__dirname, "./public"),
  build: {
    emptyOutDir: true,
    outDir: resolve(__dirname, "./dist"),
    sourcemap: true,
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
