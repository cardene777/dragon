import { describe, it, expect } from "vitest";
import { parseTextDsl, textDslToDiagram } from "@cardenelabs/dragon";

describe("Text DSL parser (v0.1)", () => {
  it("最小 sequence ... 日本語 keyword + 矢印 →", () => {
    const src = `
タイトル: ログインの流れ
種類: sequence

登場人物:
  - ユーザー
  - API (function)
  - データベース (storage)

流れ:
  1. ユーザー → API: ログイン情報
  2. API → データベース: SELECT
  3. データベース → API: 結果 (成功)
  4. API → ユーザー: 200 OK (成功)
`;
    const r = parseTextDsl(src);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.title).toBe("ログインの流れ");
    expect(r.doc.type).toBe("sequence");
    expect(r.doc.actors).toHaveLength(3);
    expect(r.doc.actors[0]!.name).toBe("ユーザー");
    expect(r.doc.actors[0]!.kind).toBe("actor");
    expect(r.doc.actors[1]!.kind).toBe("function");
    expect(r.doc.actors[2]!.kind).toBe("storage");
    expect(r.doc.flow).toHaveLength(4);
    expect(r.doc.flow[2]!.tone).toBe("success");
    expect(r.doc.flow[3]!.label).toBe("200 OK");
  });

  it("英語 keyword + -> 矢印で同じ AST", () => {
    const src = `
title: Login Flow
type: sequence

actors:
  - User
  - API (function)
  - DB (storage)

flow:
  1. User -> API: login
  2. API -> DB: SELECT
  3. DB -> API: rows (success)
`;
    const r = parseTextDsl(src);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.title).toBe("Login Flow");
    expect(r.doc.actors).toHaveLength(3);
    expect(r.doc.flow[2]!.tone).toBe("success");
  });

  it("コメント (#) は無視される", () => {
    const src = `
# これはコメント
タイトル: コメントテスト  # 末尾コメントもOK
種類: sequence
登場人物:
  - A
  - B
流れ:
  1. A → B: msg
`;
    const r = parseTextDsl(src);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.title).toBe("コメントテスト");
  });

  it("エラー: タイトル欠落", () => {
    const src = `
種類: sequence
登場人物:
  - A
流れ:
  1. A → A: self
`;
    const r = parseTextDsl(src);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.message.includes("タイトル"))).toBe(true);
  });

  it("エラー: 流れ で未宣言 actor", () => {
    const src = `
タイトル: テスト
種類: sequence
登場人物:
  - A
  - B
流れ:
  1. A → C: msg
`;
    const r = parseTextDsl(src);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.message.includes("C") && e.message.includes("いません"))).toBe(true);
  });

  it("エラー: 未知の preset 種類", () => {
    const src = `
タイトル: テスト
種類: unknown
登場人物:
  - A
流れ:
  1. A → A: self
`;
    const r = parseTextDsl(src);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.errors.some((e) => e.message.includes("未知の種類"))).toBe(true);
  });
});

describe("Text DSL compiler (v0.1, sequence preset)", () => {
  it("compile: 4 step sequence → CdlDiagram", () => {
    const src = `
タイトル: Login
種類: sequence
登場人物:
  - User
  - API (function)
  - DB (storage)
流れ:
  1. User → API: login
  2. API → DB: SELECT
  3. DB → API: rows (成功)
  4. API → User: 200 OK (成功)
`;
    const diag = textDslToDiagram(src);
    expect(diag.topic).toBe("Login");
    // sequence preset は lifeline + header + footer + step ごとに node 生成
    // 3 actor × (header + spacer + footer) + 4 step × 2 actor box = 18+ node
    expect(diag.nodes.length).toBeGreaterThan(10);
    // edge は step 数と一致
    expect(diag.edges.length).toBe(4);
  });

  it("compile: tone (成功) が edge.tone に反映", () => {
    const src = `
タイトル: T
種類: sequence
登場人物:
  - A
  - B
流れ:
  1. A → B: hello (成功)
`;
    const diag = textDslToDiagram(src);
    expect(diag.edges[0]!.tone).toBe("success");
  });

  it("compile: 不正 DSL → throw", () => {
    expect(() => textDslToDiagram("invalid")).toThrow(/Dragon DSL (v0\.5 )?parse error/);
  });
});

describe("Text DSL アニメーション (v0.1 ... parse のみ、 compile は v0.2 で API 拡張)", () => {
  it("parse: state + tween + body + badge", () => {
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
  ステップ「送金」 1.5 秒:
    強調: Alice, Vault, Alice→Vault
    遷移: alice残高: 100 → 90
    遷移: bob残高: 0 → 10
    バッジ: 送金中
    説明: Alice が Vault 経由で Bob に 10 送る
`;
    const r = parseTextDsl(src);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.doc.animate).toBeDefined();
    expect(r.doc.animate!.states).toHaveLength(2);
    expect(r.doc.animate!.states[0]!.name).toBe("alice残高");
    expect(r.doc.animate!.states[0]!.initial).toBe(100);
    expect(r.doc.animate!.phases).toHaveLength(1);
    const p = r.doc.animate!.phases[0]!;
    expect(p.name).toBe("送金");
    expect(p.durationMs).toBe(1500);
    expect(p.tweens).toHaveLength(2);
    expect(p.tweens![0]!.state).toBe("alice残高");
    expect(p.tweens![0]!.from).toBe(100);
    expect(p.tweens![0]!.to).toBe(90);
    expect(p.badge).toBe("送金中");
    expect(p.body).toContain("Alice");
  });

  it("parse duration: 1.5 秒 / 1500ms / 2s 全部 ms", () => {
    const cases = [
      ["1.5 秒", 1500],
      ["1500ms", 1500],
      ["2 秒", 2000],
      ["2s", 2000],
    ] as const;
    for (const [str, ms] of cases) {
      const src = `
タイトル: T
種類: sequence
登場人物:
  - A
流れ:
  1. A → A: self
アニメーション:
  ステップ「p」 ${str}:
    強調: A
`;
      const r = parseTextDsl(src);
      expect(r.ok, `${str} の parse`).toBe(true);
      if (!r.ok) continue;
      expect(r.doc.animate!.phases[0]!.durationMs).toBe(ms);
    }
  });
});
