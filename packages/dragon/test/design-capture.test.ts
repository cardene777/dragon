import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// @ts-expect-error -- 検査対象は .mjs で型宣言を持たない
import { 引き終わり, 受け取れるか } from "../scripts/design-capture.mjs";

type 状態 = { 見た: number; 途中: string[]; 引き終わった: boolean };
type 判定 = { 受け取る: boolean; なぜ: string };

/**
 * 辺 1 本ぶんの markup。
 *
 * 属性の並びは engine が出す形に合わせる (`data-cdl-role` が `d` より前)。
 * 引いている途中は線だけが短く、光は経路を丸ごと持つ。
 */
const 辺 = (id: string, 線: string, 光: string) =>
  `<g data-cdl-edge="${id}" data-cdl-from="a" data-cdl-to="b">` +
  `<path data-cdl-role="edge-line" d="${線}" stroke="blue"></path>` +
  `<path data-cdl-role="edge-glow" d="${光}" stroke="blue"></path>` +
  `</g>`;

/** 属性が逆順の形。 engine の出し方が変わっても拾えることを確かめる */
const 辺逆順 = (id: string, 線: string, 光: string) =>
  `<g data-cdl-edge="${id}">` +
  `<path d="${線}" data-cdl-role="edge-line"></path>` +
  `<path d="${光}" data-cdl-role="edge-glow"></path>` +
  `</g>`;

const 引き終えた = "M 0 0 L 100 0";
const 引きかけ = "M 0 0 L 55.5 0";

const 図 = (...辺群: string[]) => `<svg viewBox="0 0 200 100">${辺群.join("")}</svg>`;

describe("引き終わりの判定", () => {
  it("光と線の経路が一致すれば引き終わっている", () => {
    const r = 引き終わり(図(辺("e1", 引き終えた, 引き終えた), 辺("e2", 引き終えた, 引き終えた))) as 状態;

    expect(r.見た, "辺を 1 本も見ていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(r.見た).toBe(2);
    expect(r.途中).toEqual([]);
    expect(r.引き終わった).toBe(true);
  });

  it("線だけが短い辺を、引いている途中として名指す", () => {
    const r = 引き終わり(図(辺("e1", 引き終えた, 引き終えた), 辺("e2", 引きかけ, 引き終えた))) as 状態;

    expect(r.見た).toBe(2);
    // どの辺かを返す = 名指せないと、待ちが足りないのか別の欠陥かを分けられない
    expect(r.途中).toEqual(["e2"]);
    expect(r.引き終わった).toBe(false);
  });

  it("属性の並びが逆でも拾う", () => {
    const r = 引き終わり(図(辺逆順("e1", 引きかけ, 引き終えた))) as 状態;

    expect(r.見た, "並びが逆の辺を 1 本も見ていない").toBe(1);
    expect(r.途中).toEqual(["e1"]);
  });

  it("光を持たない辺は判定材料に数えない", () => {
    // 光が付くのは光っている辺だけ。 光の無い辺を「引き終わった」 と数えると、
    // 実際に引いている辺があっても引き終わりに倒れる
    const 光なし = `<g data-cdl-edge="e9"><path data-cdl-role="edge-line" d="${引きかけ}"></path></g>`;
    const r = 引き終わり(図(光なし)) as 状態;

    expect(r.見た).toBe(0);
    expect(r.引き終わった).toBe(false);
  });

  it("辺を 1 本も持たない図は「引き終わった」 と言わない", () => {
    const r = 引き終わり(図()) as 状態;

    expect(r.見た).toBe(0);
    // 判らないことを「引き終わった」 に潰さない。 受け取るかは呼出側が決める
    expect(r.引き終わった).toBe(false);
  });
});

describe("控えてよいかの判定", () => {
  const 段 = (phase: string, svg: string) => ({ phase, svg });

  it("同じ段のまま引き終わっていれば受け取る", () => {
    const s = 図(辺("e1", 引き終えた, 引き終えた));
    const r = 受け取れるか(段("p3", s), 段("p3", s)) as 判定;

    expect(r.受け取る).toBe(true);
  });

  it("まだ引いている間は受け取らない", () => {
    const r = 受け取れるか(
      段("p3", 図(辺("e1", 引きかけ, 引き終えた))),
      段("p3", 図(辺("e1", 引きかけ, 引き終えた))),
    ) as 判定;

    expect(r.受け取る).toBe(false);
    expect(r.なぜ).toContain("e1");
  });

  it("待つ間に段が進んだら受け取らない", () => {
    const s = 図(辺("e1", 引き終えた, 引き終えた));
    const r = 受け取れるか(段("p3", s), 段("p4", s)) as 判定;

    expect(r.受け取る).toBe(false);
    // 呼出側はこの理由で待ちを打ち切る。 文言を変えるなら呼出側も直す
    expect(r.なぜ.startsWith("待つ間に")).toBe(true);
  });

  it("判定材料の無い図は、段さえ変わっていなければ受け取る", () => {
    // 待っても判る材料が増えない。 待ち続けると段を 1 つも控えられずに終わる
    const s = 図();
    const r = 受け取れるか(段("p1", s), 段("p1", s)) as 判定;

    expect(r.受け取る).toBe(true);
    expect(r.なぜ).toContain("判じる辺が無い");
  });

  it("読み取れなかった側があれば受け取らない", () => {
    const s = 図(辺("e1", 引き終えた, 引き終えた));

    expect((受け取れるか(null, 段("p1", s)) as 判定).受け取る).toBe(false);
    expect((受け取れるか(段("p1", s), null) as 判定).受け取る).toBe(false);
    expect((受け取れるか(段("p1", s), { phase: "p1", svg: "" }) as 判定).受け取る).toBe(false);
  });
});

describe("実物で確かめる", () => {
  /**
   * 吸い出した markup をそのまま通す。
   *
   * 組み立てた markup だけで確かめると、engine が出す形が変わった時に気付けない。
   * 実物は `.context/` にしか無く commit されないため、無い時は飛ばす = 検査が
   * 落ちるのではなく「見ていない」 ことが判る形にする。
   */
  it("納めた look.svg は引き終わっている", (ctx) => {
    const repo = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
    const 対象 = ["er-demo", "seq-demo", "infra-demo", "chart-line-demo"]
      .map((id) => join(repo, "docs/design/notation/presets", id, "look.svg"))
      .filter((p) => existsSync(p));

    // **抜けるのではなく飛ばす** (#2500)。 裸の `return` は通ったのと見分けが付かない。
    // `ctx.skip()` なら報告に「飛ばした」 と出るので、上の doc が言う
    // 「落ちるのではなく見ていないことが判る形」 が実際に成り立つ
    if (対象.length === 0) ctx.skip();

    for (const p of 対象) {
      const r = 引き終わり(readFileSync(p, "utf8")) as 状態;
      expect(r.途中, `${p} に引きかけの辺が残っている`).toEqual([]);
    }
  });
});
