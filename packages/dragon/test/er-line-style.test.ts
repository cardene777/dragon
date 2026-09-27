/**
 * ER 図の線の種類が何を表すかを固定する (#2585 / #2587)。
 *
 * 見本帳の ER 図は 2 軸を分けて描く。
 *
 * | 何で描くか | 何を表すか |
 * |---|---|
 * | 線の種類 | 親の鍵が子の主キーに入るか (識別の有無) |
 * | 端の記号 | 個数 (棒 = 1 / 三又 = 多) と、0 を許すか (丸) |
 *
 * 標準の記法 (Mermaid の ER 図、ERwin 系) と同じ割り当て。
 *
 * ## なぜ 2 軸に分けたか
 *
 * #2585 の時点では、線も端も「0 を許すか」 を表していた (線の種類を書いた矢印を数えると
 * 例外 0 本)。 線から読めることが端から読めることの写しになっており、識別の有無はどこからも
 * 読めなかった。 一方 `ER図` の段の説明は「実線は識別する関係」 と書いており、実物の引き方と
 * 別の読み方を教えていた。 #2587 で図の側を動かして標準の割り当てに揃えた。
 *
 * ## 識別の有無をどう読むか
 *
 * 図のデータには「この矢印が識別する関係か」 を書く欄が無い。 行の印から読む =
 * **下線 (主キー) と山形 (外を指す列) を同じ行に持つ表** は、親の鍵をそのまま主キーに
 * 含んでいる。 矢印の両端のどちらかがその形なら識別する関係とみなす。
 *
 * **両端を見るのは向きが図によって違うため**。 親から子へ引く図 (`users -> orders`) と
 * 子から親へ引く図 (`会員 -> 組`) が混在しており、片側だけを見ると後者を読み違える。
 *
 * ### この読み方が見逃す形
 *
 * 中間の表が 3 本目の関係を持ち、その 1 本だけが識別しない場合。 表は下線と山形を同じ行に
 * 持つので、3 本とも識別する関係とみなされる。 今のカタログには無い形なので、出た時に
 * 判定を細かくする (列の名前で親と結ぶ) かを決める。
 *
 * ## 書いていない矢印を既定値に倒さない
 *
 * 線の種類は省ける。 省いた矢印を既定値に倒すと、**測っていないものが判定に混ざる**
 * (`rules/quality.md § 判定できなかったことを値に潰さない`)。 省いた矢印は判定から外し、
 * **どの図が省いているかを名前で宣言する**。
 *
 * 宣言は両方向で見る = 宣言した図が書くようになったら、その行も落とす。
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

/** 行頭の印。 描く側が組み立てた形をそのまま読む */
type 行の印 = { shape: string; filled: boolean; underline?: boolean } | null;

/** その表が親の鍵を主キーに含むか = 下線と山形を同じ行に持つ */
function 親の鍵を主キーに持つ(d: CdlDiagram, id: string): boolean {
  const n = d.nodes.find((x) => x.id === id);
  const 印 = (n as unknown as { rowMarks?: 行の印[] } | undefined)?.rowMarks ?? [];
  return 印.some((m) => m !== null && m.underline === true && m.shape === "chevron");
}

/** その矢印が識別する関係か。 向きが図によって違うので両端を見る */
const 識別する = (d: CdlDiagram, e: { from: string; to: string }): boolean =>
  親の鍵を主キーに持つ(d, e.from) || 親の鍵を主キーに持つ(d, e.to);

/** 矢印 1 本の見出し。 落ちた時にどの図のどの線かが分かる形にする */
const 名 = (d: CdlDiagram, e: { from: string; to: string }): string =>
  `${d.id}: ${e.from} -> ${e.to}`;

/**
 * 線の種類と識別の有無が食い違う矢印。
 *
 * **植え込み対照から呼べる形にする** = 本番と対照で別の数え方をすると、対照が本番と
 * 違うものを見る。
 */
function 食い違い(図: readonly CdlDiagram[]): string[] {
  const out: string[] = [];
  for (const d of 図) {
    for (const e of d.edges) {
      if (e.style === undefined) continue;
      const 実線 = e.style !== "dashed";
      const 識別 = 識別する(d, e);
      if (実線 !== 識別) {
        out.push(`${名(d, e)} (${e.style} なのに ${識別 ? "識別する" : "識別しない"} 関係)`);
      }
    }
  }
  return out;
}

