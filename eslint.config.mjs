import js from "@eslint/js";
import tseslint from "typescript-eslint";

// browser 環境で動く file (React コンポーネント / addInitScript / Playwright helper 等) 用の
// 共通 globals。 window / document / localStorage / requestAnimationFrame 等を undefined
// 扱いされないよう明示する。
const browserGlobals = {
  window: "readonly",
  document: "readonly",
  localStorage: "readonly",
  sessionStorage: "readonly",
  navigator: "readonly",
  location: "readonly",
  history: "readonly",
  fetch: "readonly",
  Request: "readonly",
  Response: "readonly",
  Headers: "readonly",
  FormData: "readonly",
  URLSearchParams: "readonly",
  Blob: "readonly",
  File: "readonly",
  FileReader: "readonly",
  Image: "readonly",
  Element: "readonly",
  HTMLElement: "readonly",
  HTMLInputElement: "readonly",
  HTMLTextAreaElement: "readonly",
  HTMLDivElement: "readonly",
  HTMLButtonElement: "readonly",
  HTMLAnchorElement: "readonly",
  Event: "readonly",
  MouseEvent: "readonly",
  KeyboardEvent: "readonly",
  CustomEvent: "readonly",
  requestAnimationFrame: "readonly",
  cancelAnimationFrame: "readonly",
  setTimeout: "readonly",
  clearTimeout: "readonly",
  setInterval: "readonly",
  clearInterval: "readonly",
  alert: "readonly",
  confirm: "readonly",
  prompt: "readonly",
  getComputedStyle: "readonly",
  matchMedia: "readonly",
  MutationObserver: "readonly",
  IntersectionObserver: "readonly",
  ResizeObserver: "readonly",
};

export default [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.astro/**",
      "**/.pagefind/**",
      "apps/web/src/env.d.ts",
      // `.cdl.d.ts` = tsc build 生成の宣言 file、 lint 対象外 (source は `.cdl.ts`)。
      "apps/playground/src/topics/**/*.cdl.d.ts",
    ],
  },
  js.configs.recommended,
  // recommendedTypeChecked = type 情報を使う check (unsafe casts / floating promises /
  // no-explicit-any 等)。 projectService: true で v8+ の new mode を有効化、 project references
  // 型の tsconfig でも tsconfig.json を自動探索して型情報を得られる。
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        // projectService は tsconfig.json のみ自動探索 + default project 8 file 制限、
        // parserOptions.project + solution-style tsconfig でも references 自動 traversal なし。
        // 各 package の tsconfig を全部列挙する古典的方式に統一。
        project: [
          "./tsconfig.eslint.json",
          "./apps/playground/tsconfig.json",
          "./packages/dragon/tsconfig.test.json",
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    // type check disable for .mjs / .js (parserOptions.project 非対応、 config file / script)
    files: ["**/*.{js,mjs,cjs}"],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        URL: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      // unsafe-* は any 使用箇所の副次違反。 no-explicit-any=off で any を許容している以上、
      // 派生する unsafe-{member-access, call, assignment, return, argument} も off で整合。
      // 真の bug detection (no-unnecessary-type-assertion / restrict-template / no-misused-promises)
      // は type checked recommended の default (error) で有効。
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  // browser で動く file (React コンポーネント / Playwright script / hooks) に browser globals を許可
  {
    files: [
      "apps/**/*.{ts,tsx,mjs}",
      "packages/**/src/render/**/*.{ts,tsx}",
      "packages/cdl/src/**/*.tsx",
    ],
    languageOptions: {
      globals: browserGlobals,
    },
  },
];
