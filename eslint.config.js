import js from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";
import globals from "globals";

export default [
  js.configs.recommended,
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
];
