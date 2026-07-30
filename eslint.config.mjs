import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";

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
      // `dist-types/` = 型検査 (tsc -b) の出力先。 束ね (tsup) の `dist/` と分けている
      // (同じ場所に出すと d.ts を交互に上書きする、 `packages/dragon/tsconfig.json` 参照)。
      // 生成物なので `dist/` と同じく lint 対象外。
      "**/dist-types/**",
      "**/node_modules/**",
      "**/.astro/**",
      "**/.pagefind/**",
      // `.stryker-tmp/` = Stryker mutation testing の sandbox (実行中に生成、 gitignore 済)。
      // sandbox 内 file は tsconfig include 外で type-aware rule が parser service を得られず
      // eslint が crash するため lint 対象から除外する。
      "**/.stryker-tmp/**",
      // `.mts` script (apps/playground-spa/scripts/*.mts) = tsconfig include 外の開発 script。
      // type-aware rule (await-thenable 等) が parser service を得られず eslint が crash するため除外。
      "**/*.mts",
      // `.context/` = 一時 scratch / verify 系 (一発 probe / 手元 shot script)、 lint 対象外。
      // 追跡外 dir を lint すると tsconfig include に含まれず parsing error になる。
      ".context/**",
      "apps/web/src/env.d.ts",
      // `.cdl.d.ts` = tsc build 生成の宣言 file、 lint 対象外 (source は `.cdl.ts`)。
      "apps/playground-spa/src/topics/**/*.cdl.d.ts",
    ],
  },
  js.configs.recommended,
  // recommendedTypeChecked = type 情報を使う check (unsafe casts / floating promises /
  // no-explicit-any 等)。 projectService: true で v8+ の new mode を有効化、 project references
  // 型の tsconfig でも tsconfig.json を自動探索して型情報を得られる。
  ...tseslint.configs.recommendedTypeChecked,
  // react-hooks = rules-of-hooks + exhaustive-deps 相当を .tsx / React コンポーネントに強制
  reactHooks.configs.flat.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // set-state-in-effect = warn (完全禁止すると legitimate な初期 sync pattern も NG)
      // 例 = hash 復元 (useEffect 内で URL hash 読取 → 初期 state 反映)、 selected changed
      // → derived state 再計算、 pagefind 検索結果 → setResults。 これらは cascading renders
      // 誘発せず 正常な同期 pattern、 完全禁止は false positive。
      "react-hooks/set-state-in-effect": "warn",
      // exhaustive-deps = warn 継続 (default) だが真の bug 検知能力あり
      "react-hooks/exhaustive-deps": "warn",
      // no-unnecessary-type-assertion は warn 降格 (#865): eslint の tsconfig.eslint.json と tsc の
      // tsconfig で DOM 型推論が不一致で、 tsc が必要とする assertion (svg.querySelector(sel).style の
      // as HTMLElement 等) を eslint が unnecessary と誤判定する。 --fix で誤削除すると typecheck が
      // 壊れるため error にしない。 type-aware rule なので ts/tsx 限定 (mjs はクラッシュ回避で除外)。
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",
    },
  },
  // import = cyclic dependency + import order 検知、 tsx / ts 両方対応
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: [
            "./tsconfig.eslint.json",
            "./apps/playground-spa/tsconfig.json",
            "./packages/dragon/tsconfig.test.json",
          ],
          noWarnOnMultipleProjects: true,
        },
      },
    },
    rules: {
      // no-cycle = import cycle (a → b → a) を検知、 未然の circular import bug を防ぐ。
      // maxDepth 5 で深い chain も辿る、 dynamic import は false で ES6 module 前提。
      "import/no-cycle": ["error", { maxDepth: 5, ignoreExternal: true }],
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        // projectService は tsconfig.json のみ自動探索 + default project 8 file 制限、
        // parserOptions.project + solution-style tsconfig でも references 自動 traversal なし。
        // 各 package の tsconfig を全部列挙する古典的方式に統一。
        project: [
          "./tsconfig.eslint.json",
          "./apps/playground-spa/tsconfig.json",
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
      // 真の bug detection (restrict-template / no-misused-promises) は type checked recommended の
      // default (error) で有効。
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
  {
    // 制御文字を正規表現で検出する test (samples-node-invariants 等) の no-control-regex を off (#865)。
    // \x00 / \x1f 等の制御文字を「壊れた入力」 として検出する意図的な test のため error にしない。
    files: ["**/*.{test,spec}.{ts,tsx}"],
    rules: {
      "no-control-regex": "off",
    },
  },
  {
    // React Compiler 系 rule (immutability / refs / preserve-manual-memoization) は他 file では
    // error 維持し新規 correctness regression を検出する。 CdlEditor.tsx のみ warn 降格 (#865):
    // canvas の imperative 操作 (document.body.style.cursor 代入 / previewRef.current 読取り) が
    // 本質的に必要で React Compiler が false positive を出す。 全体 warn 降格ではなく本 file 限定に
    // することで、 他 component の render 中 ref 読取り / props mutation は error で捕捉し続ける。
    // React Compiler の diagnostic は閉じ括弧など不正確な行を報告するため per-line disable より
    // file scoped override が堅牢。
    files: ["apps/playground-spa/src/components/CdlEditor.tsx"],
    rules: {
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
  {
    // Buffer は Node 実行 context (dev script + Node test) のみで使用、 browser code には無い (#865)。
    // 全 file に global 付与すると browser component への誤混入時に no-undef が検出できず実行時
    // ReferenceError を招くため、 Node context の file に限定する。
    files: ["**/scripts/**/*.{js,mjs,cjs,ts,tsx}", "**/*.{test,spec}.{ts,tsx}"],
    languageOptions: {
      globals: {
        Buffer: "readonly",
      },
    },
  },
];
