/**
 * 矢印に書いた多重度 (`cardinality`) から端の形を描けない時、書いた行へ知らせが出る (#2107)。
 *
 * 多重度で端の形が決まるのは `type: er` の 6 語だけ。 それ以外の形は図に何も足さないか、
 * 名前に `(語)` と添えるだけで、知らせが 1 件も出ていなかった (図種ごとに測ると、ER 図に 6 語を書いた形と、
 * 矢印を捨てたと既に知らせる図種を除いて、全てこの形だった)。
 *
 * | 書いた形 | 知らせ |
 * |---|---|
 * | `er` で 6 語 | 出さない |
 * | `er` で 6 語以外、端を両方は書いていない | 描かない端を伝える |
 * | `er` で 6 語以外、端を両方書いた | 出さない (描かない端が無い) |
 * | `er` 以外 | 多重度を描かないことを伝える |
 *
 * **同じ行に 2 件並べない**。 順序図の板とガントチャート (#2111) は矢印の飾りの知らせに多重度を足し、図種の
 * 組み立てが既に知らせた行 (矢印を捨てた等) はその知らせだけにする。 図種は `PRESET_TYPES` から導き、
 * 手で並べない。
 */
import { describe, expect, it } from "vitest";
import { ER_CARDINALITY_HEAD } from "@cardenelabs/cdl";
import { PRESET_TYPES, jsonToDiagram, textDslToDiagram, type CompileNotice } from "../src/index";

const 語たち = Object.keys(ER_CARDINALITY_HEAD);

/** 箱 2 つと矢印 1 本の記法。 矢印は最後の行に置く */
function 記法(type: string, 矢印の飾り: string, 段 = false): string {
  return [
    "title: T",
    `type: ${type}`,
    ...(段 ? ["animation:", '  - step: "全体" 1s', "    focus: [A, B]"] : []),
    "actors:",
    '  - A: "10"',
    '  - B: "20"',
    "flow:",
    `  - A -> B: "x"${矢印の飾り}`,
  ].join("\n");
}

/** 記法を組み立て、矢印の行を指す知らせを返す */
function 矢印の行の知らせ(src: string): CompileNotice[] {
  const 知らせ: CompileNotice[] = [];
  textDslToDiagram(src, { onNotice: (n) => 知らせ.push(n) });
  const 矢印の行 = src.split("\n").length;
  return 知らせ.filter((n) => n.line === 矢印の行);
}

const 多重度の知らせ = (src: string): CompileNotice[] =>
  矢印の行の知らせ(src).filter((n) => n.kind === "cardinality-not-honored");

