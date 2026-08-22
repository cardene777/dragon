/**
 * build 時に差し込む値の型 (#1320)。
 *
 * 実体は `vite.config.ts` の `define` が `packages/dragon/package.json` から読んで埋める。
 * 画面から見ると literal に置き換わるので、実行時に import する経路は無い。
 */

/** 記法の版 (`packages/dragon/package.json` の `version`)。 例 `0.10.0` */
declare const __DRAGON_VERSION__: string;
