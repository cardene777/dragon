/**
 * 図表の数の欄に状態を書ける (#1198)。
 *
 * 図表の見本は記法で書く (画面のコードのタブと「エディタで開く」 を成立させるため)。
 * そのため動かすには記法側で値を書けることが要るが、数の欄は数しか受け付けず、
 * `{名前}` を書いた項目は **落ちて警告になっていた**。
 *
 * 受け取る側の型 (`BoundNumber`) は元から 2 通りを想定しており、描画側 (cdl の
 * `render/payload-binding.ts`) が段ごとに解く。 塞がっていたのは入口だけだった。
 *
 * ここでは 3 分岐を固定する = 数はそのまま / `{名前}` はそのまま渡す / それ以外は落とす。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram } from "../src/index";
import type { CdlDiagram } from "@cardenelabs/cdl";

/** 図表 1 件を記法から組み立てる。 1 件目の値だけを差し替える */
const 組み立てる = (型: string, 値: string): CdlDiagram =>
  textDslToDiagram(`title: "試し"
type: ${型}

actors:
  - A: "${値}"
  - B: "200"

states:
  v: 100

animation:
  - step: "動く" 1.5s
    tween:
      v: 100 -> 900
`);

/** 図表の中身 (棒 / 折れ線 / 円は `chartData`、 絞り込みは `funnelData`) */
function 中身(d: CdlDiagram): Array<number | string> {
  const n = d.nodes[0] as unknown as {
    chartData?: Array<{ value: number | string }>;
    funnelData?: Array<{ count: number | string }>;
  };
  if (n.chartData) return n.chartData.map((r) => r.value);
  if (n.funnelData) return n.funnelData.map((r) => r.count);
  throw new Error("図表の中身が無い");
}

const 型一覧 = ["bar", "line", "pie", "funnel"] as const;

