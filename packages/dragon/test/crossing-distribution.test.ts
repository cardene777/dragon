/**
 * 線どうしが交差している図を名指しで固定する (#2302)。
 *
 * 元は交差の件数分布を stderr に出すだけの調べ物で、engine の `CROSSING_WARN` の閾値を
 * 実測で決めるために作られていた。 **走査する頁を手で並べており、14 頁のうち 8 頁しか
 * 見ていなかった**。
 *
 * ```
 * [crossing-distribution] total=267 nonzero=0 median=0 p90=0 p95=0 max=0
 * ```
 *
 * この行は「どの図にも交差する線は無い」 と読めるが、実際は漏れた 6 頁 317 図のうち
 * 4 図に交差があった。 画面でも本当に交差している (線の上の点を辿って測り直した)。
 *
 * | 図 | 交差した線 | 場所 |
 * |---|---|---|
 * | `interactive-oauth-flow` | `client-consent` × `client-api` | (382.7, 168.2) |
 * | `interactive-oauth-flow` | `consent-client` × `client-api` | (384.7, 176.5) |
 * | `parts-retry-loop` | `rt-ng` × `rt-again` | (239.0, 519.1) |
 *
 * 隣の `visual-validate-sweep.test.ts` が #1405 で同じ並べ漏れを直しており、
 * 一覧と突き合わせる道具 (`catalog-scope`) も既にある。 同じ道具に乗せる。
 *
 * ## 0 件では固定しない
 *
 * 交差する線が常に誤りとは限らない (経路が行き来する図では意図した形になりうる)。
 * いま在る 4 件を消すのは図の作り直しで、判断が別に要る。
 *
 * 代わりに **宣言の一覧** で持つ = 図の名前と箇所と理由を書き、一覧に無い図で交差が出たら
 * 落ちる。 交差が消えた図が一覧に残っていても落ちる (直った宣言を残さない向き)。
 */
import { describe, it, expect } from "vitest";
import { layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
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

function isCdlDiagram(v: unknown): v is CdlDiagram {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    Array.isArray(o.nodes) &&
    Array.isArray(o.edges) &&
    Array.isArray(o.lanes) &&
    Array.isArray(o.phases)
  );
}

interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** 2 本の線分が「端で触れる」 のではなく本当に交差するか。 厳密な符号判定で端の接触を外す */
function segmentsIntersect(a: Segment, b: Segment): boolean {
  const d1 = (b.x2 - b.x1) * (a.y1 - b.y1) - (b.y2 - b.y1) * (a.x1 - b.x1);
  const d2 = (b.x2 - b.x1) * (a.y2 - b.y1) - (b.y2 - b.y1) * (a.x2 - b.x1);
  const d3 = (a.x2 - a.x1) * (b.y1 - a.y1) - (a.y2 - a.y1) * (b.x1 - a.x1);
  const d4 = (a.x2 - a.x1) * (b.y2 - a.y1) - (a.y2 - a.y1) * (b.x2 - a.x1);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

/**
 * 線の道筋を折れ線にする。
 *
 * 曲線の制御点をそのまま折れ線の角とみなす **近似** で、曲線そのものは辿らない。
 * 画面で線の上の点を 4 ずつ取って数え直したところ、この近似が出す交差と一致したため
 * (`interactive-oauth-flow` と `parts-retry-loop` の 3 箇所) そのまま使う。
 */
function extractPathSegments(d: string): Segment[] {
  const out: Segment[] = [];
  const tokens = d
    .replace(/[A-Za-z]/g, " ")
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i + 1 < tokens.length; i += 2) {
    const x = parseFloat(tokens[i]!);
    const y = parseFloat(tokens[i + 1]!);
    if (Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y });
  }
  for (let i = 0; i + 1 < points.length; i++) {
    out.push({ x1: points[i]!.x, y1: points[i]!.y, x2: points[i + 1]!.x, y2: points[i + 1]!.y });
  }
  return out;
}

function countCrossings(diag: CdlDiagram): number {
  const laid = layout(diag);
  const edgeSegs = laid.edges.map((e) => ({ id: e.id, segs: extractPathSegments(e.d) }));
  let total = 0;
  for (let i = 0; i < edgeSegs.length; i++) {
    const a = edgeSegs[i]!;
    for (let j = i + 1; j < edgeSegs.length; j++) {
      const b = edgeSegs[j]!;
      for (const sa of a.segs) {
        for (const sb of b.segs) {
          if (segmentsIntersect(sa, sb)) total++;
        }
      }
    }
  }
  return total;
}

type ModuleLike = Record<string, unknown>;

/**
 * 走査する頁。 `visual-validate-sweep.test.ts` と同じ形で持ち、
 * 下の「一覧に載る図が 1 つ残らず対象に入っている」 が漏れを落とす。
 */
const sources: Array<{ name: string; mod: ModuleLike }> = [
  { name: "cookbook", mod: cookbook },
  { name: "patterns", mod: patterns },
  { name: "presets", mod: presets },
  { name: "primitives", mod: primitives },
  { name: "primitives-extra", mod: primitivesExtra },
  { name: "text-dsl", mod: textDsl },
  { name: "animation", mod: animation },
  { name: "styles", mod: styles },
  { name: "interactive", mod: interactive },
  { name: "ethereum", mod: ethereum },
  { name: "parts", mod: parts },
  { name: "parts-in-box", mod: partsInBox },
  { name: "parts-motion", mod: partsMotion },
  { name: "charts", mod: charts },
];

