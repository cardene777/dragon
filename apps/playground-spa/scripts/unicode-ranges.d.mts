/**
 * `unicode-ranges.mjs` の型宣言。
 *
 * 字を作る命令は `node` が直接走らせるので実体は `.mjs` に置き、組み立ての設定と検査はここを通して読む。
 */

/** `U+30-39,U+3000-303F,U+30??` の形の範囲の字の番号を、書かれた順に返す */
export declare function codesOf(list: string): number[];

/** 字の番号を、連なりを畳んだ `U+3001-3002,U+3005` の形にする */
export declare function rangeOf(codes: readonly number[]): string;
