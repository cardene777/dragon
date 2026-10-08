/**
 * UML の関係を畳んだ record に、class と同じ線の薄さを当てることを固定する (#2783)。
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

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

describe("record の関係に当てる線の薄さ (#2783)", () => {
  it("通常と光る線の規則が、端の種類を問わず record 全体を囲う", () => {
    expect(recordの規則, "record の線を囲う規則が通常と光る線の 2 つでない").toHaveLength(2);

    for (const { 選び方 } of recordの規則) {
      const CSSの端 = [
        ...new Set(
          [...選び方.matchAll(/data-cdl-edge-head="([^"]+)"/gu)].map((一致) => 一致[1] ?? ""),
        ),
      ].sort();
      expect(CSSの端, `record の規則に端の条件が残っている: ${CSSの端.join(" / ")}`).toEqual([]);
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
