/**
 * きっかけ形の値 (`trigger` / `to` / `dur`) が、描画側の読む値として実際に動くことの検査
 * (#1161 段 2)。
 *
 * **段の値を手で渡さない**。 `values-compile.test.ts` と同じく
 * `computeStateValues(layout(...), 段, 進み)` の実経路を通す。 手で渡すと、 組み立てが足した
 * 段の時計と補間を一度も通らないため、 畳んだ式が実際に動くかを見たことにならない。
 *
 * 陽性 (動く) と陰性 (動かない / 畳まない) の両側を置く。 陽性だけでは「常に `to` を返す」
 * 実装が通ってしまい、 傾斜になっていることを示せない。
 */
import { describe, it, expect } from "vitest";
import { computeStateValues, layout } from "@cardenelabs/cdl";
import { parseTextDslV05, textDslToDiagram } from "../src/index";
import type { CompileNotice } from "../src/compile";

const 記法 = (body: string) => `title: "確認"\ntype: flow\n\nactors:\n  - A\n  - B\n\n${body}`;

/** その瞬間に描画側が読む値。 段の番号と進み具合を指定できる */
function 描画が読む値(src: string, 段 = 0, 進み = 0): Record<string, string> {
  return computeStateValues(layout(textDslToDiagram(src)), 段, 進み);
}

/** 組み立てが書いた人に伝えたこと */
function 知らせ(src: string): CompileNotice[] {
  const out: CompileNotice[] = [];
  textDslToDiagram(src, { onNotice: (n) => out.push(n) });
  return out;
}

/** 文字列で返る値を数として見る。 端数の書き方に検査が依存しないようにする */
const 数 = (v: string | undefined): number => Number(v);

/** 段が引く 1 本だけの図。 段は 4s、 値は最初の 2s で 0 から 100 へ */
const 段が引く = 記法(
  'states:\n  vDone: 0\n\nvalues:\n  vDone: { trigger: step "取込み", to: 100, dur: 2s }\n\nanimation:\n  - step: "取込み" 4s',
);

/** 連鎖する図。 `cDone` は `vDone` が 100 に達した時点から動く */
const 連鎖する = 記法(
  'states:\n  vDone: 0\n  cDone: 0\n\n' +
    'values:\n' +
    '  vDone: { trigger: step "取込み", to: 100, dur: 2s }\n' +
    '  cDone: { trigger: vDone >= 100, to: 100, dur: 2s }\n\n' +
    'animation:\n  - step: "取込み" 4s',
);

describe("段が引く値 (#1161 段 2)", () => {
  it("段の頭では動き始めの値のまま", () => {
    expect(数(描画が読む値(段が引く, 0, 0).vDone)).toBe(0);
  });

  it("途中では傾斜の途中の値になる", () => {
    // 段 4s の 1/4 = 1000ms。 値は 2s かけて 0 → 100 なので半分の 50
    expect(数(描画が読む値(段が引く, 0, 0.25).vDone)).toBe(50);
  });

  it("`dur` の分だけで動き切る (段の長さに引き伸ばされない)", () => {
    // 段の半分 (2000ms) で `dur: 2s` を使い切る。 段の長さに引き伸ばされていれば 50 になる
    expect(数(描画が読む値(段が引く, 0, 0.5).vDone)).toBe(100);
  });

  it("動き切った後は止まったまま", () => {
    expect(数(描画が読む値(段が引く, 0, 0.75).vDone)).toBe(100);
    expect(数(描画が読む値(段が引く, 0, 1).vDone)).toBe(100);
  });
});

describe("連鎖する値 (#1161 段 2)", () => {
  it("相手が境目に達するまで動かない", () => {
    expect(数(描画が読む値(連鎖する, 0, 0.25).cDone)).toBe(0);
    expect(数(描画が読む値(連鎖する, 0, 0.5).cDone)).toBe(0);
  });

  it("相手が境目に達した時点から動き出す", () => {
    // vDone は 2000ms で 100 に達する。 そこから 2s かけて動くので、 3000ms 時点で半分
    expect(数(描画が読む値(連鎖する, 0, 0.75).cDone)).toBe(50);
  });

  it("段の終わりで動き切る", () => {
    expect(数(描画が読む値(連鎖する, 0, 1).cDone)).toBe(100);
  });

  it("段を 1 つ書くだけで 2 本が順に動く", () => {
    // 段 2 の狙いそのもの。 段を人が並べずに「終わったら次」 が成立する
    const 半ば = 描画が読む値(連鎖する, 0, 0.5);
    expect(数(半ば.vDone)).toBe(100);
    expect(数(半ば.cDone)).toBe(0);
  });

  it("相手が補間の途中で `==` の境目を通る時刻から動く", () => {
    const src = 記法(
      'states:\n  a: 0\n  b: 0\n\nvalues:\n' +
        '  a: { trigger: step "取込み", to: 100, dur: 2s }\n' +
        '  b: { trigger: a == 50, to: 100, dur: 1s }\n\n' +
        'animation:\n  - step: "取込み" 4s',
    );
    // a は 1000ms で 50 に達し、 b はそこから 1s 動く。 1500ms 時点では半分。
    expect(数(描画が読む値(src, 0, 0.375).b)).toBe(50);
  });
});