/**
 * 線の種類を書かない図と、その理由。 **実物から作らず手で書く**。
 *
 * どちらも端を語 (`cardinality: "1:N"`) で書く形。 語が両端の形を決める代わりに線の種類を
 * 決めない。 **列を 1 つも持たない図なので識別の有無が読めず**、線の種類を書き足しても
 * 根拠が無い。 6 語と端の形の対応を見せるのがこの 2 枚の中身になる。
 */
const 線の種類を書かない図: Record<string, string> = {
  表と関係の設計: "端を語 (`cardinality: 1:N`) で書く形。 列を持たないので識別の有無が読めない",
  "通販の表と-6-通りの多重度":
    "端を語で書く形で、6 語と端の形の対応を見せるのが中身。 列を持たないので識別の有無が読めない (#2105)",
};

/** 線の種類を書いていない矢印を、図ごとに数える */
function 書いていない図(図: readonly CdlDiagram[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const d of 図) {
    for (const e of d.edges) {
      if (e.style !== undefined) continue;
      out.set(d.id, [...(out.get(d.id) ?? []), 名(d, e)]);
    }
  }
  return out;
}

/** 走査した矢印の本数。 0 件の報告に添える母数 */
const 矢印の数 = (図: readonly CdlDiagram[]): number =>
  図.reduce((a, d) => a + d.edges.length, 0);

describe("ER 図の線の種類と識別の有無 (#2587)", () => {
  it("ER 図を 1 枚以上集められている", () => {
    expect(
      ER図.length,
      `カタログの ER 図を 1 枚も集められていない (全図 ${全図.length} 枚を走査)`,
    ).toBeGreaterThan(0);
    expect(矢印の数(ER図), "ER 図に矢印が 1 本も無い (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("識別する関係と識別しない関係が両方ある", () => {
    // 片方しか無いと、下の判定は「全部実線」 でも「全部破線」 でも通る
    const 書いた = ER図.flatMap((d) =>
      d.edges.filter((e) => e.style !== undefined).map((e) => 識別する(d, e)),
    );
    expect(書いた.filter(Boolean).length, "識別する関係が 1 本も無い").toBeGreaterThan(0);
    expect(書いた.filter((x) => !x).length, "識別しない関係が 1 本も無い").toBeGreaterThan(0);
  });

  it("線の種類と識別の有無が食い違っていない", () => {
    const 出た = 食い違い(ER図);
    expect(
      出た,
      `実線は親の鍵が子の主キーに入る関係、破線は入らない関係` +
        ` (ER 図 ${ER図.length} 枚 / 矢印 ${矢印の数(ER図)} 本を走査)\n  ${出た.join("\n  ")}`,
    ).toEqual([]);
  });

  it("線の種類を書かない図が、宣言した分だけである", () => {
    const 実物 = 書いていない図(ER図);
    const 宣言外 = [...実物.keys()].filter((id) => !Object.hasOwn(線の種類を書かない図, id));
    expect(
      宣言外,
      `線の種類を書かない図が増えた。 一覧へ理由付きで足すか、図に書き足すかを決める` +
        ` (ER 図 ${ER図.length} 枚 / 矢印 ${矢印の数(ER図)} 本を走査)\n  ` +
        宣言外.map((id) => (実物.get(id) ?? []).join("\n  ")).join("\n  "),
    ).toEqual([]);

    // 逆向き = 書き足された図の行を残さない
    const 死んだ行 = Object.keys(線の種類を書かない図).filter((id) => !実物.has(id));
    expect(死んだ行, "宣言した図が線の種類を書くようになった (行を外す)").toEqual([]);
  });

  it("植え込み対照 ... 線を 1 本入れ替えると落ちる", () => {
    // 1 本だけ種類を入れ替えた写しを作る。 実物には触らない
    const 元 = ER図.find((d) => d.edges.some((e) => e.style !== undefined));
    expect(元, "線の種類を書いた ER 図が 1 枚も無い").toBeDefined();
    const 対象 = 元!.edges.find((e) => e.style !== undefined);
    expect(対象, `${元!.id} に線の種類を持つ矢印が無い`).toBeDefined();

    const 写し: CdlDiagram = {
      ...元!,
      edges: 元!.edges.map((e) =>
        e === 対象
          ? { ...e, style: e.style === "dashed" ? ("solid" as const) : ("dashed" as const) }
          : e,
      ),
    };
    expect(食い違い([写し]), "線を入れ替えても判定が気付かない (検査が効いていない)").toHaveLength(
      1,
    );
  });
});
