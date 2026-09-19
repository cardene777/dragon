/**
 * 図を配置した時に記法の engine が出す知らせを、理由つきの宣言と突き合わせる (#2308)。
 *
 * カタログの図を配置すると 117 行の知らせが流れる。 開発サーバーを立てるたび、検査を回すたび、
 * 書き出すたびに出るが、**何行出るのが正しいかを判定する場所が repo のどこにも無かった**。
 *
 * この流れの中に実際に 3 件の不具合が埋もれていた。
 *
 * | 見つけたもの | 行き先 |
 * |---|---|
 * | 組の名札が仮置きの位置で重なると知らされる | #2300 |
 * | 線の交差を数える走査が頁の半分を見ていない | #2302 |
 * | 円弧の引数を座標として読む | #2306 / `cardene777/cdl#872` |
 *
 * ## 何を固定して、何を固定しないか
 *
 * | 何を | 固定するか | 理由 |
 * |---|---|---|
 * | 出る知らせの種類 | する | 新しい種類が混ざったら気付く |
 * | `lane-label ∩ edge-path` の件 | **図と相手を名指しで** | engine の不具合の症状。 直ったら落ちて宣言を外せる |
 * | `edge-path ∩ edge-path` の件数 | しない | 下記 |
 *
 * 線どうしの件数を固定しないのは、**engine が端で触れる分も数えている** ため。
 * 箱を共有する 2 本の線 (`a → b` と `b → c`) は箱の縁で必ず触れ、engine はそれを
 * 重なりとして数える。 図を 1 つ足すだけで動く値で、固定すると図を足すたびに書き換えになる。
 *
 * 線が **本当に** 交差しているかは `crossing-distribution.test.ts` が別に測っており
 * (#2302 / #2306)、そちらが 4 図を名指しで固定している。
 *
 * ## 知らせの文面に頼る形の脆さ
 *
 * この検査は engine が `console.warn` に出す文面を読む。 文面が変われば読めなくなる。
 * **読めなくなったことは「知らせ 0 件」 と区別できる** = 集めた行が 1 行以上あることを
 * 母数として見ており、0 行なら落ちる。
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

const sources: Array<Record<string, unknown>> = [
  cookbook,
  patterns,
  presets,
  primitives,
  primitivesExtra,
  textDsl,
  animation,
  styles,
  interactive,
  ethereum,
  parts,
  partsInBox,
  partsMotion,
  charts,
];

const allDiagrams: CdlDiagram[] = sources.flatMap((mod) => Object.values(mod).filter(isCdlDiagram));

/** 1 件の知らせ。 `種類` は「重なりか近接か」 と「何と何か」 だけを取り出したもの */
interface 知らせ {
  readonly 図: string;
  readonly 種類: string;
  readonly 左: string;
  readonly 右: string;
}

/** 全ての図を配置して、engine が出した知らせを集める */
function 知らせを集める(): { 出た: 知らせ[]; 読めない: string[]; 配置した図: number } {
  const 出た: 知らせ[] = [];
  const 読めない: string[] = [];
  let 配置した図 = 0;
  const 元 = console.warn;
  try {
    for (const d of allDiagrams) {
      const 行: string[] = [];
      console.warn = (...a: unknown[]) => {
        const s = a.map(String).join(" ");
        if (s.includes("[cdl layout]")) 行.push(s);
      };
      try {
        layout(d);
        配置した図++;
      } catch {
        // 配置できない図は別の検査が見る。 ここは知らせだけを集める
      } finally {
        console.warn = 元;
      }
      for (const s of 行) {
        const m = /(overlap|near): (\S+?)#(\S+?) [∩↔] (\S+?)#(\S+)/.exec(s);
        if (!m) {
          読めない.push(s);
          continue;
        }
        出た.push({
          図: d.id,
          種類: `${m[1]} ${m[2]} ∩ ${m[4]}`,
          左: m[3]!,
          右: m[5]!.replace(/ =.*$/, ""),
        });
      }
    }
  } finally {
    console.warn = 元;
  }
  return { 出た, 読めない, 配置した図 };
}

/**
 * 出てよい知らせの種類と、その理由。
 *
 * ここに無い種類が出たら落ちる = engine の配置が新しい壊れ方をした合図になる。
 */