const allDiagrams: CdlDiagram[] = sources.flatMap(({ mod }) =>
  Object.values(mod).filter(isCdlDiagram),
);

/**
 * 線どうしが交差している図の宣言。 **1 行につき 1 図**、理由を必ず書く。
 *
 * 箇所の数は `countCrossings` が数える線分どうしの交わりで、見た目の交点の数とは一致しない
 * (1 つの交点を挟む線分が両側で数えられる形がある)。
 *
 * 直ったら **この行を落とす** = 下の検査が「宣言に在るのに交差が無い」 で落ちるので、
 * 直した人が気付く。
 */
const 交差を認める図: Record<string, { 箇所: number; 理由: string }> = {
  "interactive-oauth-flow": {
    箇所: 4,
    理由:
      "利用者と認可の頁と業務の頁を往復する流れで、行きと帰りの線が同じ間を通る。" +
      " 実測は `client-consent` × `client-api` が (382.7, 168.2)、" +
      " `consent-client` × `client-api` が (384.7, 176.5)",
  },
  "interactive-traffic-sankey": {
    箇所: 3,
    理由: "流れの太さを見せる図で、流れが分かれて合流する形そのものが交差を生む",
  },
  "parts-retry-loop": {
    箇所: 2,
    理由:
      "やり直しの輪で、落ちた先から戻る線が先へ進む線を跨ぐ。" +
      " 実測は `rt-ng` × `rt-again` が (239.0, 519.1)",
  },
  "やり直して通った分を送り-常用が落ちたら予備へ倒す": {
    箇所: 1,
    理由: "やり直しの輪と倒し先への切替を 1 枚に並べており、輪から出る線が切替の線を跨ぐ",
  },
};

describe("線どうしが交差している図を名指しで固定する (#2302)", () => {
  it("図を 1 件以上集められている", () => {
    // 空振り防止。 0 件だと下の検査が「差が無い」 で通ってしまう
    expect(allDiagrams.length, "カタログから図を 1 件も集められていない").toBeGreaterThan(0);
  });

  it("宣言に無い図で線が交差していない", () => {
    const 出た = allDiagrams
      .map((d) => ({ id: d.id, 数: countCrossings(d) }))
      .filter((x) => x.数 > 0 && !(x.id in 交差を認める図))
      .map((x) => `${x.id} が ${x.数} 箇所`);
    expect(出た, `図 ${allDiagrams.length} 件を数えた`).toEqual([]);
  });

  it("宣言に在る図で線が実際に交差している", () => {
    // 直った図の宣言が残り続けるのを止める向き。 宣言だけが古くなると、
    // 次にその図が崩れた時に「元からそう」 と読まれる
    const 消えた = Object.keys(交差を認める図).filter((id) => {
      const d = allDiagrams.find((x) => x.id === id);
      return d === undefined || countCrossings(d) === 0;
    });
    expect(消えた, "交差が無くなったか、図そのものが消えた宣言").toEqual([]);
  });

  it("宣言の箇所の数が実測と合っている", () => {
    const ずれ = Object.entries(交差を認める図)
      .map(([id, { 箇所 }]) => {
        const d = allDiagrams.find((x) => x.id === id);
        const 実 = d ? countCrossings(d) : -1;
        return 実 === 箇所 ? null : `${id} 宣言 ${箇所} / 実測 ${実}`;
      })
      .filter((x): x is string => x !== null);
    expect(ずれ, "交差が増えた図は宣言の理由も見直す").toEqual([]);
  });
});

/**
 * 一覧に載る図が 1 つ残らず走査の対象に入っているか (#2302、形は #1405 から)。
 *
 * `sources` は手で並べるため、頁を足した時に **ここへ足し忘れる**。 忘れても本 file は通る =
 * 数える図が減るだけで、何も落ちない。 実際に 6 頁 317 図が漏れており、
 * そのうち 4 図の交差を誰も数えていなかった。
 *
 * 突き合わせは **図の id** で行う (`primitives-extra` は一覧では `primitives` に畳まれるため、
 * 頁の名前で比べると実在する頁が「一覧に無い」 と誤って落ちる)。
 * 一覧を集める道具は `catalog-scope` が持ち、4 つの検査で共有する (#1409)。
 */
describe("一覧に載る図が 1 つ残らず交差の走査に入っている (#2302)", () => {
  const 一覧の図 = async (): Promise<string[]> => (await import("@/lib/catalog-scope")).一覧の図();
  const 差分 = async (l: readonly string[], r: readonly string[]): Promise<string[]> =>
    (await import("@/lib/catalog-scope")).差分(l, r);

  const 対象の図 = (): string[] => allDiagrams.map((d) => d.id);

  it("一覧の図と走査の対象を 1 件以上集められている", async () => {
    const [一覧, 対象] = [await 一覧の図(), 対象の図()];
    expect(一覧.length, "一覧から図を 1 件も集められていない").toBeGreaterThan(0);
    expect(対象.length, "走査の対象から図を 1 件も集められていない").toBeGreaterThan(0);
  });

  it("一覧にあって交差の走査に無い図が無い", async () => {
    const 漏れ = await 差分(await 一覧の図(), 対象の図());
    expect(漏れ, "一覧に出るのに交差を数えていない図").toEqual([]);
  });

  it("交差の走査の対象だが一覧に無い図が無い", async () => {
    const 余り = await 差分(対象の図(), await 一覧の図());
    expect(余り, "交差を数えているが一覧に出ない図").toEqual([]);
  });
});
