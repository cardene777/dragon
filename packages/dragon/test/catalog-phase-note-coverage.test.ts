/**
 * 段の説明は全段に書くか 1 段も書かない (#2615)。
 *
 * 説明を出す層 (`PhaseNote`) は全段の説明を升に重ね、いま光っている段の 1 行だけを見せる。
 * 高さは最も長い説明で決まるため、**説明を持たない段では枠が空になる**。 枠は消えず、
 * 最も長い説明ぶんの高さを取ったまま文字が 1 字も無い状態になる。
 *
 * 出す層が扱えるのは 2 つの状態だけ。
 *
 * | 状態 | 画面 |
 * |---|---|
 * | 全段に説明がある | 段ごとに文が入れ替わる |
 * | 1 段も説明がない | 枠そのものを出さない |
 *
 * 混在だけが扱えない。 実測で 21 図が混在しており、いずれも最後の段にだけ説明があった
 * (`interactive` 18 件 + `patterns` 3 件)。 段を送ると文が出たり消えたりするので、読み手は
 * 説明が終わったのか、まだ出るのかを判断できなかった。
 *
 * **表で絞った結果を表と比べない** (#2611 で同じ形が行の足りない状態を見逃した)。
 * 実物の図を全件走査して、説明を持つ段の数が 0 か全段かのどちらでもない図を落とす。
 *
 * **件数を書かない**。 図は増えるので、書くと足すたびに古くなる。 分類そのものを見る。
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

describe("段の説明の埋まり具合 (#2615)", () => {
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

  it("説明は全段に書くか 1 段も書かない", () => {
    const 混在: string[] = [];
    for (const [name, mod] of 対象) {
      for (const [key, d] of diagramsOf(mod)) {
        const n = d.phases.length;
        // 段が 1 つしかない図は出す下限 (2 段) に届かないので枠が出ない
        if (n < 2) continue;
        const 有 = 説明の数(d);
        if (有 === 0 || 有 === n) continue;
        混在.push(`${name}/${key} (${d.id}) ${有}/${n} 段`);
      }
    }
    expect(
      混在,
      `説明が一部の段にしかない図がある。 説明を持たない段で枠が空になる\n  ${混在.join("\n  ")}`,
    ).toHaveLength(0);
  });
});
