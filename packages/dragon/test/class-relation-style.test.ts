/**
 * クラス図の関係の名前と描き方の対応を固定する (#2589)。
 *
 * 見本帳のクラス図は、関係の種類ごとに決まった描き方をする。
 *
 * | 関係 | 線 | 端の形 | 端の塗り |
 * |---|---|---|---|
 * | 継承 | 実線 | 三角 (先) | 白抜き |
 * | 実装 | 破線 | 三角 (先) | 白抜き |
 * | 関連 | 実線 | 開いた矢 (先) | — |
 * | 依存 | 破線 | 開いた矢 (先) | — |
 * | 集約 | 実線 | 菱形 (元) | 白抜き |
 * | コンポジション | 実線 | 菱形 (元) | 塗り |
 *
 * UML の描き方と同じ割り当てで、#2589 の時点で矢印 23 本すべてが従っていた。
 *
 * ## なぜ固定するか
 *
 * **描き方と名前は別々に書く**。 線と端は関係の種類から導かれ (`relation: extends` /
 * `type: "implements"`)、名前は `label` として隣に手で書く。 2 つが食い違っても図は
 * 描かれるので、`relation: extends` と書いた矢印に「依存」 と名前を付けても画面は出る。
 *
 * **線の種類は端の形から決まらない**。 白抜き三角は実線なら継承、破線なら実装。
 * 開いた矢は実線なら関連、破線なら依存。 線を消すと 6 種のうち 4 種が区別できなくなる。
 *
 * 揃っていても崩れたことに気付く仕掛けが無かった = 名前を 1 つ入れ替えても検査は
 * 1 件も落ちなかった (#2589 で実測)。
 *
 * ER 図は線の種類の対応を `er-line-style.test.ts` が見る。 こちらはクラス図を見る。
 *
 * ## 両方向で見る
 *
 * 名前から描き方を引くだけだと、**表に無い名前を持つ矢印が素通りする**
 * (役割の名前を書いた関連など)。 描き方から名前を引く向きも見て、表に載る描き方で
 * 描かれた矢印が表のとおりの名前を持つことまで確かめる。
 *
 * 表の行が実物に 1 件も出ていない場合も落とす = 図から消えた関係の行が残ると、
 * 表が実物から離れる。
 *
 * ## 表は手で書く
 *
 * 実物から作ると何を書いても通る検査になり、崩れた時に落ちない
 * (`rules/quality.md § 導出可能記述は人手で書かない` は逆向きの話で、
 * **守りたい対象の側** は手で書く)。
 *
 * ## 0 件は母数と一緒に出す
 *
 * 走査が空振りしても 0 件になるので、0 だけを見てもどちらか判らない
 * (`rules/quality.md § 0 件を報告する時は母数を併記する`)。
 */
import { describe, it, expect } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";

import { 全図 } from "./support/responsive-accepted";

/** カタログのクラス図。 種類は図が自分で持つ (`type: class`) */
const クラス図 = 全図.filter((d) => d.type === "class");

/** 矢印の描き方。 名前を決めるのに要る 5 欄だけを持つ */
interface 描き方 {
  /** 線の種類 */
  readonly style: string;
  /** 先の端の形 */
  readonly head: string;
  /** 元の端の形 */
  readonly tailHead: string;
  /** 先の端の塗り */
  readonly headFill: string;
  /** 元の端の塗り */
  readonly tailHeadFill: string;
}

/**
 * 関係の名前と描き方の対応。 **実物から作らず手で書く**。
 *
 * 新しい関係の種類を足す時は、ここに行を足すことが要る = 足さずに描くと検査が落ちる。
 */
const 対応表: Record<string, 描き方> = {
  継承: { style: "solid", head: "triangle", tailHead: "none", headFill: "hollow", tailHeadFill: "solid" },
  実装: { style: "dashed", head: "triangle", tailHead: "none", headFill: "hollow", tailHeadFill: "solid" },
  関連: { style: "solid", head: "open", tailHead: "none", headFill: "solid", tailHeadFill: "solid" },
  依存: { style: "dashed", head: "open", tailHead: "none", headFill: "solid", tailHeadFill: "solid" },
  集約: { style: "solid", head: "none", tailHead: "diamond", headFill: "solid", tailHeadFill: "hollow" },
  コンポジション: {
    style: "solid",
    head: "none",
    tailHead: "diamond",
    headFill: "solid",
    tailHeadFill: "solid",
  },
};

/** 矢印から描き方を読む。 書かれていない欄は「なし」 として持つ (既定値に倒さない) */
function 描き方を読む(e: unknown): 描き方 {
  const x = e as Record<string, unknown>;
  const 字 = (v: unknown): string => (typeof v === "string" ? v : "なし");
  return {
    style: 字(x.style),
    head: 字(x.head),
    tailHead: 字(x.tailHead),
    headFill: 字(x.headFill),
    tailHeadFill: 字(x.tailHeadFill),
  };
}

const 同じ描き方 = (a: 描き方, b: 描き方): boolean =>
  a.style === b.style &&
  a.head === b.head &&
  a.tailHead === b.tailHead &&
  a.headFill === b.headFill &&
  a.tailHeadFill === b.tailHeadFill;

