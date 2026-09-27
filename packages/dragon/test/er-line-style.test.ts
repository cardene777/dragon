/**
 * ER 図の線の種類と端の記号の対応を固定する (#2585)。
 *
 * 見本帳の ER 図は、線の種類を端の記号と揃えて引いている。
 *
 * | 線 | 端 (`head`) | 読み方 |
 * |---|---|---|
 * | 実線 | `one` / `many` | 0 を許さない関係 |
 * | 破線 | `zero-one` / `zero-many` | 0 を許す関係 |
 *
 * **この対応は決めたものではなく、実物から見つけたもの**。 #2585 でカタログの ER 図
 * (走査で集めた全図のうち `type: er` のもの) の矢印を全部数えたところ、線の種類を書いた
 * 矢印に例外が 1 本も無かった。 書いた人が別々でも同じ引き方をしていた。
 *
 * 数は書かない (`rules/quality.md § 導出可能記述は人手で書かない` の経路 2)。
 * 走査した枚数と本数は、落ちた時の文面が実物から数えて出す。
 *
 * ## なぜ固定するか
 *
 * 段の説明は「実線は 0 を許さない関係」 と読み手に教える。 対応が崩れると、**図が説明と
 * 別のことを見せる**。 実際 #2585 の前は `er-complex-demo` の段 2 が「親の鍵が子の鍵に
 * 入る」 と書いていたが、その図の `order_items` の主キーは `id` だけで、親の鍵は入って
 * いなかった。 説明の側を直したので、今度は図の側が動いた時に落とす。
 *
 * ## 書いていない矢印を「実線」 に倒さない
 *
 * 線の種類も端の記号も省ける。 省いた矢印を既定値に倒すと、**測っていないものが判定に
 * 混ざる** (`rules/quality.md § 判定できなかったことを値に潰さない`)。 省いた矢印は
 * 上の対応から外し、**どの図が省いているかを名前で宣言する**。
 *
 * 宣言は両方向で見る = 宣言した図が省かなくなったら、その行も落とす。 片側だけだと
 * 対処済の名前が残り続けて一覧が実物から離れる。
 *
 * ## 0 件は母数と一緒に出す
 *
 * 走査が空振りしても 0 件になるので、0 だけを見てもどちらか判らない
 * (`rules/quality.md § 0 件を報告する時は母数を併記する`)。
 */
import { describe, it, expect } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";

import { 全図 } from "./support/responsive-accepted";

/** カタログの ER 図。 種類は図が自分で持つ (`type: er`) */
const ER図 = 全図.filter((d) => d.type === "er");

/** その端が 0 を許すか。 `zero-one` と `zero-many` の 2 つだけが 0 を許す */
const ゼロを許す = (head: string): boolean => head.startsWith("zero-");

/** 矢印 1 本の見出し。 落ちた時にどの図のどの線かが分かる形にする */
const 名 = (d: CdlDiagram, e: { from: string; to: string }): string =>
  `${d.id}: ${e.from} -> ${e.to}`;

/**
 * 線の種類と端の記号が食い違う矢印。
 *
 * **植え込み対照から呼べる形にする** = 本番と対照で別の数え方をすると、対照が本番と
 * 違うものを見る。
 */
function 食い違い(図: readonly CdlDiagram[]): string[] {
  const out: string[] = [];
  for (const d of 図) {
    for (const e of d.edges) {
      if (e.style === undefined || e.head === undefined) continue;
      const 破線 = e.style === "dashed";
      if (破線 !== ゼロを許す(e.head)) {
        out.push(`${名(d, e)} (${e.style} なのに head=${e.head})`);
      }
    }
  }
  return out;
}

/**
 * 線の種類を書かない図と、その理由。 **実物から作らず手で書く**。
 *
 * 記法は端を語で書く形 (`cardinality: "0..1"`) を持ち、語が両端の形を決める代わりに
 * 線の種類を決めない。 6 語を並べて見せるのがその図の中身なので、線の種類を書き足すと
 * 見せたいものが増える。
 */
const 線の種類を書かない図: Record<string, string> = {
  "表と関係の設計": "端を語 (`cardinality: 1:N`) で書く形。 語が両端の形を決め、線の種類は決めない",
  "通販の表と-6-通りの多重度":
    "端を語で書く形で、6 語を並べて見せるのが中身。 線の種類を書き足すと見せたいものが増える (#2105)",
};

/** 線の種類か端の記号を書いていない矢印を、図ごとに数える */
function 書いていない図(図: readonly CdlDiagram[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const d of 図) {
    for (const e of d.edges) {
      if (e.style !== undefined && e.head !== undefined) continue;
      const 欠け = e.style === undefined ? "線の種類なし" : "端の記号なし";
      out.set(d.id, [...(out.get(d.id) ?? []), `${名(d, e)} (${欠け})`]);
    }
  }
  return out;
}

/** 走査した矢印の本数。 0 件の報告に添える母数 */
const 矢印の数 = (図: readonly CdlDiagram[]): number =>
  図.reduce((a, d) => a + d.edges.length, 0);

describe("ER 図の線の種類と端の記号 (#2585)", () => {
  it("ER 図を 1 枚以上集められている", () => {
    expect(
      ER図.length,
      `カタログの ER 図を 1 枚も集められていない (全図 ${全図.length} 枚を走査)`,
    ).toBeGreaterThan(0);
    expect(矢印の数(ER図), "ER 図に矢印が 1 本も無い (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("線の種類と端の記号が食い違っていない", () => {
    const 出た = 食い違い(ER図);
    expect(
      出た,
      `実線は 0 を許さない端、破線は 0 を許す端と揃える` +
        ` (ER 図 ${ER図.length} 枚 / 矢印 ${矢印の数(ER図)} 本を走査)\n  ${出た.join("\n  ")}`,
    ).toEqual([]);
  });

  it("線の種類を書かない図が、宣言した分だけである", () => {
    const 実物 = 書いていない図(ER図);
    const 宣言外 = [...実物.keys()].filter((id) => !Object.hasOwn(線の種類を書かない図, id));
    expect(
      宣言外,
      `線の種類か端の記号を書かない図が増えた。 一覧へ理由付きで足すか、図に書き足すかを決める` +
        ` (ER 図 ${ER図.length} 枚 / 矢印 ${矢印の数(ER図)} 本を走査)\n  ` +
        宣言外.map((id) => (実物.get(id) ?? []).join("\n  ")).join("\n  "),
    ).toEqual([]);

    // 逆向き = 書き足された図の行を残さない
    const 死んだ行 = Object.keys(線の種類を書かない図).filter((id) => !実物.has(id));
    expect(死んだ行, "宣言した図が線の種類を書くようになった (行を外す)").toEqual([]);
  });

  it("植え込み対照 ... 線を 1 本入れ替えると落ちる", () => {
    // 1 本だけ種類を入れ替えた写しを作る。 実物には触らない
    const 元 = ER図[0];
    expect(元, "ER 図が 1 枚も無い").toBeDefined();
    const 対象 = 元!.edges.find((e) => e.style !== undefined && e.head !== undefined);
    expect(対象, `${元!.id} に線の種類と端の記号を持つ矢印が無い`).toBeDefined();

    const 写し: CdlDiagram = {
      ...元!,
      edges: 元!.edges.map((e) =>
        e === 対象 ? { ...e, style: e.style === "dashed" ? ("solid" as const) : ("dashed" as const) } : e,
      ),
    };
    expect(食い違い([写し]), "線を入れ替えても判定が気付かない (検査が効いていない)").toHaveLength(
      1,
    );
  });
});
