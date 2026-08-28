/**
 * Text DSL integration / regression test
 *
 * v0.1-v0.4 全機能の E2E 動作確認 + edge case + regression。
 * 公開準備としての品質保証。
 */

import { describe, it, expect } from "vitest";
import { parseTextDsl, textDslToDiagram } from "@cardenelabs/dragon";

describe("Text DSL integration ... 公開品質保証", () => {
  describe("realistic example ... 実用シナリオ", () => {
    it("Permit (EIP-2612) 完全 DSL → catalog 等価品質", () => {
      const src = `
タイトル: Permit (EIP-2612)
種類: sequence

登場人物:
  - Owner
  - Spender (function)
  - permit (function)
  - allowance (storage)

流れ:
  1. Owner → Spender: EIP-712 signature (off-chain) (情報)
  2. Spender → permit: relay
  3. permit → allowance: set allowance (成功)
  4. permit → Spender: allowance set (成功)

アニメーション:
  状態: allowanceValue = 0

  ステップ「sign」 1.5 秒:
    強調: Owner
    説明: Owner signs EIP-712 typed-data (no gas required)

  ステップ「relay」 1.5 秒:
    強調: Spender, permit
    説明: Spender relays signature on-chain

  ステップ「execute」 1.5 秒:
    強調: permit, allowance
    遷移: allowanceValue: 0 → 100
    バッジ: approved
`;
      const diag = textDslToDiagram(src);
      // 3 phase 全注入
      expect(diag.phases.length).toBe(3);
      // state 1 個
      expect(diag.states.length).toBe(1);
      // edge 4 個 (sequence preset で生成)
      expect(diag.edges.length).toBe(4);
      // 最後の phase に tween + badge
      expect(diag.phases[2]!.tweens[0]!.to).toBe(100);
      expect(diag.phases[2]!.badge).toBe("approved");
    });

    it("マイクロサービス topology + 複数 phase animation", () => {
      const src = `
タイトル: マイクロサービス flow
種類: topology

登場人物:
  - Client (browser)
  - Gateway (service)
  - Auth (service)
  - DB (database)

流れ:
  1. Client → Gateway: HTTPS request
  2. Gateway → Auth: token verify
  3. Auth → DB: SELECT user (情報)
  4. DB → Auth: row (成功)
  5. Auth → Gateway: OK (成功)
  6. Gateway → Client: 200 OK (成功)

アニメーション:
  ステップ「request」 1 秒:
    強調: Client, Gateway
    バッジ: 要求中

  ステップ「auth」 1 秒:
    強調: Gateway, Auth, DB
    バッジ: 認証中

  ステップ「response」 1 秒:
    強調: Auth, Gateway, Client
    バッジ: 応答中
`;
      const diag = textDslToDiagram(src);
      expect(diag.phases.length).toBe(3);
      expect(diag.nodes.length).toBe(4);
      expect(diag.edges.length).toBe(6);
    });
  });

  describe("edge case ... 不正入力 / 限界値", () => {
    it("空タイトル/種類なし → エラー", () => {
      const r = parseTextDsl(`登場人物:\n  - A\n流れ:\n  1. A → A: self`);
      expect(r.ok).toBe(false);
    });

    it("登場人物なし → エラー", () => {
      const r = parseTextDsl(`タイトル: T\n種類: sequence`);
      expect(r.ok).toBe(false);
    });

    it("1 actor のみ + self-loop edge は輪として残る (#1227 → #1462)", () => {
      // 描画側が輪として描けるようになった (`cdl#560`、0.15.0)。
      // 落ちずに図が返ること自体がこの edge case の要点
      const 知らせ: { kind: string; message: string }[] = [];
      const diag = textDslToDiagram(
        `
タイトル: Self
種類: sequence
登場人物:
  - A
流れ:
  1. A → A: self-call
`,
        { onNotice: (n) => 知らせ.push(n) },
      );
      // #1462 で自分へ戻る矢印を落とさなくなった = 輪として残り、知らせも出ない
      expect(diag.edges.filter((e) => e.from === e.to), "自己参照が消えている").toHaveLength(1);
      expect(知らせ.filter((n) => n.message.includes("自分へ戻る矢印"))).toHaveLength(0);
    });

    it("10 actor + 20 step (large diagram)", () => {
      const actors = Array.from({ length: 10 }, (_, i) => `  - actor${i}`).join("\n");
      const steps = Array.from(
        { length: 20 },
        (_, i) => `  ${i + 1}. actor${i % 10} → actor${(i + 1) % 10}: step${i}`,
      ).join("\n");
      const src = `
タイトル: Large
種類: sequence
登場人物:
${actors}
流れ:
${steps}
`;
      const diag = textDslToDiagram(src);
      expect(diag.edges.length).toBe(20);
    });

    it("日本語 actor + 矢印 4 種類混在", () => {
      const diag = textDslToDiagram(`
タイトル: 混在
種類: sequence
登場人物:
  - ユーザー
  - サーバー
  - 結果
流れ:
  1. ユーザー → サーバー: 1
  2. サーバー -> 結果: 2
  3. 結果 => ユーザー: 3
  4. ユーザー >> サーバー: 4
`);
      expect(diag.edges.length).toBe(4);
    });

    it("コメント (#) を様々な位置に混在", () => {
      const r = parseTextDsl(`
# 先頭コメント
タイトル: T  # 末尾コメント
種類: sequence
# ブロック間コメント
登場人物:
  - A  # actor コメント
  - B
流れ:
  1. A → B: msg  # step コメント
`);
      expect(r.ok).toBe(true);
    });
  });

  describe("regression ... 仕様一致確認", () => {
    it("DSL から builder 等価 ... actors の順序保持", () => {
      const diag = textDslToDiagram(`
タイトル: T
種類: sequence
登場人物:
  - First
  - Second
  - Third
流れ:
  1. First → Second: msg1
  2. Second → Third: msg2
`);
      // sequence preset では lane が actor 順に配置される
      const laneIds = diag.lanes.map((l) => l.label);
      expect(laneIds.indexOf("First")).toBeLessThan(laneIds.indexOf("Second"));
      expect(laneIds.indexOf("Second")).toBeLessThan(laneIds.indexOf("Third"));
    });

    it("animation parse + compile 結果 deterministic", () => {
      const src = `
タイトル: D
種類: sequence
登場人物:
  - A
  - B
流れ:
  1. A → B: x
アニメーション:
  状態: c = 0
  ステップ「p」 1 秒:
    強調: A
    遷移: c: 0 → 1
`;
      const d1 = textDslToDiagram(src);
      const d2 = textDslToDiagram(src);
      expect(d1.phases.length).toBe(d2.phases.length);
      expect(d1.states.length).toBe(d2.states.length);
      expect(d1.phases[0]!.tweens[0]!.to).toBe(d2.phases[0]!.tweens[0]!.to);
    });

    it("英語 keyword + actors も完全動作", () => {
      const diag = textDslToDiagram(`
title: English Test
type: sequence
actors:
  - User
  - System
flow:
  1. User -> System: hello (success)
  2. System -> User: response (success)
animate:
  state: x = 0
  step "p" 1s:
    highlight: User, System
    tween: x: 0 -> 1
`);
      expect(diag.topic).toBe("English Test");
      expect(diag.phases.length).toBe(1);
      expect(diag.phases[0]!.tweens.length).toBe(1);
    });

    it("set value 数値 + 文字列 両対応", () => {
      const diag = textDslToDiagram(`
タイトル: T
種類: sequence
登場人物:
  - A
流れ:
  1. A → A: self
アニメーション:
  状態: n = 0
  状態: s = "idle"
  ステップ「p」 1 秒:
    強調: A
    切替: n: 100
    切替: s: 完了
`);
      const sets = diag.phases[0]!.sets;
      expect(sets.length).toBe(2);
      const nSet = sets.find((s) => s.stateId === "n");
      const sSet = sets.find((s) => s.stateId === "s");
      expect(nSet?.value).toBe(100);
      expect(sSet?.value).toBe("完了");
    });
  });

  describe("error messages ... 親切な hint 確認", () => {
    it("未宣言 actor エラーに hint 含む", () => {
      const r = parseTextDsl(`
タイトル: T
種類: sequence
登場人物:
  - A
流れ:
  1. A → Unknown: msg
`);
      expect(r.ok).toBe(false);
      if (r.ok) return;
      const unknownErr = r.errors.find((e) => e.message.includes("Unknown"));
      expect(unknownErr?.hint).toBeDefined();
      expect(unknownErr?.hint).toContain("Unknown");
    });

    it("未知 preset エラーに選択肢を含む", () => {
      const r = parseTextDsl(`
タイトル: T
種類: hexagon
登場人物:
  - A
流れ:
  1. A → A: self
`);
      expect(r.ok).toBe(false);
      if (r.ok) return;
      const presetErr = r.errors.find((e) => e.message.includes("種類"));
      expect(presetErr?.hint).toContain("sequence");
    });

    it("行番号が正確", () => {
      const r = parseTextDsl(`
タイトル: T
種類: sequence
登場人物:
  - A
流れ:
  1. A → Missing: msg
`);
      expect(r.ok).toBe(false);
      if (r.ok) return;
      const err = r.errors.find((e) => e.message.includes("Missing"));
      // "1. A → Missing: msg" は 7 行目
      expect(err?.line).toBe(7);
    });
  });

  describe("v0.5 auto-detect ... 大規模 input regression", () => {
    it("100 actor 超でも v0.5 として正しく routing (flow / animation 行が 60 行目以降)", () => {
      // v0.4 のシグネチャ (タイトル: / 種類: / 登場人物: / 流れ:) を含まない pure v0.5 source。
      // actors block が長いと flow / animation 行が src 先頭 60 行を超え、 旧 isV05Source は false 判定で
      // v0.4 fallback に誤 routing して deprecation warning を出していた。
      // 全行を走査する fix 後は、 100 actor 超でも flow `-> 矢印` を検出し v0.5 経路に乗る (deprecation warning 0 件)。
      const N = 120;
      const actors = Array.from({ length: N }, (_, i) => `  - actor${i}`).join("\n");
      const src = `title: "huge"
type: sequence
actors:
${actors}
flow:
  - actor0 -> actor1: "first"
  - actor1 -> actor2: "second"
`;
      const warnings: string[] = [];
      const orig = console.warn;
      console.warn = (msg: string) => {
        warnings.push(msg);
      };
      try {
        // throw せず compile 完走 = v0.5 parser に正しく流れた証拠。
        const diag = textDslToDiagram(src);
        expect(diag.edges.length).toBeGreaterThanOrEqual(2);
        // v0.4 deprecation warning が出ていない = v0.5 routing 成功
        const deprecationWarnings = warnings.filter((w) => w.includes("v0.4"));
        expect(deprecationWarnings.length).toBe(0);
      } finally {
        console.warn = orig;
      }
    });
  });

  describe("6 preset × animation 全 mix", () => {
    const presets = [
      "sequence",
      "flow",
      "swimlane",
      "er",
      "state",
      "topology",
    ] as const;
    for (const preset of presets) {
      it(`${preset} preset + animation で error なし`, () => {
        const src = `
タイトル: ${preset} test
種類: ${preset}
登場人物:
  - A
  - B
流れ:
  1. A → B: msg
アニメーション:
  ステップ「p」 1 秒:
    強調: A, B
    バッジ: ${preset}
`;
        expect(() => textDslToDiagram(src)).not.toThrow();
        const diag = textDslToDiagram(src);
        expect(diag.phases.length).toBeGreaterThanOrEqual(1);
      });
    }
  });
});
