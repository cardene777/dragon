/**
 * 行を持つ図の矢印は端を書く (#2591 / #2595 / #2782)。
 *
 * ## なぜ書かせるか
 *
 * 端を書かない矢印は描く側の既定の形に落ちる (`EDGE_HEAD_DEFAULT` が三角)。
 * 塗った三角は他の図種で「向きを表すだけの矢印」 として広く使われている印なので、
 * 箱の移り変わりを示す矢印がそれで描かれると、他の図と見分けられなくなる。
 *
 * #2591 の時点では 8 枚のうち 6 枚 (矢印 16 本) が三角だった。
 * 当時は組み立ての経路が 2 つあり、片方だけが端を渡していなかった。
 *
 * ## 既定で入れない (#2782)
 *
 * 畳む前は移り変わりの図にだけ「実線に開いた矢」 を無条件で渡していた。
 * 畳んだ後も渡すと、多重度から導いた端 (鳥の足や棒) を上から潰す = 箱どうしの個数が
 * 図から消える。 そのため **端は書いた分だけが届く**。
 *
 * 代わりに見本帳の側を固定する = 行を持つ図の矢印はすべて端を書く。
 * 書き忘れた図は既定の三角に落ちるので、この検査がその 1 本を名指しする。
 *
 * ## 線の種類は固定しない
 *
 * #2595 は端と線をひと組で見ていたが、線は図の意味を担う
 * (識別しない関係は破線)。 端だけを見る。
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

/** カタログの行を持つ図。 種類は図が自分で持つ (`type: record`) */
const 行を持つ図 = 全図.filter((d) => d.type === "record");

/** 矢印 1 本の見出し。 落ちた時にどの図のどの線かが分かる形にする */
const 名 = (d: CdlDiagram, e: { from: string; to: string }): string =>
  `${d.id}: ${e.from} -> ${e.to}`;

/** 端を書いていない矢印 */
function 端を書いていない矢印(図: readonly CdlDiagram[]): string[] {
  const out: string[] = [];
  for (const d of 図) {
    for (const e of d.edges) {
      const x = e as unknown as { head?: string };
      if (x.head === undefined) out.push(名(d, e));
    }
  }
  return out;
}

/** 走査した矢印の本数。 0 件の報告に添える母数 */
const 矢印の数 = (図: readonly CdlDiagram[]): number =>
  図.reduce((a, d) => a + d.edges.length, 0);

describe("行を持つ図の矢印は端を書く (#2591 / #2782)", () => {
  it("行を持つ図を 1 枚以上集められている", () => {
    expect(
      行を持つ図.length,
      `カタログの行を持つ図を 1 枚も集められていない (全図 ${全図.length} 枚を走査)`,
    ).toBeGreaterThan(0);
    expect(
      矢印の数(行を持つ図),
      "行を持つ図に矢印が 1 本も無い (検査が空振りしている)",
    ).toBeGreaterThan(0);
  });

  it("見本の矢印がすべて端を書いている", () => {
    const 外れ = 端を書いていない矢印(行を持つ図);
    expect(
      外れ,
      `行を持つ図の矢印は端を書く (${行を持つ図.length} 枚 / 矢印 ${矢印の数(行を持つ図)} 本を走査)\n  ` +
        外れ.join("\n  "),
    ).toEqual([]);
  });

  it("植え込み対照 ... 端を書かない記法を落とす", () => {
    const 端なし = textDslToDiagram(`title: "端を書かない図"
type: record

actors:
  - 待機
  - 完了

flow:
  - 待機 -> 完了: "送信"
`);
    expect(
      端を書いていない矢印([端なし]),
      "端を書かない矢印を判定が見逃している",
    ).toHaveLength(1);
  });

  it("端を既定で入れない (書かない矢印は描く側の既定に落ちる)", () => {
    /*
     * 既定で `open` を入れると、多重度から導いた端を潰す。 入れていないことを直に見る。
     */
    const d = textDslToDiagram(`title: "端を書かない図"
type: record

actors:
  - 待機
  - 完了

flow:
  - 待機 -> 完了: "送信"

animation:
  - step: "送信" 1s
    focus: [待機, 完了]
`);
    expect(d.edges).toHaveLength(1);
    expect((d.edges[0] as unknown as { head?: string }).head).toBeUndefined();
  });

  it("多重度から導いた端が既定に潰されない", () => {
    // 畳んだ時に既定を無条件で入れると、ここが `open` になる
    const d = textDslToDiagram(`title: "個数を書いた図"
type: record

actors:
  - users: { kind: storage, rows: ["id: bigint"], marks: ["鍵"] }
  - orders: { kind: storage, rows: ["id: bigint", "user_id: bigint"], marks: ["鍵", "外"] }

flow:
  - users -> orders: "注文する" { cardinality: "1:N" }
`);
    expect(d.edges).toHaveLength(1);
    expect(
      (d.edges[0] as unknown as { head?: string }).head,
      "多重度から導いた端が潰されている",
    ).toBe("many");
  });

  it("書いた端はそのまま届く", () => {
    const d = textDslToDiagram(`title: "端を書いた図"
type: record

actors:
  - 待機
  - 完了

flow:
  - 待機 -> 完了: "送信" { head: open }

animation:
  - step: "送信" 1s
    focus: [待機, 完了]
`);
    expect(d.edges).toHaveLength(1);
    expect((d.edges[0] as unknown as { head?: string }).head).toBe("open");
  });
});
