/**
 * 記法で書いた表のつながりの図を見分ける端の名前を固定する (#2805)。
 * CSS と単体の検査を突き合わせるのは、片方だけ直した時に別の図を表の図と呼ぶずれを防ぐため。
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { 個数の端 } from "../../../../packages/dragon/test/support/record-edges";

const CSS = readFileSync(
  fileURLToPath(new URL("../styles/cdl-theme.css", import.meta.url)),
  "utf8",
).replace(/\/\*[\s\S]*?\*\//gu, "");

const recordの規則 = [...CSS.matchAll(/([^{}]+)\{([^{}]*)\}/gu)]
  .map((一致) => ({ 選び方: 一致[1] ?? "", 宣言: 一致[2] ?? "" }))
  .filter(
    ({ 選び方 }) =>
      選び方.includes('data-cdl-type="record"') && 選び方.includes('data-cdl-role="edge-line"'),
  );

describe("record の表のつながりに当てる線の薄さ (#2805)", () => {
  it("通常と光る線の規則が、個数を表す端を同じ集合で囲う", () => {
    expect(recordの規則, "record の線を囲う規則が通常と光る線の 2 つでない").toHaveLength(2);

    const 期待する端 = [...個数の端].sort();
    for (const { 選び方 } of recordの規則) {
      const CSSの端 = [
        ...new Set(
          [...選び方.matchAll(/data-cdl-edge-head="([^"]+)"/gu)].map((一致) => 一致[1] ?? ""),
        ),
      ].sort();
      expect(CSSの端, `CSS が囲う端 ${CSSの端.join(" / ")}`).toEqual(期待する端);
    }

    const 薄さの変数 = ({ 宣言 }: (typeof recordの規則)[number]): string => {
      const 一致 = 宣言.match(/stroke-opacity:\s*var\((--d-relation-edge-opacity(?:-active)?)\)/u);
      return 一致?.[1] ?? "";
    };
    const 通常 = recordの規則.filter(({ 選び方 }) => !選び方.includes('data-cdl-active="true"'));
    const 光る = recordの規則.filter(({ 選び方 }) => 選び方.includes('data-cdl-active="true"'));
    expect(通常, "通常の線へ当てる規則").toHaveLength(1);
    expect(光る, "光る線へ当てる規則").toHaveLength(1);
    expect(通常.map(薄さの変数), "通常の線へ当てる薄さ").toEqual(["--d-relation-edge-opacity"]);
    expect(光る.map(薄さの変数), "光る線へ当てる薄さ").toEqual([
      "--d-relation-edge-opacity-active",
    ]);
  });
});