describe("数の欄に状態を書ける (#1198)", () => {
  for (const 型 of 型一覧) {
    it(`${型}: {名前} を書いた項目が落ちずに、そのまま中身に入る`, () => {
      // 数に潰すと段で動かせない。 `{名前}` のまま渡して描画側が解く
      expect(中身(組み立てる(型, "{v}"))).toEqual(["{v}", 200]);
    });

    it(`${型}: 数を書いた項目は今までどおり数で入る`, () => {
      expect(中身(組み立てる(型, "420"))).toEqual([420, 200]);
    });

    it(`${型}: 読めない値は今までどおり落ちる`, () => {
      // 黙って 0 にしない = その項目だけ欠けた図が「正しい図」 として出てしまう
      expect(中身(組み立てる(型, "abc"))).toEqual([200]);
    });

    it(`${型}: 混ざった形は受けない`, () => {
      // `{v} 件` は描画側が数として読めず、既定値に落ちて印が付くだけになる。
      // 書けたのに効かない形を作らない
      expect(中身(組み立てる(型, "{v} 件"))).toEqual([200]);
      expect(中身(組み立てる(型, "{v}%"))).toEqual([200]);
    });
  }

  it("負の数の扱いは今までどおり (折れ線だけが受ける)", () => {
    expect(中身(組み立てる("line", "-5"))).toEqual([-5, 200]);
    for (const 型 of ["bar", "pie", "funnel"] as const) {
      expect(中身(組み立てる(型, "-5")), `${型} が負を受けている`).toEqual([200]);
    }
  });

  it("状態を書いた欄は符号の検査を通る", () => {
    // `{名前}` は書いた時点で符号が決まらない。 弾くと段で負になりうる図が書けなくなる
    expect(中身(組み立てる("bar", "{v}"))).toContain("{v}");
  });

  it("参照先の無い名前を書いた項目は落ちて警告が出る", () => {
    // 通すと図は出るのに数が入っていない状態になる = 「正しい図」 に見えてしまう。
    // 数として読めない値を落として警告する既存の扱いと揃える
    for (const 型 of 型一覧) {
      const notices: Array<{ kind: string; message: string }> = [];
      const d = textDslToDiagram(`title: "試し"
type: ${型}

actors:
  - A: "{missing}"
  - B: "200"

states:
  v: 100

animation:
  - step: "動く" 1.5s
    tween:
      v: 100 -> 900
`, { onNotice: (n) => notices.push(n) });
      expect(中身(d), `${型} で参照先の無い項目が載っている`).toEqual([200]);
      expect(notices.map((n) => n.kind), `${型} で警告が出ていない`).toContain("chart-value-unreadable");
      expect(notices.some((n) => n.message.includes("数にならない")), `${型} の警告が理由を説明していない`).toBe(true);
    }
  });

  it("語の状態を数の欄に指した項目は落ちて警告が出る", () => {
    // 宣言はされていても数に直せない。 通すと描画側で既定値に落ちて印が付き、
    // 図は出るのに数が入っていない状態になる (実測で `data-cdl-unresolved` が付いた)
    for (const 型 of 型一覧) {
      const notices: Array<{ kind: string; message: string }> = [];
      const d = textDslToDiagram(`title: "試し"
type: ${型}

actors:
  - A: "{label}"
  - B: "200"

states:
  label: "こんにちは"

animation:
  - step: "動く" 1.5s
`, { onNotice: (n) => notices.push(n) });
      expect(中身(d), `${型} で語の状態を指した項目が載っている`).toEqual([200]);
      expect(notices.map((n) => n.kind), `${型} で警告が出ていない`).toContain("chart-value-unreadable");
    }
  });

  it("空文字の状態は落ちる", () => {
    // `Number("")` は 0 を返す。 素通しすると「何も書いていない状態」 と「0 と書いた状態」 が
    // 区別できず、描画側で解けないまま図だけが出る (実測で `data-cdl-unresolved` が付いた)。
    //
    // 空白だけを書いた場合は **読み取りの時点で数の 0 になる** ため、ここには届かない
    // (`v: "   "` の実際の初期値は 0)。 それは読み取り側の扱いで、本 file の対象ではない
    for (const 初期値 of ['""']) {
      const notices: Array<{ kind: string }> = [];
      const d = textDslToDiagram(`title: "試し"
type: bar

actors:
  - A: "{v}"
  - B: "200"

states:
  v: ${初期値}

animation:
  - step: "動く" 1.5s
`, { onNotice: (n) => notices.push(n) });
      expect(中身(d), `初期値 ${初期値} が通っている`).toEqual([200]);
      expect(notices.map((n) => n.kind)).toContain("chart-value-unreadable");
    }
  });

  it("段の途中で語に切り替わる状態は落ちる", () => {
    // 最初の値だけを見ると、その段に来たときだけ数が入らない図になる
    const notices: Array<{ kind: string }> = [];
    const d = textDslToDiagram(`title: "試し"
type: bar

actors:
  - A: "{v}"
  - B: "200"

states:
  v: 100

animation:
  - step: "はじめ" 1.5s
  - step: "語になる" 1.5s
    set:
      v: "こんにちは"
`, { onNotice: (n) => notices.push(n) });
    expect(中身(d), "段で語になる状態が通っている").toEqual([200]);
    expect(notices.map((n) => n.kind)).toContain("chart-value-unreadable");
  });

  it("段で数に切り替わる状態は通る", () => {
    // 切り替え先が数なら問題ない。 弾き過ぎると段で値を差し替える書き方ができなくなる
    const d = textDslToDiagram(`title: "試し"
type: bar

actors:
  - A: "{v}"
  - B: "200"

states:
  v: 100

animation:
  - step: "はじめ" 1.5s
  - step: "差し替え" 1.5s
    set:
      v: 900
`);
    expect(中身(d)).toEqual(["{v}", 200]);
  });

  it("数として読める語の状態は通る", () => {
    // 記法は数を引用符で書く形も許す。 `"100"` は数として読めるので落とさない
    const d = textDslToDiagram(`title: "試し"
type: bar

actors:
  - A: "{v}"
  - B: "200"

states:
  v: "100"

animation:
  - step: "動く" 1.5s
`);
    expect(中身(d)).toEqual(["{v}", 200]);
  });

  it("自動で決まる値も参照先として認める", () => {
    // `values:` で宣言した名前も状態と同じく `{名前}` で読める
    const d = textDslToDiagram(`title: "試し"
type: bar

actors:
  - A: "{waiting}"
  - B: "200"

states:
  inflow: 100
  done: 40

values:
  waiting: "{inflow} - {done}"

animation:
  - step: "動く" 1.5s
    tween:
      inflow: 100 -> 300
`);
    expect(中身(d)).toEqual(["{waiting}", 200]);
  });

  it("段の値が図に入る", () => {
    // 入口が通っても段が入らなければ動かない
    const d = 組み立てる("bar", "{v}");
    expect(d.states?.map((s) => s.id)).toContain("v");
    expect(d.phases.flatMap((p) => p.tweens ?? [])).toEqual([{ stateId: "v", from: 100, to: 900 }]);
  });
});
