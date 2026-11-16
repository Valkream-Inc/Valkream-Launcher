import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "**/node_modules/**",
    "**/build/**",
    "**/dist/**",
    "**/.tsbuild/**",
    "**/.yarn/**",
    "backend/public/**",
  ]),
  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
]);
