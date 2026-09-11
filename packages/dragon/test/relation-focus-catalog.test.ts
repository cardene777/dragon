/**
 * 順番を持たない図を「触れて読む」 形にした (#1757)。
 *
 * クラス図と ER 図は箱と箱の関係が **同時に** 成り立っている。 線を 1 本ずつ引く動きは
 * 作り手が決めた読ませ方でしかなく、読み手の問い (この箱はどこと繋がっているか) には
 * 答えない。 描画エンジン側の受け口は `cdl#806` が持つ。
 *
 * ## 対象は実物から導く
 *
 * 図の id を手で並べない。 並べると、クラス図や ER 図を足した時に一覧へ足し忘れても
 * 検査が緑のまま通る。 図が持つ `type` から導けば、足した図が自動で対象に入る。
 *
 * ## 母数を出す
 *
 * 「0 件」 は該当なしと測っていないの両方を意味しうるので、走査した枚数と対象の枚数を
 * 落ちた時の文面に載せる。 対象が 1 枚も無い状態で通らないよう、下限も課す。
 */
import { describe, it, expect } from "vitest";

import { TOP_LEVEL_KEYS, textDslToDiagram } from "../src/index";
import { 全図 } from "./support/responsive-accepted";
import { FORMS } from "../../../apps/playground-spa/src/lib/syntax-forms";

/** 順番を持たない図の種類。 `cdl` の preset がこの語を `type` に入れる */
const 順番を持たない = new Set(["class", "er"]);

type 図 = (typeof 全図)[number] & {
  id?: string;
  type?: string;
  relationFocus?: string;
  edgeReveal?: string;
};

const 対象 = (全図 as 図[]).filter((d) => 順番を持たない.has(d.type ?? ""));
const 対象外 = (全図 as 図[]).filter((d) => !順番を持たない.has(d.type ?? ""));
const 母数の文 = `走査 ${全図.length} 枚 / 対象 ${対象.length} 枚 / 対象外 ${対象外.length} 枚`;

describe("順番を持たない図が触れて読む形になっている (#1757)", () => {
  it("対象が 1 枚以上ある (検査が空振りしていない)", () => {
    expect(対象.length, `順番を持たない図が 1 枚も無い (${母数の文})`).toBeGreaterThan(0);
  });

  it("母数の内訳が走査した枚数と一致する", () => {
    expect(対象.length + 対象外.length, 母数の文).toBe(全図.length);
  });

  it("対象は全て触れた箱の関係を光らせる", () => {
    const 欠け = 対象.filter((d) => d.relationFocus !== "hover").map((d) => d.id ?? "(id なし)");
    expect(欠け, `${母数の文}\n指定の無い図: ${欠け.join(", ")}`).toEqual([]);
  });

  it("対象は全て線を最初から出す", () => {
    const 欠け = 対象.filter((d) => d.edgeReveal !== "all").map((d) => d.id ?? "(id なし)");
    expect(欠け, `${母数の文}\n指定の無い図: ${欠け.join(", ")}`).toEqual([]);
  });

  /*
   * 「0 件」 を期待する側なので植え込み対照を置く
   * (`rules/quality.md § 期待する件数で対照の向きが変わる`)。
   * 本番と同じ探し方を、指定を持つ図を 1 枚混ぜた集合へ当てて 1 件見つかることを見る。
   */
  const 広がりを探す = (図たち: 図[]): string[] =>
    図たち.filter((d) => d.relationFocus !== undefined).map((d) => d.id ?? "(id なし)");

  it("対象外の図には指定が付いていない", () => {
    expect(広がりを探す(対象外), `${母数の文}\n対象外なのに指定がある図`).toEqual([]);
  });

  it("探し方が指定を持つ図を見つける (植え込み対照)", () => {
    const 植えた = [...対象外, { id: "植えた図", type: "flow", relationFocus: "hover" } as 図];
    expect(広がりを探す(植えた)).toEqual(["植えた図"]);
  });
});

describe("記法から触れて読む指定を書ける (#1757)", () => {
  const 記法 = (値: string): string =>
    [
      'title: "関係"',
      "type: er",
      `relations: ${値}`,
      "",
      "actors:",
      "  - 注文",
      "  - 明細",
      "",
      "flow:",
      '  - 注文 -> 明細: "持つ"',
      "",
    ].join("\n");

  it("最上位の項目に relations がある", () => {
    expect(TOP_LEVEL_KEYS).toContain("relations");
  });

  it.each([
    ["hover", "hover"],
    ["off", "off"],
  ])("relations: %s が図に渡る", (書いた, 期待) => {
    const d = textDslToDiagram(記法(書いた)) as { relationFocus?: string };
    expect(d.relationFocus).toBe(期待);
  });

  it("書かなければ図に付かない", () => {
    const 書かない = 記法("hover")
      .split("\n")
      .filter((l) => !l.startsWith("relations:"))
      .join("\n");
    const d = textDslToDiagram(書かない) as { relationFocus?: string };
    expect(d.relationFocus).toBeUndefined();
  });

  it("読めない値では理由が返る", () => {
    expect(() => textDslToDiagram(記法("ほげ"))).toThrow(/relations が読めません/);
  });

  it("読めない値の案内が書ける語を並べる", () => {
    expect(() => textDslToDiagram(記法("ほげ"))).toThrow(/off \/ hover/);
  });
});

describe("記法一覧が触れて読む指定を載せている (#1757)", () => {
  const 節 = FORMS.find((s) => s.title.includes("relations:"));

  it("節がある", () => {
    expect(節, "記法一覧に relations: の節が無い").toBeDefined();
  });

  it("書ける値を 2 つとも載せている", () => {
    const 行 = (節?.lines ?? []).map((l) => l.code);
    expect(行).toContain("relations: off");
    expect(行).toContain("relations: hover");
  });

  it("節の数が 1 件以上ある (検査が空振りしていない)", () => {
    expect(FORMS.length).toBeGreaterThan(0);
  });
});
