import css from "@eslint/css";
import js from "@eslint/js";
import html from "@html-eslint/eslint-plugin";
import prettier from "eslint-plugin-prettier/recommended";
import globals from "globals";

export default [
  {
    files: ["**/*.{js,jsx,cjs,mjs,ts,tsx}"],
    ...js.configs.recommended,
  },
  prettier,
  {
    languageOptions: {
      ecmaVersion: "latest",
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  // lint html files
  {
    files: ["**/*.html"],
    plugins: {
      html,
    },
    language: "html/html",
    rules: {
      "html/no-duplicate-class": "error",
    },
  },
  // lint css files
  {
    files: ["**/*.css"],
    plugins: {
      css,
    },
    language: "css/css",
    rules: {
      "css/no-duplicate-imports": "error",
    },
  },
];
