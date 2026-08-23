/**
 * `deploy-pages.mjs` の型宣言 (#1347)。
 *
 * 実体は `node` が直接走らせる `.mjs` で、検査 (`src/lib/deploy-payload.test.ts`) からは
 * 掃除の対象を読むために import する。 本 file が無いと `implicitly has an 'any' type` で
 * 型検査が落ちる。
 */

/** 配信の clone から消す対象 (`globby` の pattern)。 `.git` は除外する */
export declare const 掃除の対象: readonly string[];

/** 配信する branch */
export declare const 配信先branch: string;
