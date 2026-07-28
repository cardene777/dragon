import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "@cardenelabs/dragon";
import { setDiagramScale, readDiagramScale } from "./diagram-scale";

/**
 * 倍率の読み書きが **parser の実値と一致する** ことを保証する (CAR-2289)。
 *
 * 文字列の形だけを見る test では「読めているつもりで parser は別の値を見ている」
 * 食い違いを拾えない。 実際に `parseTextDslV05` へ通して `doc.viewport.scale` と
 * 突き合わせる。
 *
 * この食い違いは 3 回起きた。
 *
 * 1. block 形式を見ておらず 2 つ目の viewport を作っていた
 * 2. viewport が複数ある時に読み書きが別のものを見ていた
 * 3. block の終端条件が parser と違い、 空行 / コメント / リスト項目より後ろが見えなかった
 *
 * いずれも「UI は 1.5 と言うが描画は 2」 という同じ形で、 文字列比較では気づけない。
 */

/** parser が通る最小の DSL 末尾。 */
const TAIL = 'actors:\n  - A\n  - B\nflow:\n  - A -> B: "req"\n';

/** DSL を parser に通して viewport.scale を取る。 parse 失敗は null。 */
function parserScale(src: string): number | null | undefined {
  const p = parseTextDslV05(src);
  if (!p.ok) return null;
  return p.doc.viewport?.scale;
}

/** viewport の書き方 6 種。 いずれも parser が正規に受理する。 */
const VARIANTS: Array<[string, string]> = [
  ["viewport なし", `title: "T"\ntype: sequence\n${TAIL}`],
  ["inline", `title: "T"\ntype: sequence\nviewport: { laneGap: 300 }\n${TAIL}`],
  ["block", `title: "T"\ntype: sequence\nviewport:\n  laneGap: 300\n${TAIL}`],
  ["block + 空行", `title: "T"\ntype: sequence\nviewport:\n  laneGap: 300\n\n  nodeGap: 40\n${TAIL}`],
  ["block + コメント", `title: "T"\ntype: sequence\nviewport:\n  laneGap: 300\n  # メモ\n  nodeGap: 40\n${TAIL}`],
  ["block + リスト項目", `title: "T"\ntype: sequence\nviewport:\n  laneGap: 300\n  - x\n  nodeGap: 40\n${TAIL}`],
];

