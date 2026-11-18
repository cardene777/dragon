/**
 * 準備の段が済ませた仕事の結果を、件が読む (#3734)。
 *
 * 検査の file は、同じ名前の準備の file (`<名前>.prepare.ts`) の既定の書き出しの型で結果を受ける。
 * 準備が落ちた時と、準備の段を持たない設定で回した時は、読んだ件が file の名前と理由を挙げて落ちる。
 * file を読む段で読まず、件の中で読む。file を読む段で落ちると、件の名前が出ないため。
 */
import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import { inject } from "vitest";
import { readPrepared } from "../../../test-support/prepare";

/** 検査の file (`import.meta.url`) の準備の結果 */
export function prepared<T>(testFileUrl: string): T {
  return readPrepared(inject("dragonPrepared") ?? {}, relative(process.cwd(), fileURLToPath(testFileUrl))) as T;
}
