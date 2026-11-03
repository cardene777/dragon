/** `build-validator.mjs` の型 (#3346)。検査 (`test/format-v2.test.ts`、`test/schema.test.ts`) が読む */

/** 骨組みの形 */
export declare const BASE: string;
/** 束ねて書き出す原本の形 */
export declare const SCHEMA: string;
/** 書き出す検査の関数 */
export declare const OUT: string;

/** 骨組みとブロックの形の欠片を束ねた原本の形。`blocks` を渡さなければ置き場の全てのブロック */
export declare function compose(blocks?: unknown): Record<string, unknown>;

/** 書き出す 2 つの file の中身 (原本の形の JSON と、検査の関数の JS) */
export declare function generate(blocks?: unknown): { schema: string; validator: string };
