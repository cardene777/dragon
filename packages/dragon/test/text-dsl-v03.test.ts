import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "@cardenelabs/dragon";

describe("Text DSL v0.3 ... アニメーション full compile (sequence)", () => {
  it("アニメーション なし ... v0.2 と同じ標準 phase 1 個", () => {
    const src = `
タイトル: Simple
種類: sequence
登場人物:
  - A
  - B
流れ:
  1. A → B: hello
`;
    const diag = textDslToDiagram(src);
    expect(diag.phases.length).toBe(1);
    expect(diag.phases[0]!.id).toBe("seq"); // sequence preset の標準 phase
  });

  it("アニメーション あり ... DSL の phase 数だけ phase 注入", () => {
    const src = `
タイトル: 送金
種類: sequence
登場人物:
  - Alice
  - Vault (storage)
  - Bob
流れ:
  1. Alice → Vault: deposit
  2. Vault → Bob: send (成功)

アニメーション:
  状態: alice残高 = 100
  状態: bob残高 = 0
  ステップ「送金 step1」 1.5 秒:
    強調: Alice, Vault
    遷移: alice残高: 100 → 90
  ステップ「送金 step2」 1.5 秒:
    強調: Vault, Bob
    遷移: bob残高: 0 → 10
    バッジ: 送金中
    説明: Alice の残高が 100 から 90 へ、 Bob は 0 から 10 へ
`;
    const diag = textDslToDiagram(src);
    // DSL phase 2 個 → diagram.phases 2 個
    expect(diag.phases.length).toBe(2);
    // phase 1
    expect(diag.phases[0]!.title).toBe("送金 step1");
    expect(diag.phases[0]!.duration).toBe(1500);
    // tween 反映 ... activate に alice残高 関連 (tween は state id で動く)
    expect(diag.phases[0]!.tweens.length).toBe(1);
    expect(diag.phases[0]!.tweens[0]!.stateId).toBe("alice残高");
    expect(diag.phases[0]!.tweens[0]!.from).toBe(100);
    expect(diag.phases[0]!.tweens[0]!.to).toBe(90);
    // phase 2
    expect(diag.phases[1]!.title).toBe("送金 step2");
    expect(diag.phases[1]!.tweens.length).toBe(1);
    expect(diag.phases[1]!.tweens[0]!.stateId).toBe("bob残高");
    expect(diag.phases[1]!.badge).toBe("送金中");
    expect(diag.phases[1]!.body).toContain("Alice");
  });

  it("state は diagram.states に注入", () => {
    const src = `
タイトル: T
種類: sequence
登場人物:
  - A
流れ:
  1. A → A: self
アニメーション:
  状態: counter = 0
  状態: label = "待機"
  ステップ「p」 1 秒:
    強調: A
`;
    const diag = textDslToDiagram(src);
    expect(diag.states).toHaveLength(2);
    expect(diag.states[0]!.id).toBe("counter");
    expect(diag.states[0]!.initial).toBe(0);
    expect(diag.states[1]!.id).toBe("label");
    expect(diag.states[1]!.initial).toBe("待機");
  });

  it("highlight ... actor 名で header + footer + 関連 step box を active", () => {
    const src = `
タイトル: T
種類: sequence
登場人物:
  - A
  - B
流れ:
  1. A → B: msg
アニメーション:
  ステップ「p」 1 秒:
    強調: A
`;
    const diag = textDslToDiagram(src);
    // A の header / footer が active 化されてるはず
    expect(diag.phases[0]!.activate).toContain("a-header");
    expect(diag.phases[0]!.activate).toContain("a-footer");
    // A の step box (s0-a) も active
    expect(diag.phases[0]!.activate).toContain("s0-a");
  });

  it("highlight ... 矢印 A→B で edge を active", () => {
    const src = `
タイトル: T
種類: sequence
登場人物:
  - A
  - B
流れ:
  1. A → B: msg
アニメーション:
  ステップ「p」 1 秒:
    強調: A→B
`;
    const diag = textDslToDiagram(src);
    // edge id "e0-a-b" が active
    expect(diag.phases[0]!.activate).toContain("e0-a-b");
  });

  it("set ... 状態 即時切替", () => {
    const src = `
タイトル: T
種類: sequence
登場人物:
  - A
流れ:
  1. A → A: self
アニメーション:
  状態: status = "idle"
  ステップ「p1」 1 秒:
    強調: A
    切替: status: 実行中
`;
    const diag = textDslToDiagram(src);
    expect(diag.phases[0]!.sets.length).toBe(1);
    expect(diag.phases[0]!.sets[0]!.stateId).toBe("status");
    expect(diag.phases[0]!.sets[0]!.value).toBe("実行中");
  });
});
