/**
 * `dragon embed` で書き出した 1 枚の HTML でも、描いた箱と囲みが記法の id を `data-node` に持つ (#3795)。
 *
 * 止めて置く塊 (`data-still`) は、書き出す時に最後の段の形を描いた SVG に置き換わるので、ブラウザを開かずに中身を読める。
 * 動く塊は埋めた script が同じ描く処理で描くので、描いた要素の件は `node-ids.test.ts` が持つ。
 * 埋める処理は全ての種類を読み、どの種類を変えてもこの検査が選ばれるので、描いた要素の件と分ける (#3763)。
 */
import { describe, expect, it } from "vitest";
import { embedPageWith } from "../src/export/embed";

const PAGE = [
  "<!doctype html>",
  '<html lang="ja"><body>',
  "<pre class=\"dragon\" data-still>",
  "architecture 送る仕組み",
  "",
  "group src as 送る側",
  "  box app as アプリ",
  "end",
  "box db as 記録",
  "",
  "step 送る",
  "  say アプリが記録へ書く。",
  "  app -> db: 書く",
  "</pre>",
  '<script src="https://cdn.jsdelivr.net/npm/@cardenelabs/dragon/dist/cdn/dragon.js"></script>',
  "</body></html>",
].join("\n");

describe("書き出した 1 枚の HTML", () => {
  it("embed-html-keeps-node-ids", () => {
    const page = embedPageWith(PAGE, "");
    expect(page, "dragon embed が頁を書き出さない").toBeDefined();
    const ids = [...(page ?? "").matchAll(/\sdata-node="([^"]*)"/gu)].map((m) => m[1]);
    for (const id of ["app", "db", "src"]) {
      expect(ids, `書き出した HTML の箱か囲み ${id} が data-node を持たない`).toContain(id);
    }
  });
});
