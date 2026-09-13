/**
 * カタログの図表を描いた時に、消せない警告が出ないことの検査 (#1684)。
 *
 * 図表は 1 つの節が図の全体を表す形で、記法にその節を activate する書き方が無い。
 * それでも描画側が「どの phase でも activate されていない (unused、 typo の可能性)」 を
 * 出しており、図表の記法 15 件すべてで鳴っていた (`cdl#743`)。
 *
 * **書き手に直せない警告は、読む価値のある警告まで一緒に無視させる**。 同じ検査は
 * 「未定義の state を参照している」 のような本当の誤りも出すので、雑音を 0 に保つ。
 */
import { describe, expect, it, vi } from "vitest";
import { diagram, validate } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";
import * as charts from "../topics/catalog/charts.cdl";

/** 図表の見本の記法。 `sourceYaml__` は一覧が拾う約束の名前 */
const 図表の記法たち = Object.entries(charts).filter(
  ([key, v]) => key.startsWith("sourceYaml__") && typeof v === "string",
) as [string, string][];

/** 図を validate して、出た警告を集める。 本番も対照もこの 1 つを通す */
function 警告たち(d: CdlDiagram): string[] {
  const 出た: string[] = [];
  const spy = vi.spyOn(console, "warn").mockImplementation((m: unknown) => {
    出た.push(String(m));
  });
  try {
    validate(d);
  } finally {
    spy.mockRestore();
  }
  return 出た;
}

const 未使用の警告 = (出た: string[]): string[] =>
  出た.filter((m) => m.includes("activate されていない"));

describe("カタログの図表は消せない警告を出さない (#1684)", () => {
  it("図表の記法を 1 件以上走査できている", () => {
    // 空振り検知。 記法の集め方が壊れると、下の検査は 0 件を回して必ず通る
    expect(図表の記法たち.length, "図表の記法を 1 つも読めていない").toBeGreaterThan(10);
  });

  it("図表の記法で「使われていない」 の警告が 1 件も出ない", () => {
    const 出た = 図表の記法たち.flatMap(([key, 記法]) =>
      未使用の警告(警告たち(textDslToDiagram(記法))).map((m) => `${key}: ${m}`),
    );
    expect(出た, `${図表の記法たち.length} 件中 ${出た.length} 件で警告が出た`).toEqual([]);
  });

  it("探し方が、置いた警告を見つける", () => {
    // 植え込み対照。 上の検査は 0 件を期待するので、探し方が何も見つけないだけでも通る。
    // どの段でも activate しない節を 1 つ置き、本番と同じ探し方で 1 件見つかることを見る
    const 置いた = diagram("t", { topic: "植え込み" })
      .lane("l", { x: 0, width: 400 })
      .node("誰も呼ばない", { lane: "l", stack: 0, kind: "service", title: "呼ばれない" })
      .phase("p1", { duration: 1000, title: "段", body: "説明" }, (p) => p)
      .build();
    const 出た = 未使用の警告(警告たち(置いた));
    expect(出た.length, "探し方が警告を 1 件も見つけていない").toBe(1);
    expect(出た[0]).toContain("誰も呼ばない");
  });
});
