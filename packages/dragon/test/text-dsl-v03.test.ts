import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "@cardenelabs/dragon";
import { sequenceStepId } from "@cardenelabs/cdl";

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
    // 標準 phase の id は組み立て器が決める。 名前を写すと描画側を直した時に片方だけ古くなる
    expect(diag.phases[0]!.id, "標準 phase に id が無い").toBeTruthy();
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
    // 板は自分用の状態 (どこまで描くか) を 1 つ持つ (#1466)。 書いた状態は名前で引く
    const 状態 = (id: string) => diag.states.find((s) => s.id === id);
    expect(状態("counter")?.initial, "書いた counter が図に無い").toBe(0);
    expect(状態("label")?.initial, "書いた label が図に無い").toBe("待機");
    expect(状態(sequenceStepId()), "板の段の状態が無い").toBeDefined();
    expect(diag.states, "書いていない状態が混ざっている").toHaveLength(3);
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
    /*
     * #1466 で順序図は 1 枚の板になり、面ごとの箱 (header / footer / step box) が消えた。
     * 光らせる相手は板 1 つで、どこまで描くかは段の状態が持つ。
     */
    const 板 = diag.nodes.find((n) => n.kind === "sequence-board");
    expect(板, "板が無い").toBeDefined();
    expect(diag.phases[0]!.activate, "板を光らせていない").toContain(板!.id);
    expect(
      diag.phases[0]!.sets.map((x) => x.stateId),
      "段が板の進み具合を書いていない",
    ).toContain(sequenceStepId());
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
    /*
     * 矢印は #1466 で板の行になった。 「A→B まで進んだ」 は段の状態の値で表す = 1 本目の
     * 言づてなので 0。 値が動かないと、どの段でも同じ絵が出る
     */
    const 進み = diag.phases[0]!.sets.find((x) => x.stateId === sequenceStepId());
    expect(進み, "段が板の進み具合を書いていない").toBeDefined();
    expect(進み?.value, "書いた矢印まで進んでいない").toBe(0);
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
    // 板は自分の進み具合も同じ段に書く (#1466)。 書いた切替は名前で引く
    const 切替 = diag.phases[0]!.sets.find((x) => x.stateId === "status");
    expect(切替, "書いた切替が段に無い").toBeDefined();
    expect(切替?.value).toBe("実行中");
  });
});
