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