describe("きっかけ形の数値境界 (#1161 段 2)", () => {
  it("指数表記になる小さい to を 0 に丸めない", () => {
    const src = 記法(
      'states:\n  a: 0\n\nvalues:\n  a: { trigger: step "取込み", to: 0.0000001, dur: 2s }\n\n' +
        'animation:\n  - step: "取込み" 4s',
    );
    expect(数(描画が読む値(src, 0, 0.25).a)).toBeCloseTo(0.00000005, 12);
    expect(数(描画が読む値(src, 0, 0.5).a)).toBeCloseTo(0.0000001, 12);
  });

  it("ms 整数へ丸めると 0 になる dur を受け付けない", () => {
    const parsed = parseTextDslV05(
      記法(
        'values:\n  a: { trigger: step "取込み", to: 100, dur: 0.0004ms }\n\n' +
          'animation:\n  - step: "取込み" 4s',
      ),
    );
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors.some((e) => e.message.includes("dur が読めません"))).toBe(true);
  });
});

describe("畳めない形は知らせる (#1161 段 2)", () => {
  it("段の名前が無い", () => {
    const ns = 知らせ(
      記法('values:\n  a: { trigger: step "無い段", to: 100, dur: 1s }\n\nanimation:\n  - step: "取込み" 4s'),
    );
    const n = ns.find((x) => x.kind === "value-trigger-unresolved");
    expect(n?.message).toContain("無い段");
  });

  it("段に収まらない", () => {
    const ns = 知らせ(
      記法('values:\n  a: { trigger: step "取込み", to: 100, dur: 9s }\n\nanimation:\n  - step: "取込み" 4s'),
    );
    const n = ns.find((x) => x.kind === "value-trigger-unresolved");
    expect(n?.message).toContain("収まりません");
  });

  it("見張る相手が動く値でない", () => {
    const ns = 知らせ(
      記法(
        'states:\n  base: 0\n\nvalues:\n  a: { trigger: base >= 100, to: 100, dur: 1s }\n\nanimation:\n  - step: "取込み" 4s',
      ),
    );
    const n = ns.find((x) => x.kind === "value-trigger-unresolved");
    expect(n?.message).toContain("動く値でない");
  });

  it("相手が境目を通らない", () => {
    const ns = 知らせ(
      記法(
        'states:\n  a: 0\n  b: 0\n\nvalues:\n' +
          '  a: { trigger: step "取込み", to: 10, dur: 1s }\n' +
          '  b: { trigger: a >= 100, to: 100, dur: 1s }\n\n' +
          'animation:\n  - step: "取込み" 4s',
      ),
    );
    const n = ns.find((x) => x.kind === "value-trigger-unresolved");
    expect(n?.message).toContain("満たしません");
  });

  it("きっかけが一周している", () => {
    const ns = 知らせ(
      記法(
        'states:\n  a: 0\n  b: 0\n\nvalues:\n' +
          '  a: { trigger: b >= 100, to: 100, dur: 1s }\n' +
          '  b: { trigger: a >= 100, to: 100, dur: 1s }\n\n' +
          'animation:\n  - step: "取込み" 4s',
      ),
    );
    expect(ns.some((x) => x.kind === "value-trigger-unresolved" && x.message.includes("一周"))).toBe(true);
  });

  it("畳めなかった値は図に載せない", () => {
    // 半端に止まった値を黙って置かない。 載せると `{a}` が 0 として出て、 誤りが隠れる
    const v = 描画が読む値(
      記法('values:\n  a: { trigger: step "無い段", to: 100, dur: 1s }\n\nanimation:\n  - step: "取込み" 4s'),
      0,
      1,
    );
    expect(v.a).toBeUndefined();
  });
});

describe("式形は変わらない (陰性対照、 #1161 段 2)", () => {
  it("式の値は段が進んでも関係のまま", () => {
    const src = 記法(
      'states:\n  inflow: 10\n  done: 4\n\nvalues:\n  waiting: "{inflow} - {done}"\n\nanimation:\n  - step: "取込み" 4s',
    );
    expect(数(描画が読む値(src, 0, 0).waiting)).toBe(6);
    expect(数(描画が読む値(src, 0, 1).waiting)).toBe(6);
  });

  it("中括弧で始まる式をきっかけ形と読み違えない", () => {
    // `{a} + {b}` は中括弧で始まり中括弧で終わるが、 引用の外に `:` を持たないため式
    const src = 記法(
      'states:\n  a: 1\n  b: 2\n\nvalues:\n  c: "{a} + {b}"\n\nanimation:\n  - step: "取込み" 4s',
    );
    expect(数(描画が読む値(src, 0, 0).c)).toBe(3);
  });

  it("きっかけ形は states との重なりを知らせない", () => {
    // `states:` は動き始めの値として使うので、 両方書くのが正しい形
    const ns = 知らせ(段が引く);
    expect(ns.some((x) => x.kind === "value-shadows-state")).toBe(false);
  });

  it("式形は states との重なりを従来どおり知らせる", () => {
    const ns = 知らせ(記法('states:\n  a: 1\n\nvalues:\n  a: "2"\n\nanimation:\n  - step: "取込み" 4s'));
    expect(ns.some((x) => x.kind === "value-shadows-state")).toBe(true);
  });
});
