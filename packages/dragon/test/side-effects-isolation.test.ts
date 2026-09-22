import { describe, it, expect } from "vitest";
import { parseTextDsl } from "../src/parser";
import { compileToCdl } from "../src/compile";
import { lintDiagram, autoFix } from "../src/notation-lint";
import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * 副作用 / 隔離 / 部分失敗封じ込めの回帰 test。
 *
 * 「操作 X をした時に無関係な Y が想定外に壊れていないか」 を守る負の invariant 群。
 * これまでの test は positive (X → 期待 Y) 中心で、 これらの副作用 property は未検証だった。
 * ここで恒久化することで、 将来 compile が参照共有・状態蓄積・破壊的 mutate に退行しても検出できる。
 */

function doc(src: string) {
  const r = parseTextDsl(src);
  if (!r.ok) throw new Error("fixture parse 失敗: " + JSON.stringify(r.errors));
  return r.doc;
}
function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

const SEQ = "タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n流れ:\n  1. A → B: x";

describe("入力不変性 — 関数は引数を破壊しない", () => {
  it("compileToCdl は入力 doc を mutate しない", () => {
    const d = doc(SEQ);
    const before = clone(d);
    compileToCdl(d);
    expect(clone(d)).toEqual(before);
  });

  it("lintDiagram は入力 diagram を mutate しない (純粋)", () => {
    const diagram = compileToCdl(doc(SEQ));
    const before = clone(diagram);
    lintDiagram(diagram);
    expect(clone(diagram)).toEqual(before);
  });

  it("autoFix は入力 diagram を mutate せず新 object を返す", () => {
    const diagram = compileToCdl(doc(SEQ));
    (diagram as { topic: string }).topic = "flow preset (詳細)";
    const before = clone(diagram);
    const fixed = autoFix(diagram);
    expect(fixed).not.toBe(diagram);
    expect(clone(diagram)).toEqual(before);
  });
});

describe("partsCatalog 隔離 — merge が catalog を汚染しない", () => {
  it("part を merge しても partsCatalog object は不変", () => {
    const part: CdlDiagram = compileToCdl(doc(SEQ));
    const catalog = { widget: part };
    const catalogBefore = clone(catalog);
    const parentDoc = doc("タイトル: T2\n種類: sequence\n登場人物:\n  - B\n流れ:\n  1. B → B: x");
    parentDoc.actors.unshift({ name: "w", kind: "actor", partId: "widget", pos: { line: 1 } });
    compileToCdl(parentDoc, { partsCatalog: catalog });
    expect(clone(catalog)).toEqual(catalogBefore);
  });
});

describe("決定性 — 同一入力は同一出力", () => {
  it("同一 DSL を 2 回 compile して完全一致 (状態リークなし)", () => {
    expect(compileToCdl(doc(SEQ))).toEqual(compileToCdl(doc(SEQ)));
  });

  it("catalog を挟んでも 2 回 compile 一致", () => {
    const cat = { p: compileToCdl(doc(SEQ)) };
    const mk = () => {
      const dd = doc("タイトル: T\n種類: sequence\n登場人物:\n  - B\n流れ:\n  1. B → B: x");
      dd.actors.unshift({ name: "w", kind: "actor", partId: "p", pos: { line: 1 } });
      return compileToCdl(dd, { partsCatalog: cat });
    };
    expect(mk()).toEqual(mk());
  });
});

describe("部分失敗の封じ込め — 1 箇所の error が全体を壊さない", () => {
  it("1 step が書式不正でも error は 1 件に局所化", () => {
    const r = parseTextDsl("タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n流れ:\n  1. A → B: ok\n  2. こわれた行\n  3. A → B: ok2");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      // 壊れた 1 行のみ error、 有効な 2 step は巻き添えにしない
      expect(r.errors.length).toBe(1);
    }
  });

  it("未知 actor 参照の error は該当 step のみ", () => {
    const r = parseTextDsl("タイトル: T\n種類: sequence\n登場人物:\n  - A\n流れ:\n  1. A → A: ok\n  2. A → GHOST: bad");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.every((e) => e.message.includes("GHOST"))).toBe(true);
  });
});

describe("locality — 局所変更が無関係な出力を変えない", () => {
  it("autoFix は topic のみ変更し nodes / edges を触らない", () => {
    const diagram = compileToCdl(doc(SEQ));
    (diagram as { topic: string }).topic = "flow preset (詳細)";
    const fixed = autoFix(diagram);
    expect(fixed.topic).not.toBe(diagram.topic);
    expect(fixed.nodes).toEqual(diagram.nodes);
    expect(fixed.edges).toEqual(diagram.edges);
  });

  it("step1 に tone 付与しても step2 の edge 出力は不変 (element 隔離)", () => {
    const base = compileToCdl(doc("タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n流れ:\n  1. A → B: x\n  2. B → A: y"));
    const withTone = compileToCdl(doc("タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n流れ:\n  1. A → B: x (成功)\n  2. B → A: y"));
    expect(withTone.edges[1]).toEqual(base.edges[1]);
  });

  it("actor 追加は既存 actor の lane id を変えない", () => {
    const two = compileToCdl(doc("タイトル: T\n種類: swimlane\n登場人物:\n  - A\n  - B\n流れ:\n  1. A → B: x"));
    const three = compileToCdl(doc("タイトル: T\n種類: swimlane\n登場人物:\n  - A\n  - B\n  - C\n流れ:\n  1. A → B: x"));
    const laneIds2 = two.lanes.map((l) => l.id).sort();
    const laneIds3 = three.lanes.map((l) => l.id).sort();
    // 2 人を渡しているので縦列は 2 本。 0 だと下の繰り返しが 1 度も回らずに通る
    expect(laneIds2.length, "縦列が 2 本作られていない").toBe(2);
    // 既存 2 lane は three に含まれる (C 追加で消えない)
    for (const id of laneIds2) expect(laneIds3).toContain(id);
  });
});
