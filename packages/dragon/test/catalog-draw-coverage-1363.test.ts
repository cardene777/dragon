import { readdirSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { validate, type CdlDiagram } from "@cardenelabs/cdl";

import * as cookbook from "../../../apps/playground-spa/src/topics/catalog/cookbook.cdl";
import * as patterns from "../../../apps/playground-spa/src/topics/catalog/patterns.cdl";
import * as presets from "../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import * as primitives from "../../../apps/playground-spa/src/topics/catalog/primitives.cdl";
import * as primitivesExtra from "../../../apps/playground-spa/src/topics/catalog/primitives-extra.cdl";
import * as textDsl from "../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import * as animation from "../../../apps/playground-spa/src/topics/catalog/animation.cdl";
import * as styles from "../../../apps/playground-spa/src/topics/catalog/styles.cdl";
import * as interactive from "../../../apps/playground-spa/src/topics/catalog/interactive.cdl";
import * as ethereum from "../../../apps/playground-spa/src/topics/catalog/ethereum.cdl";
import * as parts from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import * as partsInBox from "../../../apps/playground-spa/src/topics/catalog/parts-in-box.cdl";
import * as partsMotion from "../../../apps/playground-spa/src/topics/catalog/parts-motion.cdl";
import * as charts from "../../../apps/playground-spa/src/topics/catalog/charts.cdl";

/**
 * カタログの全ページで「起点から描ける図は描く指定を持つ」 ことの検査 (#1363)。
 *
 * `charts` は #1318、`presets` は #1358 で埋めたが、`text-dsl` の 3 件が対象から漏れていた。
 * ページを 1 つずつ直す形だと、**次にページが増えた時にまた漏れる**。 全ページを走査して
 * 抜けを 0 件で固定する。
 *
 * 「起点から描ける種別」 の一覧は cdl が持っている (`DRAW_KINDS`) が公開されていないため、
 * ここには写さない。 代わりに **cdl の検査そのものを通して** 判定する = 描けない種別を指すと
 * `validate` が警告を出すので、その有無で「描ける種別か」 が分かる。
 */

const ページ: Record<string, Record<string, unknown>> = {
  cookbook,
  patterns,
  presets,
  primitives,
  "primitives-extra": primitivesExtra,
  "text-dsl": textDsl,
  animation,
  styles,
  interactive,
  ethereum,
  parts,
  "parts-in-box": partsInBox,
  "parts-motion": partsMotion,
  charts,
};

/** catalog directory の実ファイル。 手動 import からページが漏れた時に検知する */
const 実在するページ = (): string[] =>
  readdirSync(new URL("../../../apps/playground-spa/src/topics/catalog", import.meta.url))
    .filter((name) => name.endsWith(".cdl.ts"))
    .map((name) => name.slice(0, -".cdl.ts".length))
    .sort();

type 見本 = { page: string; id: string; diagram: CdlDiagram };

const 全見本 = (): 見本[] => {
  const out: 見本[] = [];
  for (const [page, mod] of Object.entries(ページ)) {
    for (const v of Object.values(mod)) {
      if (v && typeof v === "object" && "id" in v && "phases" in v && "nodes" in v) {
        out.push({ page, id: (v as CdlDiagram).id, diagram: v as CdlDiagram });
      }
    }
  }
  return out;
};

/** `validate` が出す警告を集める。 cdl は `console.warn` に出す */
const 取れた警告 = (f: () => void): string[] => {
  const 元 = console.warn;
  const 出た: string[] = [];
  console.warn = (...a: unknown[]) => {
    出た.push(a.map(String).join(" "));
  };
  try {
    f();
  } finally {
    console.warn = 元;
  }
  return 出た;
};

/**
 * その箱が起点から描ける種別か。
 *
 * 判定を一覧で持たず、**cdl に聞く**。 その箱を指す `draw` を持つ図を作って `validate` に
 * かけ、「起点から描く動きを持たない」 の警告が出なければ描ける種別。
 */
const 描ける箱か = (diagram: CdlDiagram, 箱id: string): boolean => {
  const 試す: CdlDiagram = {
    ...diagram,
    phases: diagram.phases.map((p, i) => (i === 0 ? { ...p, draw: [箱id] } : p)),
  };
  const 警告 = 取れた警告(() => validate(試す));
  return !警告.some((w) => w.includes("draw") && w.includes("起点から描く動きを持たない"));
};

/** その図の中で起点から描ける箱 */
const 描ける箱 = (d: CdlDiagram): string[] =>
  d.phases.length === 0 ? [] : d.nodes.filter((n) => 描ける箱か(d, n.id)).map((n) => n.id);

describe("カタログの全ページで、起点から描ける図は描く指定を持つ (#1363)", () => {
  const 見本 = 全見本();

  it("catalog の全ページを走査対象にしている", () => {
    expect(Object.keys(ページ).sort(), "新しいページが全ページ走査から漏れている").toEqual(実在するページ());
  });

  it("見本を集められている", () => {
    expect(見本.length, "見本を 1 件も集められていない (検査が空振りしている)").toBeGreaterThan(50);
  });

  it("起点から描ける図は 41 件で、すべて描く指定を持つ", () => {
    const 描ける図: 見本[] = 見本.filter((x) => 描ける箱(x.diagram).length > 0);
    // 件数を固定する = 描ける図が増えた時に、この検査を通す前に気付ける
    // #1966 で体験の道筋の 5 つの気持ちの変種を足して 32 → 33
    // #1969 で棒を段の 4 割で伸ばし終える変種を足して 33 → 34
    // #2177 で折れ線の複雑な版を足して 34 → 35
    // #2179 で円グラフの複雑な版を足して 35 → 36
    // #2181 で進捗図の複雑な版を足して 36 → 37
    // #2183 で体験の道筋の複雑な版を足して 37 → 38
    // #2185 で漏斗の複雑な版を足して 38 → 39
    // #2189 で階層図の複雑な版を足して 39 → 40
    // #2191 で枝分かれ図の複雑な版を足して 40 → 41
    expect(描ける図.length, "描ける図の件数が変わった。 増えた分に描く指定を足すこと").toBe(41);

    const 抜け = 描ける図
      .filter((x) => x.diagram.phases.every((p) => (p.draw ?? []).length === 0))
      .map((x) => `${x.page}/${x.id}`);
    expect(抜け, "起点から描けるのに描く指定を持たない図がある").toEqual([]);
  });

  it("描く指定の相手は、その図の中の描ける箱", () => {
    let 見た = 0;
    for (const { page, id, diagram } of 見本) {
      const 描ける = new Set(描ける箱(diagram));
      for (const p of diagram.phases) {
        for (const 相手 of p.draw ?? []) {
          見た += 1;
          expect(描ける.has(相手), `${page}/${id} の段 "${p.id}" が描けない箱 "${相手}" を指す`).toBe(
            true,
          );
        }
      }
    }
    expect(見た, "描く指定を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("起点から描けない図には描く指定が付かない (陰性対照)", () => {
    const 描けない = 見本.filter((x) => 描ける箱(x.diagram).length === 0);
    expect(描けない.length, "描けない図が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);

    let 見た段 = 0;
    for (const { page, id, diagram } of 描けない) {
      for (const p of diagram.phases) {
        見た段 += 1;
        expect((p.draw ?? []).length, `${page}/${id} の段 "${p.id}" に描く指定が付いている`).toBe(0);
      }
    }
    expect(見た段, "段を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("描けない箱を指すと cdl の検査が知らせる (陽性対照)", () => {
    // 上の 2 件は「警告が 0 件」 を見る。 検査が動いていることを別に確かめる
    const 描けない = 見本.find((x) => 描ける箱(x.diagram).length === 0);
    expect(描けない, "対照に使う図が見つからない").toBeDefined();
    const 箱 = 描けない!.diagram.nodes[0];
    expect(箱, "対照に使う箱が無い").toBeDefined();
    expect(描ける箱か(描けない!.diagram, 箱!.id), "描けない箱を描けると判定している").toBe(false);
  });
});
