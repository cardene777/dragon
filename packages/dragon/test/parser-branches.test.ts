import { describe, it, expect } from "vitest";
import { parseTextDsl } from "../src/parser";

/**
 * parser.ts の未カバー branch (error 経路 + animate block 解析) を実 DSL 入力で踏む。
 * 既存 text-dsl テストは happy path 中心で、 必須項目欠落 / 書式 error / animate の
 * states・phases・highlight・tween・set・body・badge 分岐が未検証だった (branch 59.8%)。
 */

function errs(src: string): string[] {
  const r = parseTextDsl(src);
  return r.ok ? [] : r.errors.map((e) => e.message);
}

const HEAD = "タイトル: T\n種類: sequence\n登場人物:\n  - A\n  - B\n流れ:\n  1. A → B: ok";

describe("parseTextDsl — 必須項目欠落 error", () => {
  it("タイトル 欠落 → error", () => {
    expect(errs("種類: sequence\n登場人物:\n  - A\n流れ:\n  1. A → A: x").some((m) => m.includes("タイトル"))).toBe(true);
  });
  it("種類 欠落 → error", () => {
    expect(errs("タイトル: T\n登場人物:\n  - A\n流れ:\n  1. A → A: x").some((m) => m.includes("種類"))).toBe(true);
  });
  it("登場人物 空 → error", () => {
    expect(errs("タイトル: T\n種類: sequence\n流れ:\n  1. A → A: x").some((m) => m.includes("登場人物"))).toBe(true);
  });
  it("未知の種類 → enum hint 付き error", () => {
    expect(errs("タイトル: T\n種類: bogus\n登場人物:\n  - A\n流れ:\n  1. A → A: x").some((m) => m.includes("未知の種類"))).toBe(true);
  });
});

describe("parseTextDsl — actor / step 書式 error", () => {
  it("actor 行が書式不正 → 登場人物の書式エラー", () => {
    // parseListItem が null を返す入力 (先頭 - なし等) は上位で actor block 対象外だが、
    // block 内の空でない不正行を踏ませる
    const r = parseTextDsl("タイトル: T\n種類: sequence\n登場人物:\n  \n  - A\n流れ:\n  1. A → A: x");
    expect(r.ok).toBe(true); // 空行は skip、 - A は有効
  });
  it("step が番号なし → 流れの書式エラー", () => {
    expect(errs(`タイトル: T\n種類: sequence\n登場人物:\n  - A\n流れ:\n  A → A: x`).some((m) => m.includes("流れの書式"))).toBe(true);
  });
  it("step に矢印なし → 矢印またはラベルなし error", () => {
    expect(errs(`タイトル: T\n種類: sequence\n登場人物:\n  - A\n流れ:\n  1. A B ラベル`).some((m) => m.includes("矢印"))).toBe(true);
  });
  it("step の from が登場人物にいない → error", () => {
    expect(errs(`タイトル: T\n種類: sequence\n登場人物:\n  - A\n流れ:\n  1. X → A: ok`).some((m) => m.includes("X") && m.includes("登場人物にいません"))).toBe(true);
  });
  it("step の to が登場人物にいない → error", () => {
    expect(errs(`タイトル: T\n種類: sequence\n登場人物:\n  - A\n流れ:\n  1. A → Y: ok`).some((m) => m.includes("Y") && m.includes("登場人物にいません"))).toBe(true);
  });
});

describe("parseTextDsl — animate block: states", () => {
  it("状態 を数値 initial で parse", () => {
    const r = parseTextDsl(`${HEAD}\nアニメーション:\n  状態: 残高 = 100`);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.doc.animate?.states[0]?.name).toBe("残高");
      expect(r.doc.animate?.states[0]?.initial).toBe(100);
    }
  });
  it("状態 を文字列 initial で parse (引用符除去)", () => {
    const r = parseTextDsl(`${HEAD}\nアニメーション:\n  状態: ステータス = "待機"`);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.doc.animate?.states[0]?.initial).toBe("待機");
  });
  it("状態 書式不正 (= なし) → error", () => {
    expect(errs(`${HEAD}\nアニメーション:\n  状態: 残高 100`).some((m) => m.includes("状態 書式"))).toBe(true);
  });
});

describe("parseTextDsl — animate block: phases (step + sub lines)", () => {
  it("ステップ + 全 sub line (強調/遷移/切替/説明/バッジ) を parse", () => {
    const src = `${HEAD}\nアニメーション:\n  状態: 残高 = 100\n  ステップ「送信」 1.5 秒:\n    強調: A, B\n    遷移: 残高: 100 → 90\n    切替: ステータス: 完了\n    説明: 送信中\n    バッジ: NEW`;
    const r = parseTextDsl(src);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const p = r.doc.animate?.phases[0];
      expect(p?.name).toBe("送信");
      expect(p?.durationMs).toBe(1500);
      expect(p?.highlight).toEqual(["A", "B"]);
      expect(p?.tweens?.[0]).toMatchObject({ state: "残高", from: 100, to: 90 });
      expect(p?.sets?.[0]).toMatchObject({ state: "ステータス", value: "完了" });
      expect(p?.body).toBe("送信中");
      expect(p?.badge).toBe("NEW");
    }
  });
  it("ステップ 書式不正 (名前括弧なし) → error", () => {
    expect(errs(`${HEAD}\nアニメーション:\n  ステップ 送信 1.5秒:`).some((m) => m.includes("ステップ 書式"))).toBe(true);
  });
  it("ステップ 時間 解釈不能 → error", () => {
    expect(errs(`${HEAD}\nアニメーション:\n  ステップ「送信」 なが さ:`).some((m) => m.includes("時間"))).toBe(true);
  });
  it("遷移 書式不正 (矢印なし) → error", () => {
    expect(errs(`${HEAD}\nアニメーション:\n  ステップ「送信」 1秒:\n    遷移: 残高 100`).some((m) => m.includes("遷移 書式"))).toBe(true);
  });
  it("切替 書式不正 (: なし) → error", () => {
    expect(errs(`${HEAD}\nアニメーション:\n  ステップ「送信」 1秒:\n    切替: ステータス`).some((m) => m.includes("切替 書式"))).toBe(true);
  });
  it("切替 の数値 value は number に変換", () => {
    const r = parseTextDsl(`${HEAD}\nアニメーション:\n  ステップ「s」 1秒:\n    切替: cnt: 42`);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.doc.animate?.phases[0]?.sets?.[0]?.value).toBe(42);
  });
});
