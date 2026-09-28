/**
 * 段が 2 つ以上ある図は全段に説明を持つ (#2615 で混在を落とし、#2623 で全段なしも落とす)。
 *
 * 説明を出す層 (`PhaseNote`) は全段の説明を升に重ね、いま光っている段の 1 行だけを見せる。
 * 高さは最も長い説明で決まるため、**説明を持たない段では枠が空になる**。 枠は消えず、
 * 最も長い説明ぶんの高さを取ったまま文字が 1 字も無い状態になる。
 *
 * #2615 ではこの空の枠を落とすため、扱える状態を 2 つ (全段あり / 全段なし) に定めた。
 * 全段なしを残したのは混在を落とすための線引きで、それでよいと決めたわけではない。
 * 実測で 54 図が全段なしのまま残り、361 図には文が出るので、**同じ見本帳の中で文が
 * 出る図と出ない図が混ざっていた**。 出ない図に当たった読み手は、説明の無い図なのか
 * 出し忘れなのかを判断できない。 #2623 で 54 図 178 段を埋め、扱う状態を 1 つに狭めた。
 *
 * **表で絞った結果を表と比べない** (#2611 で同じ形が行の足りない状態を見逃した)。
 * 実物の図を全件走査して、説明を持つ段の数が段の数に届かない図を落とす。
 *
 * **件数を書かない**。 図は増えるので、書くと足すたびに古くなる。 分類そのものを見る。
 *
 * ## 説明は文であること (#2631)
 *
 * 埋まっているだけでは足りない。 実測で 58 件が「清算」「元帳」「L1」 のような箱の名前の
 * 言い換えで、**その段で何が変わるかを書いていなかった**。 枠の高さは最も長い説明で決まるため、
 * 札だけの段では空きが大きく出る一方、読み手は段を送っても何も分からない。
 *
 * **機械が見るのは句点だけにする**。 札か文かは語の良し悪しなので静的に判定できない。
 * 句点を要求すれば札のままでは書けず、中身が文になっているかはレビューで見る。
 *
 * **長さの下限は置かない**。 実測で「外から関数を呼ぶ。」 のような 15 字未満の良い文が
 * 57 件あり、下限は文を水増しする方向に働く。
 *
 * ここが見るのは組み上げた図なので、記法から作る見本は記法側の字が判定される。
 * JSON 側は `catalog-two-form-parity.test.ts` (#2625) が記法と突き合わせるので、
 * 片方だけ札のまま残ると そちらが落ちる。
 */
import { describe, it, expect } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as Parts from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import * as PartsInBox from "../../../apps/playground-spa/src/topics/catalog/parts-in-box.cdl";
import * as PartsMotion from "../../../apps/playground-spa/src/topics/catalog/parts-motion.cdl";
import * as Interactive from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";
import * as Cookbook from "../../../apps/playground-spa/src/topics/catalog/cookbook.cdl";
import * as Patterns from "../../../apps/playground-spa/src/topics/catalog/patterns.cdl";
import * as TextDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import * as Ethereum from "../../../apps/playground-spa/src/topics/catalog/ethereum.cdl";
import * as Animation from "../../../apps/playground-spa/src/topics/catalog/animation.cdl";
import * as Primitives from "../../../apps/playground-spa/src/topics/catalog/primitives.cdl";
import * as PrimitivesExtra from "../../../apps/playground-spa/src/topics/catalog/primitives-extra.cdl";
import * as Presets from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import * as Charts from "../../../apps/playground-spa/src/topics/catalog/charts.cdl";
import * as Styles from "../../../apps/playground-spa/src/topics/catalog/styles.cdl";

const カタログの置き場 = join(__dirname, "../../../apps/playground-spa/src/topics/catalog");

const 対象: Array<[string, Record<string, unknown>]> = [
  ["parts", Parts],
  ["parts-in-box", PartsInBox],
  ["parts-motion", PartsMotion],
  ["interactive", Interactive],
  ["cookbook", Cookbook],
  ["patterns", Patterns],
  ["text-dsl", TextDsl],
  ["ethereum", Ethereum],
  ["animation", Animation],
  ["primitives", Primitives],
  ["primitives-extra", PrimitivesExtra],
  ["presets", Presets],
  ["charts", Charts],
  ["styles", Styles],
];

const diagramsOf = (mod: Record<string, unknown>): Array<[string, CdlDiagram]> =>
  Object.entries(mod)
    .filter(([, v]) => {
      if (!v || typeof v !== "object") return false;
      const d = v as Partial<CdlDiagram>;
      return typeof d.id === "string" && Array.isArray(d.nodes) && Array.isArray(d.phases);
    })
    .map(([k, v]) => [k, v as CdlDiagram]);

/** 説明を持つ段の数 (空白だけの文は持たないものとして数える) */
const 説明の数 = (d: CdlDiagram): number =>
  d.phases.filter((p) => (p.body ?? "").trim() !== "").length;

describe("段の説明の埋まり具合と書き方 (#2615 / #2623 / #2631)", () => {
  it("走査する module がカタログの file を全部覆う", () => {
    // **一覧を手で持つと file を足した時に静かに外れる**。 置き場を読んで突き合わせる =
    // 覆えていない file があれば落ちる (#824 の経路 1)。
    const 置き場の名 = readdirSync(カタログの置き場)
      .filter((f) => f.endsWith(".cdl.ts"))
      .map((f) => f.replace(/\.cdl\.ts$/, ""))
      .sort();
    expect(
      [...対象.map(([n]) => n)].sort(),
      "走査する module とカタログの file がずれている (足す場所 = この file の 対象)",
    ).toEqual(置き場の名);
  });

  it("段が 2 つ以上ある図は全段に説明を持つ", () => {
    const 欠け: string[] = [];
    let 母数 = 0;
    for (const [name, mod] of 対象) {
      for (const [key, d] of diagramsOf(mod)) {
        const n = d.phases.length;
        // 段が 1 つしかない図は出す下限 (2 段) に届かないので枠が出ない
        if (n < 2) continue;
        母数 += 1;
        const 有 = 説明の数(d);
        if (有 === n) continue;
        欠け.push(`${name}/${key} (${d.id}) ${有}/${n} 段`);
      }
    }
    // **0 件の報告には母数を併記する** = 走査できていない状態と区別が付かなくなる。
    expect(母数, "段が 2 つ以上ある図が 1 件も取れていない (import か走査が壊れている)").toBeGreaterThan(0);
    expect(
      欠け,
      `説明を持たない段がある図がある (母数 ${母数} 図)。 段を送っても文が入れ替わらない\n  ${欠け.join("\n  ")}`,
    ).toHaveLength(0);
  });

  it("段の説明は句点で終わる", () => {
    const 札: string[] = [];
    let 母数 = 0;
    for (const [name, mod] of 対象) {
      for (const [key, d] of diagramsOf(mod)) {
        d.phases.forEach((p, i) => {
          const 文 = (p.body ?? "").trim();
          // 空の段は前の検査が担当する (ここで二重に落とすと直す先が読めない)
          if (文 === "") return;
          母数 += 1;
          if (文.endsWith("。")) return;
          札.push(`${name}/${key} (${d.id}) 段 ${i + 1} 「${文}」`);
        });
      }
    }
    expect(母数, "説明を持つ段が 1 件も取れていない (import か走査が壊れている)").toBeGreaterThan(0);
    expect(
      札,
      `句点で終わらない説明がある (母数 ${母数} 段)。 箱の名前の言い換えではなく、その段で何が変わるかを文で書く\n  ${札.join("\n  ")}`,
    ).toHaveLength(0);
  });
});
