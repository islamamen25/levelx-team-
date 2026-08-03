import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // docs/ is not application code and must not be linted as if it were.
    // It holds two standalone .js files that the app never imports and the
    // bundler never sees:
    //   build-admin-guide.js     — a CommonJS Node script that generates the
    //                              admin guide .docx. Its require() calls are
    //                              correct for how it is run (plain `node`),
    //                              but the TypeScript config forbids them.
    //   archive/n8n/*.js         — retired n8n Code-node snippets, kept as a
    //                              record. They are not runnable on their own
    //                              and linting them is meaningless.
    "docs/**/*.js",
  ]),
]);

export default eslintConfig;
