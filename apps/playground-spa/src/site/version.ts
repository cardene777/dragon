/**
 * 版の札に出す版 (#3035)。概要、使い方、更新履歴が同じ値を読む。
 *
 * `packages/dragon/package.json` の版を build 時に差し込んだ値 (`vite.config.ts` の `define`) から `v{major}.{minor}` を作る。
 * 版を手で書くと、版を上げた時に札だけが古いまま残る。
 */
export const VERSION = `v${__DRAGON_VERSION__.split(".").slice(0, 2).join(".")}`;
