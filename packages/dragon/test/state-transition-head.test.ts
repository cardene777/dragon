/**
 * 状態が移る印は 1 種類だけ (#2591 / #2595)。
 *
 * 見本帳の状態遷移図は、状態が移る矢印を **実線に開いた矢** で描く。
 * 描く側の組み立てが「遷移の印は 1 種類だけ = 実線に開いた矢」 と名乗っており、
 * この検査はその決まりが見本帳の全ての図に届いていることを見る。
 *
 * **決まりは 2 つの欄に跨る**。 端の形と線の種類で、#2591 は端だけを見ていた。
 * 端を固定しても、記法で `(accent, dashed)` と書けば破線で描かれて 1 件も落ちない
 * (#2595 で実測)。 決まりの片側だけを見る検査は、もう片側を素通りさせる。
 *
 * ## なぜ揃えるか
 *
 * 端を書かない矢印は描く側の既定の形に落ちる (`EDGE_HEAD_DEFAULT` が三角)。
 * 塗った三角は他の図種で「向きを表すだけの矢印」 として広く使われている印なので、
 * 状態遷移図がそれで描かれると、状態が移ることを示す印が他の図と見分けられなくなる。
 *
 * #2591 の時点では 8 枚のうち 6 枚 (矢印 16 本) が三角だった。
 * 組み立ての経路が 2 つあり、動きか縦列か種類を書いた図が通る側だけが端を渡していなかった。
 *
 * ## 既定の形と比べない
 *
 * 端が `open` であることを直に見る。
 * 「既定の三角ではないこと」 を見る形にすると、既定が変わった日に検査の意味が反転する。
 *
 * ## 0 件は母数と一緒に出す
 *
 * 走査が空振りしても 0 件になるので、0 だけを見てもどちらか判らない
 * (`rules/quality.md § 0 件を報告する時は母数を併記する`)。
 */
import { describe, it, expect } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";

import { textDslToDiagram } from "../src";
import { 全図 } from "./support/responsive-accepted";

/** カタログの状態遷移図。 種類は図が自分で持つ (`type: state`) */
const 状態遷移図 = 全図.filter((d) => d.type === "state");

/** 状態が移る矢印の端。 描く側の組み立てが名乗る 1 種類 */
const 決まった印 = "open";

/** 状態が移る矢印の線。 同じ決まりのもう半分 (#2595) */
const 決まった線 = "solid";

/** 矢印 1 本の見出し。 落ちた時にどの図のどの線かが分かる形にする */
const 名 = (d: CdlDiagram, e: { from: string; to: string }): string =>
  `${d.id}: ${e.from} -> ${e.to}`;

/**
 * 決まりから外れた矢印。
 *
 * **端と線を 1 つの判定にまとめる** = 2 つに分けると、片方だけを呼ぶ対照が書けてしまう
 * (本番と対照が別のものを見る)。
 */
function 決まりから外れた矢印(図: readonly CdlDiagram[]): string[] {
  const out: string[] = [];
  for (const d of 図) {
    for (const e of d.edges) {
      const x = e as unknown as { head?: string; style?: string };
      const 崩れ: string[] = [];
      if (x.head !== 決まった印) 崩れ.push(`端は ${x.head ?? "書かれていない"}`);
      if (x.style !== 決まった線) 崩れ.push(`線は ${x.style ?? "書かれていない"}`);
      if (崩れ.length > 0) out.push(`${名(d, e)} (${崩れ.join(" / ")})`);
    }
  }
  return out;
}

/** 走査した矢印の本数。 0 件の報告に添える母数 */
const 矢印の数 = (図: readonly CdlDiagram[]): number =>
  図.reduce((a, d) => a + d.edges.length, 0);

