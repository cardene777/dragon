/*
 * 書いた縦列が、動きを書いたかどうかで効いたり消えたりしないことを見る (#2348)。
 *
 * 縦列を書ける図種は、箱に `lane:` を書くとその縦列へ入る。 実測 = 状態の図と表の図では
 * **動きを書かない図でだけ指定が丸ごと消え**、箱ごとに縦列が作られていた。 そのうえ
 * 「`lanes` に書いた c0 はどの箱も入らない縦列です」 という **事実と逆の知らせ** が出ていた
 * (書いた人は全部の箱を c0 に入れている)。
 *
 * 原因は、共通の組み立てへ回すかどうかの条件が図種ごとに手で並べてあり、3 図種は
 * 「縦列を書いた形」 を含み 2 図種は含んでいなかったこと。
 *
 * ## 図種を手で並べない
 *
 * 走査は `縦列を選べる図種` を回す。 図種を足した日に、検査だけが古い一覧のまま通ることを防ぐ。
 * 揃わない図種は理由つきの表に載せ、実測と両方向で突き合わせる。
 */
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import { 縦列を選べる図種 } from "../src/compile/lanes";
import { parseTextDslV05 } from "../src/v05/parser";

/** 箱 3 つを 2 本の縦列へ入れた本文。 動きの段は任意で足す */
function 本文(図種: string, opts: { 動き: boolean; 空の縦列?: boolean }): string {
  const 縦列 = [`  c0: { width: 320 }`, `  c1: { width: 320 }`];
  if (opts.空の縦列 === true) 縦列.push(`  c2: { width: 320 }`);
  return `title: "縦列を書いた図"
type: ${図種}

lanes:
${縦列.join("\n")}

actors:
  - 受付: { lane: c0, stack: 0, rows: ["番号: 数"] }
  - 審査: { lane: c0, stack: 1, rows: ["状態: 文字"] }
  - 完了: { lane: c1, stack: 0, rows: ["日付: 文字"] }

flow:
  - 受付 -> 審査: "提出"
  - 審査 -> 完了: "承認"
${
  opts.動き
    ? `
animation:
  - step: "進む" 1.2s
    focus: ["受付", "審査"]
    description: "受付から審査へ進む"
`
    : ""
}`;
}

type 組んだ結果 = { 箱の縦列: string; 空の知らせ: number };

/** 本文を組み立て、箱がどの縦列に入ったかと「どの箱も入らない縦列です」 の件数を返す */
function 組む(src: string): 組んだ結果 {
  const p = parseTextDslV05(src);
  if (!p.ok) throw new Error(`読めない本文: ${p.errors.map((e) => e.message).join(" / ")}`);
  let 空の知らせ = 0;
  const d = compileToCdl(p.doc, {
    onNotice: (n) => {
      if (n.kind === "lane-declared-empty") 空の知らせ += 1;
    },
  });
  const 箱 = d.nodes as ReadonlyArray<{ id: string; lane?: string }>;
  return {
    箱の縦列: 箱.map((n) => `${n.id}@${n.lane ?? "-"}`).join(" "),
    空の知らせ,
  };
}

const 図種一覧 = [...縦列を選べる図種].sort();

/**
 * 書いた縦列の名前がそのまま図の縦列にならない図種と、その理由 (#2348)。
 *
 * **理由を同じ場所に書く**。 別 file に分けると片方だけ直って食い違う。
 */
const 縦列の名前を使わない図種: Record<string, string> = {
  class:
    "クラス図は自分で `col-0` / `col-1` の列を作り、書いた縦列の名前を使わない (#1466)。" +
    " 列としては `lane:` が効くが、宣言した縦列は空のまま図に残る。 直すのは #2350",
};

describe("書いた縦列が、動きを書いたかどうかで効いたり消えたりしない (#2348)", () => {
  it("縦列を書ける図種を走査できている (空振り防止)", () => {
    expect(図種一覧.length, "縦列を書ける図種を 1 件も拾えていない").toBeGreaterThan(0);
  });

  it("動きを書いても書かなくても、箱が同じ縦列に入る", () => {
    const 違う = 図種一覧
      .map((t) => ({ t, 無: 組む(本文(t, { 動き: false })), 有: 組む(本文(t, { 動き: true })) }))
      .filter(({ 無, 有 }) => 無.箱の縦列 !== 有.箱の縦列)
      .map(({ t, 無, 有 }) => `${t}: 動き無=${無.箱の縦列} / 動き有=${有.箱の縦列}`);
    expect(違う, `走査 ${図種一覧.length} 図種`).toEqual([]);
  });

  it("突き合わせが違いを見つけられる (植え込み対照)", () => {
    // 縦列を書かない本文と書いた本文は箱の入る縦列が違う。 ここが同じに見えるなら、
    // 上の検査は何を比べても通る形に壊れている
    const 書いた = 組む(本文("state", { 動き: false }));
    const 書かない = 組む(`title: "縦列を書かない図"
type: state

actors:
  - 受付: { stack: 0 }
  - 審査: { stack: 1 }
  - 完了: { stack: 2 }

flow:
  - 受付 -> 審査: "提出"
  - 審査 -> 完了: "承認"
`);
    expect(書いた.箱の縦列, "書いた縦列と書かない図が同じに見えている").not.toBe(書かない.箱の縦列);
  });

  it("箱を入れた縦列に「どの箱も入らない」 の知らせが出ない", () => {
    const 出た = 図種一覧
      .filter((t) => !Object.hasOwn(縦列の名前を使わない図種, t))
      .flatMap((t) =>
        [false, true]
          .map((動き) => ({ t, 動き, r: 組む(本文(t, { 動き })) }))
          .filter(({ r }) => r.空の知らせ > 0)
          .map(({ t, 動き, r }) => `${t} (動き${動き ? "有" : "無"}): ${r.空の知らせ} 件`),
      );
    expect(出た, `走査 ${図種一覧.length} 図種`).toEqual([]);
  });

  it("本当に箱が 1 つも入らない縦列では、知らせが引き続き出る", () => {
    // 0 件を期待する上の検査だけだと、知らせを止めれば通ってしまう
    const 出ない = 図種一覧
      .filter((t) => !Object.hasOwn(縦列の名前を使わない図種, t))
      .filter((t) => 組む(本文(t, { 動き: false, 空の縦列: true })).空の知らせ === 0);
    expect(出ない, `走査 ${図種一覧.length} 図種`).toEqual([]);
  });

  it("縦列の名前を使わない図種が、1 件ずつ理由を持つ", () => {
    for (const [図種, 理由] of Object.entries(縦列の名前を使わない図種)) {
      expect(理由.length, `${図種} の理由が空`).toBeGreaterThan(0);
      expect(縦列を選べる図種.has(図種 as never), `${図種} は縦列を書ける図種ではない`).toBe(true);
    }
  });

  it("理由を書いた図種が、実際に書いた縦列の名前を使っていない", () => {
    // 直した後に宣言だけが残ると、次に同じ穴が開いた時に気付けない
    const 使っている = Object.keys(縦列の名前を使わない図種).filter(
      (t) => 組む(本文(t, { 動き: false })).空の知らせ === 0,
    );
    expect(使っている, "宣言に在るのに、書いた縦列の名前を使っている図種がある").toEqual([]);
  });
});
