/**
 * 動きの記述が図から導かれ、画面まで届いていることの検証 (#1043)。
 *
 * 導く経路が切れると、動く図から一文が消えるだけで誰も気付かない。 説明側は動きを
 * 語らなくなっているため、**画面から動きの情報が丸ごと落ちる** 形になる。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { CATALOG_ITEMS } from "./catalog-items";
import { motionOf, motionNote } from "./catalog-motion";

/** 段が持つものを組み立てて、動きの種類だけを見る最小の図。 */
function diagramWith(opts: {
  tweens?: string[];
  sets?: string[];
  inputs?: string[];
  formulas?: string[];
}): Parameters<typeof motionOf>[0] {
  return {
    id: "x",
    nodes: [],
    inputs: (opts.inputs ?? []).map((id) => ({ id, kind: "slider" })),
    formulas: (opts.formulas ?? []).map((id) => ({ id, expression: "1" })),
    phases: [{
      id: "p1",
      tweens: (opts.tweens ?? []).map((stateId) => ({ stateId, from: 0, to: 1 })),
      sets: (opts.sets ?? []).map((stateId) => ({ stateId, value: 1 })),
    }],
  } as unknown as Parameters<typeof motionOf>[0];
}

describe("動きの記述 (#1043)", () => {
  it("段の実装から動きの種類が決まる", () => {
    expect(motionOf(diagramWith({ tweens: ["a"] })), "tween を連続と読まない").toBe("continuous");
    expect(motionOf(diagramWith({ sets: ["a"] })), "set を段階と読まない").toBe("step");
    expect(motionOf(diagramWith({})), "何も無い図を動くと読む").toBe("none");
    // tween が 1 つでもあれば連続 (set と併存する図がある)
    expect(motionOf(diagramWith({ tweens: ["a"], sets: ["b"] }))).toBe("continuous");
  });

  it("入力欄 / 計算式が握る状態は動きに数えない", () => {
    // 握られている状態は実行時に上書きされるため、段で動かしても画面に届かない。
    // 数えると、画面が動かない図に「連続して動く」 と書くことになる
    expect(motionOf(diagramWith({ tweens: ["v"], inputs: ["v"] })), "入力欄が握る状態を数えている").toBe("none");
    expect(motionOf(diagramWith({ tweens: ["v"], formulas: ["v"] })), "計算式が握る状態を数えている").toBe("none");
    // 握られていない状態が別にあれば動く
    expect(motionOf(diagramWith({ tweens: ["v", "w"], inputs: ["v"] }))).toBe("continuous");
  });

  it("動かない図には一文を付けない", () => {
    expect(motionNote(diagramWith({}))).toBeUndefined();
    expect(motionNote(diagramWith({ tweens: ["a"] }))).toBe("段の中で値が連続して動く");
    expect(motionNote(diagramWith({ sets: ["a"] }))).toBe("段の切替で値が一度に変わる");
  });

  it("一覧の項目が導いた一文を持っている", () => {
    // 組み立て側 (`catalog-items.ts`) の配線が切れていないこと
    const interactive = CATALOG_ITEMS.interactive ?? [];
    expect(interactive.length, "図が 1 件も見つからない").toBeGreaterThan(50);
    const withNote = interactive.filter((i) => typeof i.motionNote === "string");
    expect(withNote.length, "導いた一文を持つ項目が無い (配線が切れている)").toBeGreaterThan(50);
    // 一文の中身は 2 種類しかない (自由文が紛れ込んでいないこと)
    const allowed = new Set(["段の中で値が連続して動く", "段の切替で値が一度に変わる"]);
    const unexpected = [...new Set(withNote.map((i) => i.motionNote))].filter((s) => !allowed.has(s!));
    expect(unexpected, `想定外の一文がある: ${unexpected.join(" / ")}`).toHaveLength(0);
  });

  it("全ての図で、一文が段の実装と一致する", () => {
    // 導く経路が切れると、動く図から一文が消えるだけで誰も気付かない。
    // **一覧に載る全ての図** を見る。 一部の図に絞ると、連続して動く図が 4 件しかないため
    // その 4 件が範囲から外れて、連続側の判定が一度も試されないまま通る (実測で起きた)
    const items = CATALOG_ITEMS.interactive ?? [];
    const kinds = { continuous: 0, step: 0 };
    for (const item of items) {
      const hasTween = (item.diagram.phases ?? []).some((p) => (p.tweens ?? []).length > 0);
      const kind = motionOf(item.diagram);
      if (kind === "none") continue;
      const expected = hasTween ? "段の中で値が連続して動く" : "段の切替で値が一度に変わる";
      expect(item.motionNote, `${item.title} の一文が実装と合わない`).toBe(expected);
      kinds[kind] += 1;
    }
    // 2 種類ともが実データで試されていること
    expect(kinds.continuous, "連続して動く図が 1 件も無い").toBeGreaterThan(0);
    expect(kinds.step, "段の切替で変わる図が 1 件も無い").toBeGreaterThan(0);
  });

  it("画面が導いた一文を出している", () => {
    // 一覧の中と拡大表示の 2 経路がある。 片方だけだと、その経路で動きの情報が落ちる
    const src = readFileSync(new URL("../pages/CategoryPage.tsx", import.meta.url), "utf8");
    const uses = src.match(/motionNote/g) ?? [];
    expect(uses.length, `画面が導いた一文を出していない (出現 ${uses.length} 回)`).toBeGreaterThanOrEqual(4);
  });
});