const 描き方の字 = (d: 描き方): string =>
  `線=${d.style} 先=${d.head}(${d.headFill}) 元=${d.tailHead}(${d.tailHeadFill})`;

/** 矢印 1 本の見出し。 落ちた時にどの図のどの線かが分かる形にする */
const 名 = (d: CdlDiagram, e: { from: string; to: string }): string =>
  `${d.id}: ${e.from} -> ${e.to}`;

/** 矢印に書いた関係の名前 */
const 関係の名前 = (e: unknown): string => {
  const v = (e as Record<string, unknown>).label;
  return typeof v === "string" ? v : "";
};

/**
 * 名前と描き方が対応表と食い違う矢印。
 *
 * **植え込み対照から呼べる形にする** = 本番と対照で別の数え方をすると、対照が本番と
 * 違うものを見る。
 */
function 食い違い(図: readonly CdlDiagram[]): string[] {
  const out: string[] = [];
  for (const d of 図) {
    for (const e of d.edges) {
      const 名前 = 関係の名前(e);
      const 実際 = 描き方を読む(e);
      const 表 = Object.hasOwn(対応表, 名前) ? 対応表[名前] : undefined;

      if (表 !== undefined) {
        // 名前 → 描き方。 表に載る名前は、表のとおりに描く
        if (!同じ描き方(実際, 表)) {
          out.push(`${名(d, e)} 「${名前}」 は ${描き方の字(表)} で描く (実際は ${描き方の字(実際)})`);
        }
        continue;
      }

      // 描き方 → 名前。 表に載る描き方で描いたなら、表のとおりの名前を書く
      const 当たる = Object.entries(対応表).find(([, v]) => 同じ描き方(実際, v));
      if (当たる !== undefined) {
        out.push(`${名(d, e)} ${描き方の字(実際)} は 「${当たる[0]}」 の描き方 (名前は 「${名前}」)`);
        continue;
      }

      out.push(`${名(d, e)} 表に無い名前と描き方 (「${名前}」 / ${描き方の字(実際)})`);
    }
  }
  return out;
}

/** 走査した矢印の本数。 0 件の報告に添える母数 */
const 矢印の数 = (図: readonly CdlDiagram[]): number =>
  図.reduce((a, d) => a + d.edges.length, 0);

describe("クラス図の関係の名前と描き方 (#2589)", () => {
  it("クラス図を 1 枚以上集められている", () => {
    expect(
      クラス図.length,
      `カタログのクラス図を 1 枚も集められていない (全図 ${全図.length} 枚を走査)`,
    ).toBeGreaterThan(0);
    expect(矢印の数(クラス図), "クラス図に矢印が 1 本も無い (検査が空振りしている)").toBeGreaterThan(
      0,
    );
  });

  it("名前と描き方が対応表と食い違っていない", () => {
    const 出た = 食い違い(クラス図);
    expect(
      出た,
      `関係の名前と描き方を対応表に揃える` +
        ` (クラス図 ${クラス図.length} 枚 / 矢印 ${矢印の数(クラス図)} 本を走査)\n  ${出た.join("\n  ")}`,
    ).toEqual([]);
  });

  it("対応表の行が全て実物に出ている", () => {
    // 図から消えた関係の行が残ると、表が実物から離れる
    const 出ている = new Set(クラス図.flatMap((d) => d.edges.map((e) => 関係の名前(e))));
    const 死んだ行 = Object.keys(対応表).filter((k) => !出ている.has(k));
    expect(
      死んだ行,
      `対応表に実物へ出ない行がある (クラス図 ${クラス図.length} 枚 / 矢印 ${矢印の数(クラス図)} 本を走査)`,
    ).toEqual([]);
  });

  it("線の種類は端の形から決まらない", () => {
    /*
     * この検査が守っている中身そのもの。 端の形と塗りが同じで線の種類だけが違う組が
     * 無くなったら、線は端の写しになっており ER 図で直した型 (#2587) と同じ状態になる。
     */
    const 端ごと = new Map<string, Set<string>>();
    for (const v of Object.values(対応表)) {
      const 鍵 = `${v.head}/${v.tailHead}/${v.headFill}/${v.tailHeadFill}`;
      端ごと.set(鍵, new Set([...(端ごと.get(鍵) ?? []), v.style]));
    }
    const 割れる = [...端ごと.values()].filter((s) => s.size > 1);
    expect(
      割れる.length,
      "端の形が同じで線の種類が割れる組が無い = 線が端の写しになっている (#2587 と同じ型)",
    ).toBeGreaterThan(0);
  });

  it("植え込み対照 ... 線を 1 本入れ替えると落ちる", () => {
    // 1 本だけ線の種類を入れ替えた写しを作る。 実物には触らない
    const 元 = クラス図.find((d) => d.edges.some((e) => Object.hasOwn(対応表, 関係の名前(e))));
    expect(元, "対応表に載る名前を持つクラス図が 1 枚も無い").toBeDefined();
    const 対象 = 元!.edges.find((e) => Object.hasOwn(対応表, 関係の名前(e)));
    expect(対象, `${元!.id} に対応表へ載る名前の矢印が無い`).toBeDefined();

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
