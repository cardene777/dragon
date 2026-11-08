/**
 * 定義の並びを読む処理と、足した箱の形を描いて測る処理の登録 (#3520)。
 * 図を並べる処理 (`layout/scene.ts`) も登録した処理を読むので、定義の形 (`user-blocks.ts`) から分けて置く。
 * 並べる処理が `user-blocks.ts` を読むと、どの種類の図も読む束へ定義の形が移り、見本帳が最初に読む script が gzip で 190 byte ほど増えた (実測) ため
 */
import type { UserBlockReader } from "./user-blocks";

let reader: UserBlockReader | undefined;

/** 定義の並びを読む処理を登録する */
export function registerUserBlockReader(given: UserBlockReader): void {
  reader = given;
}

/** 登録した、定義の並びを読む処理。まだ読んでいなければ `undefined` */
export const userBlockReader = (): UserBlockReader | undefined => reader;