describe("矢印に書いた多重度が端の形にならない時に知らせる (#2107)", () => {
  it("描画側の表から語を 1 つ以上導けている", () => {
    expect(語たち.length, "多重度の語を 1 つも導けていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  for (const 段 of [false, true]) {
    describe(`type: er (${段 ? "段を持つ図" : "段の無い図"})`, () => {
      it.each(語たち.flatMap((語) => [語, 語.toLowerCase()]))("6 語 (%s) を書くと知らせない", (語) => {
        expect(多重度の知らせ(記法("er", ` { cardinality: "${語}" }`, 段))).toEqual([]);
      });

      it.each(["N:N", "2..5"])("6 語に無い %s を書くと、両端を描かないことを書いた行で 1 件伝える", (語) => {
        const 出た = 多重度の知らせ(記法("er", ` { cardinality: "${語}" }`, 段));
        expect(出た).toHaveLength(1);
        expect(出た[0]!.actor).toBe("A");
        expect(出た[0]!.message).toContain(`"${語}"`);
        expect(出た[0]!.message).toContain("両端の形を描きません");
        // 書き直し方として 6 語を全て並べる (描画側の表と同じ語)
        for (const 端の語 of 語たち) expect(出た[0]!.hint).toContain(端の語);
      });

      it("6 語に無い語でも、端を両方書けば知らせない", () => {
        expect(多重度の知らせ(記法("er", ' { cardinality: "2..5", tailHead: one, head: many }', 段))).toEqual([]);
      });

      it("6 語に無い語で端を片方だけ書くと、書いていない側の端を伝える", () => {
        const 行き先だけ = 多重度の知らせ(記法("er", ' { cardinality: "2..5", head: many }', 段));
        expect(行き先だけ.map((n) => n.message)).toEqual([expect.stringContaining("出どころ側の形を描きません")]);
        const 出どころだけ = 多重度の知らせ(記法("er", ' { cardinality: "2..5", tailHead: one }', 段));
        expect(出どころだけ.map((n) => n.message)).toEqual([expect.stringContaining("行き先側の形を描きません")]);
      });

      it("空白だけの多重度は書かなかったものとして知らせない", () => {
        expect(多重度の知らせ(記法("er", ' { cardinality: "  " }', 段))).toEqual([]);
      });
    });
  }

  it("JSON から書いても同じ知らせが出る", () => {
    const 知らせ: CompileNotice[] = [];
    jsonToDiagram(
      {
        title: "T",
        type: "er",
        actors: [{ name: "A" }, { name: "B" }],
        flow: [{ from: "A", to: "B", label: "x", cardinality: "N:N" }],
      },
      { onNotice: (n) => 知らせ.push(n) },
    );
    expect(知らせ.filter((n) => n.kind === "cardinality-not-honored").map((n) => n.message)).toEqual([
      expect.stringContaining('"N:N"'),
    ]);
  });

  describe("type: er 以外", () => {
    const 図種たち = [...PRESET_TYPES].filter((t) => t !== "er");

    it("図種を 1 つ以上導けていて、元から知らせる行と知らせない行の両方を含む", () => {
      // 片方しか無いと、下の検査の分かれ道の片側が一度も通らない
      const 元の件数 = 図種たち.map((t) => 矢印の行の知らせ(記法(t, "")).length);
      expect(元の件数.filter((n) => n === 0).length, "矢印の行に元から知らせが無い図種が無い").toBeGreaterThan(0);
      expect(元の件数.filter((n) => n === 1).length, "矢印の行に元から知らせがある図種が無い").toBeGreaterThan(0);
    });

    it.each(図種たち)("%s: 多重度を書いた矢印の行の知らせはちょうど 1 件", (type) => {
      const 無し = 矢印の行の知らせ(記法(type, ""));
      const 有り = 矢印の行の知らせ(記法(type, ' { cardinality: "1:N" }'));
      expect(有り).toHaveLength(1);
      if (無し.length === 0) {
        // 元は何も知らせていない行 = 多重度が効かないことを伝える
        expect(有り[0]!.message).toContain("多重度");
      } else {
        // 元から知らせていた行 (矢印を捨てた等) は、その知らせの種類のまま。 文が変わるのは、
        // 矢印の飾りを並べる知らせ (ガントチャート、#2111) が多重度を足した時だけ
        expect(有り[0]!.kind).toBe(無し[0]!.kind);
        if (有り[0]!.message !== 無し[0]!.message) expect(有り[0]!.message).toContain("多重度");
      }
    });

    it("クラス図では、多重度を書く欄を案内する", () => {
      const 出た = 多重度の知らせ(記法("class", ' { cardinality: "1..*" }'));
      expect(出た.map((n) => n.hint)).toEqual([expect.stringMatching(/sub.*tailSub/)]);
    });

    it("矢印を最初の行でまとめて捨てる図種では、2 本目の矢印の多重度はその行で伝える", () => {
      // 値の図は捨てた本数を最初の矢印の行で 1 件にまとめる。 2 本目の行には知らせが無い
      const src = [記法("pie", ""), '  - B -> A: "y" { cardinality: "1:N" }'].join("\n");
      expect(多重度の知らせ(src)).toHaveLength(1);
    });
  });
});
