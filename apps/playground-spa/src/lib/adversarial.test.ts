import { describe, it, expect } from "vitest";
import { setDiagramScale, readDiagramScale, clampDiagramScale, clampFontScale } from "./diagram-scale";

describe("diagram-scale — 壊しに行く入力", () => {
  it("viewport 行が 2 つある DSL でも 1 つだけ触る", () => {
    const src = 'type: sequence\nviewport: { laneGap: 100 }\nactors:\n  - A\nviewport: { nodeGap: 50 }\n';
    const out = setDiagramScale(src, 1.5);
    // scale が 1 箇所だけ入る
    expect((out.match(/scale:/g) ?? []).length).toBe(1);
    // 元の 2 行がどちらも残る
    expect(out).toContain("laneGap: 100");
    expect(out).toContain("nodeGap: 50");
  });

  it("viewport の値に入れ子がある DSL を壊さない", () => {
    const src = 'type: sequence\nviewport: { pad: { x: 10, y: 20 }, laneGap: 100 }\nactors:\n  - A\n';
    const out = setDiagramScale(src, 2);
    expect(out).toContain("pad: { x: 10, y: 20 }");
    expect(out).toContain("scale: 2");
  });

  it("viewport の値に quoted 文字列があっても壊さない", () => {
    const src = 'type: sequence\nviewport: { label: "a, b", laneGap: 100 }\nactors:\n  - A\n';
    const out = setDiagramScale(src, 2);
    expect(out).toContain('label: "a, b"');
  });

  it("CRLF の DSL で行末が混在しない", () => {
    const src = 'title: "T"\r\ntype: sequence\r\nactors:\r\n  - A\r\n';
    const out = setDiagramScale(src, 1.5);
    expect(out.match(/(?<!\r)\n/), "LF 単独").toBeNull();
  });

  it("空文字の DSL でも落ちない", () => {
    expect(() => setDiagramScale("", 1.5)).not.toThrow();
    expect(readDiagramScale("")).toBe(1);
  });

  it("type 行が無い DSL でも壊さない", () => {
    const src = 'actors:\n  - A\n';
    const out = setDiagramScale(src, 1.5);
    expect(out).toContain("scale: 1.5");
    expect(out, "元の内容が残る").toContain("- A");
  });

  it("倍率を往復しても値が増殖しない", () => {
    let src = 'type: sequence\nactors:\n  - A\n';
    for (let i = 0; i < 10; i += 1) src = setDiagramScale(src, 1.1);
    expect((src.match(/scale:/g) ?? []).length, "scale の数").toBe(1);
    expect((src.match(/viewport:/g) ?? []).length, "viewport の数").toBe(1);
  });

  it("1 に戻すと viewport 行ごと消えて元の DSL に一致する", () => {
    const base = 'title: "T"\ntype: sequence\nactors:\n  - A\n';
    expect(setDiagramScale(setDiagramScale(base, 2), 1)).toBe(base);
  });

  it("type が最終行 (末尾改行なし) でも行が連結しない", () => {
    // splice の位置を誤ると `type: sequenceviewport: { scale: 1.5 }` と繋がる (実測)。
    const out = setDiagramScale('title: "T"\ntype: sequence', 1.5);
    expect(out).toBe('title: "T"\ntype: sequence\nviewport: { scale: 1.5 }');
    expect(out, "行が繋がっていない").not.toMatch(/sequenceviewport/);
  });

  it("block 形式の viewport に 2 つ目を作らない", () => {
    // DSL は inline と block の 2 形式を受理する。 inline しか見ないと block 形式に
    // 2 つ目の viewport を作り、 parser が後勝ちで block を採用して倍率が効かなくなる。
    const src = 'type: sequence\nviewport:\n  laneGap: 300\nactors:\n  - A\n';
    const out = setDiagramScale(src, 1.5);
    expect((out.match(/viewport:/g) ?? []).length, "viewport の数").toBe(1);
    expect(out, "block のまま scale が入る").toContain("  scale: 1.5");
    expect(out, "既存 field が残る").toContain("  laneGap: 300");
  });

  it("block 形式でも読み書きが往復する", () => {
    const src = 'type: sequence\nviewport:\n  laneGap: 300\nactors:\n  - A\n';
    expect(readDiagramScale(setDiagramScale(src, 2))).toBe(2);
  });

  it("block 形式で倍率 1 に戻すと scale 行だけ消える", () => {
    const src = 'type: sequence\nviewport:\n  laneGap: 300\nactors:\n  - A\n';
    const out = setDiagramScale(setDiagramScale(src, 2), 1);
    expect(out).not.toContain("scale:");
    expect(out, "他 field は残る").toContain("  laneGap: 300");
    expect(out, "block 自体も残る").toContain("viewport:");
  });

  it("block 形式の viewport が最終行でも壊れない", () => {
    const src = 'type: sequence\nviewport:\n  laneGap: 300';
    const out = setDiagramScale(src, 1.5);
    expect((out.match(/viewport:/g) ?? []).length).toBe(1);
    expect(out).toContain("scale: 1.5");
    expect(out, "行が繋がっていない").not.toMatch(/300[ \t]*scale/);
  });

  describe("viewport が複数ある DSL (parser は後勝ち)", () => {
    // 実測 = inline → block の順なら block が doc.viewport になり、 逆順なら inline。
    // 読み書きが別の viewport を見ると「書いたのに読めない」 食い違いが起きる。
    const CASES: Array<[string, string]> = [
      ["inline → block", 'type: sequence\nviewport: { laneGap: 100 }\nviewport:\n  nodeGap: 50\nactors:\n  - A\n'],
      ["block → inline", 'type: sequence\nviewport:\n  nodeGap: 50\nviewport: { laneGap: 100 }\nactors:\n  - A\n'],
      ["inline 2 つ", 'type: sequence\nviewport: { laneGap: 100 }\nviewport: { nodeGap: 50 }\nactors:\n  - A\n'],
      ["block 2 つ", 'type: sequence\nviewport:\n  laneGap: 100\nviewport:\n  nodeGap: 50\nactors:\n  - A\n'],
    ];
    for (const [name, src] of CASES) {
      it(`${name} = 書いた値が読める`, () => {
        const out = setDiagramScale(src, 2);
        expect(readDiagramScale(out), `${name} の読み戻し`).toBe(2);
        expect((out.match(/scale:/g) ?? []).length, `${name} の scale 数`).toBe(1);
      });
    }
  });

  it("block 形式の細部 (空行 / tab 字下げ / 後続 key / 入れ子) で壊れない", () => {
    const CASES: Array<[string, string]> = [
      ["空行", 'type: sequence\nviewport:\n  laneGap: 300\n\nactors:\n  - A\n'],
      ["tab 字下げ", 'type: sequence\nviewport:\n\tlaneGap: 300\nactors:\n  - A\n'],
      ["後続 key", 'type: sequence\nviewport:\n  laneGap: 300\nanimation:\n  - step: "x"\n'],
      ["入れ子", 'type: sequence\nviewport:\n  pad: { x: 1, y: 2 }\n  laneGap: 300\nactors:\n  - A\n'],
    ];
    for (const [name, src] of CASES) {
      const out = setDiagramScale(src, 1.5);
      expect((out.match(/viewport:/g) ?? []).length, `${name} の viewport 数`).toBe(1);
      expect(readDiagramScale(out), `${name} の読み戻し`).toBe(1.5);
    }
  });

  it("block 内の空行より後ろの field も見る (parser と同じ終端条件)", () => {
    // parser の `collectIndentedList` は空行を読み飛ばして続ける。 打ち切ると
    // 空行の後にある scale が見えず、 2 つ目を書いて parser の後勝ちで元の値が残る。
    const src = 'type: sequence\nviewport:\n  laneGap: 300\n\n  scale: 2\nactors:\n  - A\n';
    expect(readDiagramScale(src), "空行の後の scale を読む").toBe(2);
    const out = setDiagramScale(src, 1.5);
    expect((out.match(/scale:/g) ?? []).length, "scale が増えない").toBe(1);
    expect(readDiagramScale(out), "書いた値が読める").toBe(1.5);
  });

  it("block の全 field が空行の後にあっても見つける", () => {
    const src = 'type: sequence\nviewport:\n\n  laneGap: 300\n  scale: 3\nactors:\n  - A\n';
    expect(readDiagramScale(src)).toBe(3);
    const out = setDiagramScale(src, 2);
    expect((out.match(/scale:/g) ?? []).length).toBe(1);
    expect(readDiagramScale(out)).toBe(2);
  });

  it("不正な倍率は 1 に倒す", () => {
    for (const v of [NaN, Infinity, -Infinity, 0, -5]) {
      expect(clampDiagramScale(v), `scale=${v}`).toBe(1);
      expect(clampFontScale(v), `font=${v}`).toBe(1);
    }
  });

  it("読み取りが範囲外の値を返さない", () => {
    for (const raw of ["999", "-3", "0", "abc", ""]) {
      const v = readDiagramScale(`type: sequence\nviewport: { scale: ${raw} }\n`);
      expect(v, `scale=${raw}`).toBeGreaterThanOrEqual(0.5);
      expect(v, `scale=${raw}`).toBeLessThanOrEqual(3);
    }
  });
});