const 認める種類: Record<string, string> = {
  "overlap edge-path ∩ edge-path":
    "engine は箱の縁で線が触れる分も重なりとして数える。" +
    " 箱を共有する 2 本の線 (`a → b` と `b → c`) は必ず縁で触れるので、図の数に比例して出る。" +
    " 線が本当に交差しているかは `crossing-distribution.test.ts` が別に測る (#2302 / #2306)",
  "overlap lane-label ∩ edge-path":
    "engine が円弧の引数を座標として読み、線の外接矩形が図の左上まで伸びている" +
    " (`cardene777/cdl#872`)。 画面では 358px 離れており重なっていない。" +
    " 直ったら下の宣言が落ちる",
};

/**
 * `lane-label ∩ edge-path` の件を名指しで宣言する。 行き先は `cardene777/cdl#872`。
 *
 * **直ったら落ちる向きも持つ** = engine が直ると 3 件とも出なくなり、
 * 「宣言に在るのに出ていない」 で落ちる。 落ちたらこの宣言ごと外す。
 */
const 名札と線の件: ReadonlyArray<{ 図: string; 左: string; 右: string }> = [
  { 図: "parts-retry-loop", 左: "rt1", 右: "rt-ng" },
  { 図: "parts-retry-loop", 左: "rt2", 右: "rt-ng" },
  { 図: "やり直して通った分を送り-常用が落ちたら予備へ倒す", 左: "やり直す", 右: "rt__rt-ng" },
];

const 鍵 = (x: { 図: string; 左: string; 右: string }): string => `${x.図} : ${x.左} ∩ ${x.右}`;

describe("図を配置した時に出る知らせを、宣言と突き合わせる (#2308)", () => {
  const 集めた = 知らせを集める();

  it("図を配置して知らせを集められている (空振り検知)", () => {
    // 0 行だと下の検査が全部「差が無い」 で通る。 engine が文面を変えた時もここで落ちる
    expect(集めた.配置した図, "図を 1 件も配置できていない").toBeGreaterThan(0);
    expect(
      集めた.出た.length,
      `図 ${集めた.配置した図} 件を配置したが知らせを 1 行も集められていない` +
        " (engine の文面が変わったか、集める経路が切れている)",
    ).toBeGreaterThan(0);
  });

  it("読めない文面の知らせが無い", () => {
    // 読めない行を黙って捨てると、新しい種類の知らせが「0 件」 に化ける
    expect(集めた.読めない, "文面を読めない知らせがある").toEqual([]);
  });

  it("宣言に無い種類の知らせが出ていない", () => {
    const 出た種類 = [...new Set(集めた.出た.map((x) => x.種類))].sort();
    const 宣言に無い = 出た種類.filter((k) => !(k in 認める種類));
    expect(
      宣言に無い,
      `知らせ ${集めた.出た.length} 行 / 種類 ${出た種類.join(" / ")}`,
    ).toEqual([]);
  });

  it("宣言した種類が実際に出ている (直った宣言を残さない)", () => {
    const 出た種類 = new Set(集めた.出た.map((x) => x.種類));
    const 出なくなった = Object.keys(認める種類).filter((k) => !出た種類.has(k));
    expect(出なくなった, "宣言に在るのに 1 度も出ない種類。 宣言ごと外す").toEqual([]);
  });

  it("宣言の各行に理由が書かれている", () => {
    const 空 = Object.entries(認める種類)
      .filter(([, 理由]) => 理由.trim().length === 0)
      .map(([k]) => k);
    expect(空, "理由の無い宣言").toEqual([]);
  });

  it("名札と線の重なりが、宣言した件と 1 件も違わない", () => {
    const 出た = 集めた.出た
      .filter((x) => x.種類 === "overlap lane-label ∩ edge-path")
      .map(鍵)
      .sort();
    const 宣言 = 名札と線の件.map(鍵).sort();
    // 増えた向きと消えた向きを 1 つの比較で見る。 engine (`cardene777/cdl#872`) が直ると
    // 出た側が空になって落ちるので、この宣言を外す合図になる
    expect(出た, `宣言 ${宣言.length} 件 / 実測 ${出た.length} 件`).toEqual(宣言);
  });
});
