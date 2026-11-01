/** `packages/dragon/package.json` の版。build と開発 server が `vite.config.ts` の `define` で差し込む (#1320、#3035) */
declare const __DRAGON_VERSION__: string;

/** 字の入口は CSS を読むだけで型を出さない。頁が動いてから読むので `import()` の相手になる (#3292) */
declare module "@cardenelabs/dragon/fonts";
