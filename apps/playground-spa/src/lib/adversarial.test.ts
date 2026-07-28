import { describe, it, expect } from "vitest";
import { parsePathD, shiftPathEnd, edgeSideFor } from "./edge-stretch";
import { setDiagramScale, readDiagramScale, clampDiagramScale, clampFontScale } from "./diagram-scale";

/**
 * 壊しに行く入力を与えて、 壊れた出力を作らないことを確認する。
 *
 * 正常系は既存 test が見ているので、 ここでは「想定していない入力」 だけを扱う。
 * 目的は「落ちない」 ことではなく「黙って間違った結果を返さない」 こと =
 * 扱えない入力には null を返して呼び出し側に判断を委ねる。
 */

describe("edge-stretch — 壊しに行く入力", () => {
  const BAD_PATHS = [
    "",                       // 空
    "   ",                    // 空白のみ
    "M",                      // command のみ
    "M 10",                   // 座標が片方だけ
    "L 10 20",                // M で始まらない
    "M 10 20 L",              // 末尾が command だけ
    "M a b L c d",            // 数値でない
    "m 10 20 l 30 40",        // 相対 command
    "M 10 20 Z L 30 40",      // Z の後に続く
    "M 10 20 X 30 40",        // 未知 command
    "M 1e999 0 L 0 0",        // 範囲外の数値
    "M 10,20L30,40",          // 区切りが混在
  ];

  for (const d of BAD_PATHS) {
    it(`parsePathD("${d.slice(0, 20)}") が壊れた結果を返さない`, () => {
      const r = parsePathD(d);
      // null か、 全 token の数値が有限であること
      if (r !== null) {
        for (const t of r) {
          for (const n of t.nums) expect(Number.isFinite(n), `${d} の数値`).toBe(true);
        }
      }
    });

    it(`shiftPathEnd("${d.slice(0, 20)}") が壊れた path を出さない`, () => {
      for (const side of ["start", "end", "both"] as const) {
        const out = shiftPathEnd(d, side, 10, 10);
        if (out === null) continue;
        // 出力が再び parse できること = 壊れていない
        expect(parsePathD(out), `${d} / ${side} の再 parse`).not.toBeNull();
        // NaN が混ざっていないこと
        expect(out, `${d} / ${side} に NaN`).not.toContain("NaN");
        expect(out, `${d} / ${side} に undefined`).not.toContain("undefined");
      }
    });
  }

  it("極端な delta でも数値が壊れない", () => {
    for (const dx of [0, -0, 1e10, -1e10, 0.0001]) {
      const out = shiftPathEnd("M 0 0 L 100 0", "end", dx, 0);
      expect(out).not.toBeNull();
      expect(out, `dx=${dx}`).not.toContain("NaN");
      expect(parsePathD(out!)).not.toBeNull();
    }
  });

  it("NaN / Infinity の delta では壊れた path を出さない", () => {
    for (const dx of [NaN, Infinity, -Infinity]) {
      const out = shiftPathEnd("M 0 0 L 100 0", "end", dx, 0);
      // 出すなら有限な数値であること
      if (out !== null) {
        expect(out, `dx=${dx}`).not.toContain("NaN");
        expect(out, `dx=${dx}`).not.toContain("Infinity");
      }
    }
  });

  it("先頭に空白がある path を拒否しない (SVG 仕様上は正常)", () => {
    // 拒否すると正常な path で矢印が追従しなくなる。
    expect(parsePathD(" M 0 0 L 10 0")).not.toBeNull();
    expect(parsePathD("\n  M 0 0 L 10 0")).not.toBeNull();
    expect(shiftPathEnd(" M 0 0 L 10 0", "end", 5, 0)).toContain("15");
  });

  it("A の引数が足りない path で半径を座標と誤認しない", () => {
    // A は末尾 2 つが座標で、 その前に 5 引数を要する。 個数を見ないと
    // `"M 0 0 A 5 5"` の rx を座標と誤認して `"M 0 0 A 10 5"` を返す = 別の弧になる。
    expect(shiftPathEnd("M 0 0 A 5 5", "end", 5, 0)).toBeNull();
    expect(shiftPathEnd("M 0 0 A 5 5 0", "end", 5, 0)).toBeNull();
    // 7 引数揃っていれば末尾だけ動く
    expect(shiftPathEnd("M 0 0 A 5 5 0 0 1 10 10", "end", 5, 0)).toBe("M 0 0 A 5 5 0 0 1 15 10");
  });

  it("空文字の actor 名で誤検出しない", () => {
    expect(edgeSideFor("s0-client", "s0-api", "", "")).toBeNull();
  });

  it("正規表現の特殊文字を含む actor 名でも落ちない", () => {
    for (const name of ["a.b", "a*b", "a(b)", "a[b]", "a|b", "a\\b", "a+b", "a?b"]) {
      expect(() => edgeSideFor(`s0-${name}`, "s0-api", name, name)).not.toThrow();
    }
  });
});

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

  it("A の引数が 7 の倍数なら弾かない", () => {
    expect(shiftPathEnd("M 0 0 A 5 5 0 0 1 10 10", "end", 5, 0)).not.toBeNull();
    expect(shiftPathEnd("M 0 0 A 5 5 0 0 1 10 10 A 5 5 0 0 1 20 20", "end", 5, 0)).not.toBeNull();
    expect(shiftPathEnd("M 0 0 A 5 5 0 0 1 10 10", "start", 5, 0)).not.toBeNull();
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