describe("状態が移る印は 1 種類だけ (#2591)", () => {
  it("状態遷移図を 1 枚以上集められている", () => {
    expect(
      状態遷移図.length,
      `カタログの状態遷移図を 1 枚も集められていない (全図 ${全図.length} 枚を走査)`,
    ).toBeGreaterThan(0);
    expect(
      矢印の数(状態遷移図),
      "状態遷移図に矢印が 1 本も無い (検査が空振りしている)",
    ).toBeGreaterThan(0);
  });

  it("矢印の端が全て開いた矢である", () => {
    expect(
      決まりから外れた矢印(状態遷移図),
      `状態が移る矢印は端に ${決まった印} を、線に ${決まった線} を持つ` +
        ` (状態遷移図 ${状態遷移図.length} 枚 / 矢印 ${矢印の数(状態遷移図)} 本を走査)\n  ` +
        決まりから外れた矢印(状態遷移図).join("\n  "),
    ).toEqual([]);
  });

  it("組み立ての経路が 2 つとも開いた矢を渡す", () => {
    /*
     * 動きか縦列か種類を書いた図は共通の組み立てへ、書かない図は状態遷移の組み立てへ回る。
     * カタログの図では経路を見分けられない (見本帳が 8 枚すべてに段を付けるため) ので、
     * 記法を 2 通り書いて両方の経路を通す。
     *
     * 片方だけ見ると、もう片方が端を渡さなくなっても落ちない
     * (#2591 はまさに片方だけが渡していなかった)。
     */
    const 端 = (記法: string): (string | undefined)[] =>
      textDslToDiagram(記法).edges.map((e) => (e as unknown as { head?: string }).head);

    const 動きなし = `title: "状態が移る"
type: state

actors:
  - 待機
  - 完了

flow:
  - 待機 -> 完了: "送信"
`;
    const 動きあり = `${動きなし}
animation:
  - step: "送信" 1s
    focus: [待機, 完了]
`;

    // 走査が空振りしたら一致も意味を持たない
    expect(端(動きなし), "動きを書かない経路で矢印が作られていない").toHaveLength(1);
    expect(端(動きあり), "動きを書いた経路で矢印が作られていない").toHaveLength(1);
    expect(端(動きなし), "動きを書かない経路が開いた矢を渡していない").toEqual([決まった印]);
    expect(端(動きあり), "動きを書いた経路が開いた矢を渡していない").toEqual([決まった印]);
  });

  it("植え込み対照 ... 記法で破線と書いた図を落とす", () => {
    /*
     * 既定を入れるだけでは止まらない。 書いた線の種類は書き写す側が上書きするので、
     * 破線と書けば破線で描かれる。 止めるのはこの判定の役目で、本番と同じ関数を呼ぶ。
     */
    const 破線で書いた = textDslToDiagram(`title: "破線で書いた状態遷移"
type: state

actors:
  - 待機
  - 完了

flow:
  - 待機 -> 完了: "送信" (accent, dashed)

animation:
  - step: "送信" 1s
    focus: [待機, 完了]
`);
    // 記法が書いたとおりに載ることを先に確かめる (載らなければ対照が空振りする)
    expect((破線で書いた.edges[0] as unknown as { style?: string }).style).toBe("dashed");
    expect(
      決まりから外れた矢印([破線で書いた]),
      "破線と書いた矢印を判定が見逃している",
    ).toHaveLength(1);
  });

  it("書いた端は既定に上書きされない", () => {
    // 既定を入れる形にすると、書いた値を潰す誤り方がありうる。 書いた値が勝つことを見る
    const d = textDslToDiagram(`title: "端を書いた状態遷移"
type: state

actors:
  - 待機
  - 完了

flow:
  - 待機 -> 完了: "送信" { head: triangle }

animation:
  - step: "送信" 1s
    focus: [待機, 完了]
`);
    expect(d.edges).toHaveLength(1);
    expect(
      (d.edges[0] as unknown as { head?: string }).head,
      "書いた端が既定の開いた矢に潰されている",
    ).toBe("triangle");
  });
});
