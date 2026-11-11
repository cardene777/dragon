/**
 * 表のブロックの数の決まり (#3657)。後から読む読み方 (`read.ts`) と形の欠片 (`shape.ts`)だけが読む。
 * 定義 (`block.ts`) に置くと、本体と後から読む塊の両方が定義の file を読み、1行の入口で定義が最初に読む別の file に分かれ、最初に読む量が増える
 */

/** 1 つの図に書ける表の数 */
export const ER_TABLES = { least: 1, most: 6 } as const;