describe("倍率の読み書きが parser の実値と一致する", () => {
  for (const [name, src] of VARIANTS) {
    it(`${name} = 書いた倍率が parser にも届く`, () => {
      const out = setDiagramScale(src, 1.5);
      expect(parserScale(out), `${name} の parser 実値`).toBe(1.5);
      expect(readDiagramScale(out), `${name} の読み戻し`).toBe(1.5);
    });

    it(`${name} = 倍率 1 に戻すと parser も既定に戻る`, () => {
      const out = setDiagramScale(setDiagramScale(src, 2), 1);
      expect(parserScale(out), `${name} の parser 実値`).toBeUndefined();
      expect(readDiagramScale(out), `${name} の読み戻し`).toBe(1);
    });

    it(`${name} = 元からある field を壊さない`, () => {
      const out = setDiagramScale(src, 1.5);
      const p = parseTextDslV05(out);
      expect(p.ok, `${name} が parse できる`).toBe(true);
      if (!p.ok) return;
      // 元の DSL に laneGap があれば、 書込後も同じ値で残る
      const before = parseTextDslV05(src);
      if (before.ok && before.doc.viewport?.laneGap !== undefined) {
        expect(p.doc.viewport?.laneGap, `${name} の laneGap`).toBe(before.doc.viewport.laneGap);
      }
    });
  }

  it("既に scale がある DSL を読むと parser と同じ値を返す", () => {
    const CASES: Array<[string, string]> = [
      ["inline", `title: "T"\ntype: sequence\nviewport: { scale: 2 }\n${TAIL}`],
      ["block", `title: "T"\ntype: sequence\nviewport:\n  scale: 2\n${TAIL}`],
      ["block + 空行の後", `title: "T"\ntype: sequence\nviewport:\n  laneGap: 300\n\n  scale: 2\n${TAIL}`],
      ["block + コメントの後", `title: "T"\ntype: sequence\nviewport:\n  laneGap: 300\n  # メモ\n  scale: 2\n${TAIL}`],
      ["block + リスト項目の後", `title: "T"\ntype: sequence\nviewport:\n  laneGap: 300\n  - x\n  scale: 2\n${TAIL}`],
    ];
    for (const [name, src] of CASES) {
      expect(readDiagramScale(src), `${name}`).toBe(parserScale(src));
    }
  });

  it("block の終端判定の境界で parser と食い違わない", () => {
    // parser は「空行は読み飛ばす / 字下げが親以下で終了」。 空白の種類や
    // 字下げ幅で判定が変わると、 その行より後ろの field が見えなくなる。
    const CASES: Array<[string, string]> = [
      ["タブのみの行", `title: "T"\ntype: sequence\nviewport:\n  laneGap: 300\n\t\n  nodeGap: 40\n${TAIL}`],
      ["全角空白の行", `title: "T"\ntype: sequence\nviewport:\n  laneGap: 300\n　\n  nodeGap: 40\n${TAIL}`],
      ["字下げ 1 空白", `title: "T"\ntype: sequence\nviewport:\n laneGap: 300\n${TAIL}`],
      ["block 内が空", `title: "T"\ntype: sequence\nviewport:\n${TAIL}`],
      ["block 直後に別 key", `title: "T"\ntype: sequence\nviewport:\n  laneGap: 300\nactors:\n  - A\n  - B\nflow:\n  - A -> B: "x"\n`],
    ];
    for (const [name, src] of CASES) {
      const out = setDiagramScale(src, 1.5);
      expect(parserScale(out), `${name} の parser 実値`).toBe(1.5);
      expect(readDiagramScale(out), `${name} の読み戻し`).toBe(1.5);
    }
  });

  it("scale が無い DSL は倍率 1 として読む (parser の undefined と同義)", () => {
    // parser は未指定を undefined で返し、 こちらは既定値 1 を返す。 表記は違うが
    // 「倍率 1」 という意味は同じ。 呼び出し側は 1 を基準に増減するのでこれでよい。
    const src = `title: "T"\ntype: sequence\nviewport:\n  laneGap: 300\n${TAIL}`;
    expect(parserScale(src)).toBeUndefined();
    expect(readDiagramScale(src)).toBe(1);
  });

  it("字下げされた viewport 行を block head と誤認しない", () => {
    // `viewport` は top-level 専用。 字下げのある `viewport:` は別 block の中身であって
    // head ではない。 誤認すると存在しない block に書き込んで DSL を壊す。
    const src = `title: "T"\ntype: sequence\nanimation:\n  viewport:\n    x: 1\n${TAIL}`;
    const out = setDiagramScale(src, 1.5);
    // top-level に新しい viewport が作られ、 animation の中身は無傷
    expect(out).toContain("  viewport:");
    expect(out).toContain("    x: 1");
    expect(parserScale(out), "parser の実値").toBe(1.5);
  });

  it("倍率を繰り返し変えても parser の実値が追従する", () => {
    let src = `title: "T"\ntype: sequence\nviewport:\n  laneGap: 300\n${TAIL}`;
    for (const k of [1.25, 1.5, 2, 0.8, 1.1]) {
      src = setDiagramScale(src, k);
      expect(parserScale(src), `倍率 ${k}`).toBeCloseTo(k, 3);
      expect((src.match(/scale:/g) ?? []).length, `倍率 ${k} の scale 数`).toBe(1);
    }
  });

  it("viewport が複数ある DSL でも parser の採用値と一致する", () => {
    const CASES: Array<[string, string]> = [
      ["inline → block", `title: "T"\ntype: sequence\nviewport: { laneGap: 100 }\nviewport:\n  nodeGap: 50\n${TAIL}`],
      ["block → inline", `title: "T"\ntype: sequence\nviewport:\n  nodeGap: 50\nviewport: { laneGap: 100 }\n${TAIL}`],
    ];
    for (const [name, src] of CASES) {
      const out = setDiagramScale(src, 1.5);
      expect(parserScale(out), `${name} の parser 実値`).toBe(1.5);
      expect(readDiagramScale(out), `${name} の読み戻し`).toBe(1.5);
    }
  });
});
