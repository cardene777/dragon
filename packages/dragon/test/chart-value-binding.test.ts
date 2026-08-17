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

/**
 * 語の欄に状態を書ける (#1201)。
 *
 * 語の欄 (気持ち / 区画) は数の欄と違い、**流れ込む値が組み立ての時点で全部わかる**。
 * 状態の初期値と段の切り替えはどちらも記法に書いてあり、段で動かす値は数しか書けない。
 * だから「その名前が必ず読める語になるか」 を言い切れる。
 *
 * 記法には記法の語 (「不満」 「左上」) を書き、図の語 (`frustrated` / `topLeft`) へは
 * 組み立てが直す。 記法の語彙に engine の内部語を混ぜないため。
 */
describe("語の欄に状態を書ける (#1201)", () => {
  const 気持ちの図 = (登録: string, 状態: string) =>
    textDslToDiagram(`title: "試し"
type: journey

actors:
  - 知る: "普通"
  - 登録: "${登録}"

states:
  mood: "${状態}"

animation:
  - step: "はじめ" 1.2s
  - step: "あと" 1.2s
    set:
      mood: "満足"
`);

  const 気持ち = (d: CdlDiagram) =>
    (d.nodes[0] as unknown as { journeyData?: Array<{ emotion: unknown }> }).journeyData?.map((r) => r.emotion);
  const 区画 = (d: CdlDiagram) =>
    (d.nodes[0] as unknown as { quadrantData?: { items: Array<{ quadrant: unknown }> } }).quadrantData?.items.map(
      (r) => r.quadrant,
    );

  it("気持ちの欄に {名前} を書いた項目が落ちない", () => {
    expect(気持ち(気持ちの図("{mood}", "不満"))).toEqual(["neutral", "{mood}"]);
  });

  it("状態に書いた記法の語が図の語に直る", () => {
    // 記法には「不満」 と書き、図には `frustrated` が入る
    const d = 気持ちの図("{mood}", "不満");
    expect(d.states?.find((s) => s.id === "mood")?.initial).toBe("frustrated");
  });

  it("段の切り替えに書いた語も図の語に直る", () => {
    // 初期値だけ直すと、段に入った時点で読めない語に戻る
    const d = 気持ちの図("{mood}", "不満");
    expect(d.phases.flatMap((p) => p.sets ?? [])).toEqual([{ stateId: "mood", value: "happy" }]);
  });

  it("読めない語の状態を指した項目は落ちて警告が出る", () => {
    const notices: Array<{ kind: string }> = [];
    const d = textDslToDiagram(`title: "試し"
type: journey

actors:
  - 知る: "普通"
  - 登録: "{mood}"

states:
  mood: "ふつう"

animation:
  - step: "動く" 1.2s
`, { onNotice: (n) => notices.push(n) });
    expect(気持ち(d)).toEqual(["neutral"]);
    expect(notices.map((n) => n.kind)).toContain("chart-value-unreadable");
  });

  it("段で読めない語に切り替わる状態も落ちる", () => {
    // 初期値だけを見ると、その段に来たときだけ読めない語になる
    const notices: Array<{ kind: string }> = [];
    const d = textDslToDiagram(`title: "試し"
type: journey

actors:
  - 知る: "普通"
  - 登録: "{mood}"

states:
  mood: "不満"

animation:
  - step: "はじめ" 1.2s
  - step: "あと" 1.2s
    set:
      mood: "ふつう"
`, { onNotice: (n) => notices.push(n) });
    expect(気持ち(d)).toEqual(["neutral"]);
    expect(notices.map((n) => n.kind)).toContain("chart-value-unreadable");
  });

  it("区画の欄でも同じことができる", () => {
    const d = textDslToDiagram(`title: "試し"
type: quadrant

actors:
  - A: "左上"
  - B: "{place}"

states:
  place: "左下"

animation:
  - step: "はじめ" 1.2s
  - step: "あと" 1.2s
    set:
      place: "右上"
`);
    expect(区画(d)).toEqual(["topLeft", "{place}"]);
    expect(d.states?.find((s) => s.id === "place")?.initial).toBe("bottomLeft");
    expect(d.phases.flatMap((p) => p.sets ?? [])).toEqual([{ stateId: "place", value: "topRight" }]);
  });

  it("語を書いた既存の見本は今までどおり", () => {
    expect(気持ち(気持ちの図("満足", "不満"))).toEqual(["neutral", "happy"]);
  });

  it("数の欄だけを読む図では語に直さない", () => {
    // 語の欄を持たない図では直す対象が 1 つも無い。 数の状態が語に化けないことを見る
    //
    // 「同じ名前を語の欄と数の欄の両方から読む」 形は **入力を作れない** (記法の図は
    // 1 つの型しか持たないため)。 その分岐は覆えていないことを `compile.ts` 側に書いてある
    const d = textDslToDiagram(`title: "試し"
type: bar

actors:
  - A: "{v}"
  - B: "200"

states:
  v: 100

animation:
  - step: "動く" 1.5s
    tween:
      v: 100 -> 900
`);
    expect(d.states?.find((s) => s.id === "v")?.initial).toBe(100);
  });
});
