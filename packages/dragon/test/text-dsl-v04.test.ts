import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "@cardenelabs/dragon";

describe("Text DSL v0.4 ... 残 5 preset animation 拡張", () => {
  describe("flow preset + animation", () => {
    it("animation あり ... 1 lane + 縦 stack + 複数 phase", () => {
      const src = `
タイトル: 認証 flow
種類: flow
登場人物:
  - 開始 (event)
  - 検証 (function)
  - 完了 (event)
流れ:
  1. 開始 → 検証: 入力
  2. 検証 → 完了: OK (成功)

アニメーション:
  状態: progress = 0
  ステップ「step1」 1 秒:
    強調: 開始, 検証
    遷移: progress: 0 → 50
    バッジ: 進行中
  ステップ「step2」 1 秒:
    強調: 検証, 完了
    遷移: progress: 50 → 100
    バッジ: 完了
`;
      const diag = textDslToDiagram(src);
      // 2 phase 注入
      expect(diag.phases.length).toBe(2);
      // state 1 個
      expect(diag.states.length).toBe(1);
      expect(diag.states[0]!.id).toBe("progress");
      // tween 反映
      expect(diag.phases[0]!.tweens[0]!.from).toBe(0);
      expect(diag.phases[0]!.tweens[0]!.to).toBe(50);
      expect(diag.phases[1]!.tweens[0]!.from).toBe(50);
      expect(diag.phases[1]!.tweens[0]!.to).toBe(100);
      // badge 反映
      expect(diag.phases[0]!.badge).toBe("進行中");
      expect(diag.phases[1]!.badge).toBe("完了");
    });
  });

  describe("swimlane preset + animation", () => {
    it("animation あり ... actor ごと lane + 複数 phase", () => {
      const src = `
タイトル: parallel
種類: swimlane
登場人物:
  - A
  - B
  - C
流れ:
  1. A → B: msg1
  2. B → C: msg2 (成功)

アニメーション:
  ステップ「phase1」 1 秒:
    強調: A→B
  ステップ「phase2」 1 秒:
    強調: B→C
`;
      const diag = textDslToDiagram(src);
      expect(diag.phases.length).toBe(2);
      // 3 lane
      expect(diag.lanes.length).toBe(3);
      // edge を highlight 解決して active 化
      expect(diag.phases[0]!.activate.length).toBeGreaterThan(0);
      expect(diag.phases[1]!.activate.length).toBeGreaterThan(0);
    });
  });

  describe("er preset + animation", () => {
    it("animation あり ... entity + relation + phase", () => {
      const src = `
タイトル: schema
種類: er
登場人物:
  - User
  - Order
流れ:
  1. User → Order: places (1:N)

アニメーション:
  ステップ「show」 1 秒:
    強調: User, Order
`;
      const diag = textDslToDiagram(src);
      expect(diag.phases.length).toBe(1);
      // entity 2 lane
      expect(diag.lanes.length).toBe(2);
      // highlight で node active
      expect(diag.phases[0]!.activate).toContain("user");
      expect(diag.phases[0]!.activate).toContain("order");
    });
  });

  describe("state preset + animation", () => {
    it("animation あり ... FSM state + transition + 複数 phase", () => {
      const src = `
タイトル: Auth FSM
種類: state
登場人物:
  - Idle
  - Loading
  - Done
流れ:
  1. Idle → Loading: submit
  2. Loading → Done: success (成功)

アニメーション:
  状態: counter = 0
  ステップ「submit」 1 秒:
    強調: Idle, Idle→Loading
    遷移: counter: 0 → 1
  ステップ「complete」 1 秒:
    強調: Loading, Loading→Done
    遷移: counter: 1 → 2
    バッジ: 完了
`;
      const diag = textDslToDiagram(src);
      expect(diag.phases.length).toBe(2);
      expect(diag.states.length).toBe(1);
      // 最初の actor は initial (eyebrow=初期) 設定
      const idleNode = diag.nodes.find((n) => n.id === "idle");
      expect(idleNode?.eyebrow).toBe("初期");
      // 最後の actor は final (eyebrow=最終)
      const doneNode = diag.nodes.find((n) => n.id === "done");
      expect(doneNode?.eyebrow).toBe("最終");
    });
  });

  describe("topology preset + animation", () => {
    it("animation あり ... 1 group + container 配置 + phase", () => {
      const src = `
タイトル: System
種類: topology
登場人物:
  - Browser (service)
  - API (service)
  - DB (database)
流れ:
  1. Browser → API: HTTPS
  2. API → DB: SQL

アニメーション:
  ステップ「request」 1 秒:
    強調: Browser, API
    バッジ: 要求中
  ステップ「query」 1 秒:
    強調: API, DB
    バッジ: 問合中
`;
      const diag = textDslToDiagram(src);
      expect(diag.phases.length).toBe(2);
      // 1 lane = main group (contain=true)
      expect(diag.lanes.length).toBe(1);
      expect(diag.lanes[0]!.contain).toBe(true);
      // 3 node
      expect(diag.nodes.length).toBe(3);
    });
  });

  describe("全 6 preset animation network ... v0.4 完成確認", () => {
    it("animation なし時は v0.2 動作維持 (互換)", () => {
      const src = `
タイトル: T
種類: flow
登場人物:
  - A
  - B
流れ:
  1. A → B: msg
`;
      const diag = textDslToDiagram(src);
      // animation なし → flow preset 標準動作
      expect(diag.topic).toBe("T");
      expect(diag.phases.length).toBeGreaterThanOrEqual(1);
    });
  });
});
