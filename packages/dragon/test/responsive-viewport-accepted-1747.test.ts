/**
 * 読みにくさを受け入れた図の一覧 (#1747)。
 *
 * 見本帳 444 枚のうち 20 枚が軸 23 `responsive-viewport` の注意に出る。 20 枚とも
 * **受け入れると決めた** (#1740) = 拡大表示の倍率を上げれば読めるため (#1745)。
 *
 * 受け入れたのは **いまの 20 枚** であって「境を割る図は何でも受け入れる」 ではない。
 * `responsive-viewport-width-1738.test.ts` は「注意の集合 = 器に収めた倍率が境を割る図の
 * 集合」 を突き合わせるが、**その集合が何枚でも通る** = 21 枚目が出ても落ちない。
 *
 * ここで一覧を名前で持ち、実際に注意が出る図と両方向で突き合わせる。
 *
 * ## 件数でなく名前で持つ
 *
 * 件数を固定すると、境を割らない図を 1 枚足しただけでも書き換えになる。
 * 名前なら **境をまたいだ図が出た時にだけ** 落ちる。
 *
 * ## 両方向で見る
 *
 * 一覧に無い図が注意に出たら落ちる (21 枚目)。 注意に出なくなった図が一覧に残っていても
 * 落ちる (直した図の行が腐らない)。 片側だけだと、対処済の名前が残り続けて一覧が実物から離れる。
 *
 * ## 一覧は手で書く
 *
 * 実際の集合から作ると、何を書いても通る検査になる。
 */
import { describe, it, expect } from "vitest";
import { visualValidateAll } from "@cardenelabs/cdl";
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
import * as charts from "../../../apps/playground-spa/src/topics/catalog/charts.cdl";

const 図か = (v: unknown): v is CdlDiagram =>
  typeof v === "object" &&
  v !== null &&
  Array.isArray((v as CdlDiagram).nodes) &&
  Array.isArray((v as CdlDiagram).lanes);

/** 見本帳の全図。 枚数は増えるので書かない。 */
const 全図: CdlDiagram[] = [
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
  charts,
].flatMap((m) => Object.values(m as Record<string, unknown>).filter(図か));

/** 受け入れた図の群。 理由は群ごとに書く = 1 枚ずつ書くと同じ文が 20 行並ぶ。 */
interface 受け入れた群 {
  /** 何でまとまっているか */
  readonly 群: string;
  /** なぜ注意が出続けてよいか */
  readonly 理由: string;
  /** その群に属する図の id */
  readonly 図: readonly string[];
}

/**
 * 受け入れた図。 **実物から作らず手で書く** (#1740 の close comment が行き先の SSOT)。
 *
 * 21 枚目が出たらここへ足すか、図を直すかを決める。 足す時は理由も書く。
 */
const 受け入れた一覧: readonly 受け入れた群[] = [
  {
    群: "帯 1 本に 3 段を積む場面の図",
    理由:
      "同じ組み方の図が 30 枚あり、高さ 20-80 world の差だけで境の内 25 枚と外 5 枚に割れている。 " +
      "5 枚だけ直すと割れ方が高さの偶然のまま残る",
    図: [
      "scene-banking-flow",
      "scene-ec-order",
      "scene-stock-trading",
      "scene-token-deploy",
      "scene-web-infra",
    ],
  },
  {
    群: "帯を横に並べる図",
    理由:
      "幅を決めているのは辺の名札で、短くすれば境の内側に入る (実測 11.7px → 12.6px)。 " +
      "長い名札を見せることも見本帳の役割の 1 つなので短くしない",
    図: [
      "infra-demo",
      "interactive-kpi-dashboard",
      "interactive-oauth-flow",
      "interactive-year-roadmap",
      "pattern-passthrough",
      "sm2-demo",
      "注文の状態",
      "認証-fsm-dsl",
    ],
  },
  {
    群: "縦にも横にも大きい図",
    理由:
      "段を減らすか横に並べ替えれば縮むが、どちらも図の意味が変わる。 " +
      "拡大表示の倍率を上げれば読める",
    図: [
      "class-demo",
      "fsm-demo",
      "interactive-exemplar-payment-flow",
      "interactive-price-candlestick",
      "多対多が-2-組-8-表-8-関係",
    ],
  },
  {
    群: "境の半分以下まで縮む図",
    理由:
      "12 箱規模の関係図で、骨格を変えても境に届かない見込み (収めると 4.8-5.8px)。 " +
      "大きい図が書けること自体が見本の中身",
    図: ["class-complex-demo", "er-complex-demo"],
  },
];

/** 一覧に載っている図の id (並べ替え済) */
const 受け入れた図 = [...受け入れた一覧.flatMap((g) => g.図)].sort();

/** 実際に注意が出た図の id (並べ替え済、重複を除く) */
const 注意が出た図 = [
  ...new Set(
    visualValidateAll(全図).reports.flatMap((r) =>
      r.violations.filter((v) => v.axis === "responsive-viewport").map(() => r.diagramId),
    ),
  ),
].sort();

/** 見本帳に実在する図の id */
const 実在する図 = new Set(全図.map((d) => d.id));

describe("読みにくさを受け入れた図の一覧 (#1747)", () => {
  it("見本帳の図を 1 枚以上集められている (空振り防止)", () => {
    expect(全図.length, "見本帳の図を 1 枚も集められていない (検査が空振りしている)").toBeGreaterThan(
      0,
    );
  });

  it("一覧が空でなく、群の 4 項目が全て埋まっている", () => {
    expect(受け入れた一覧.length, "群が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    for (const g of 受け入れた一覧) {
      expect(g.群.trim(), "群の名前が空").not.toBe("");
      expect(g.理由.trim(), `${g.群} の理由が空`).not.toBe("");
      expect(g.図.length, `${g.群} に図が 1 枚も無い`).toBeGreaterThan(0);
    }
  });

  it("一覧に同じ図が 2 度出てこない", () => {
    const 重複 = 受け入れた図.filter((id, i) => i > 0 && 受け入れた図[i - 1] === id);
    expect(重複, "一覧に同じ図が 2 度出ている").toEqual([]);
  });

  it("一覧の名前が全て見本帳に実在する", () => {
    /*
     * 綴りを間違えると、その名前は永久に注意の集合と一致しない。 下の突き合わせでも落ちるが、
     * 「綴り間違い」 と「図が境をまたいだ」 が同じ文面になるため、先にここで分ける。
     */
    const 実在しない = 受け入れた図.filter((id) => !実在する図.has(id));
    expect(実在しない, `一覧に見本帳に無い名前がある (図 ${実在する図.size} 枚を走査)`).toEqual([]);
  });

  it("注意が 1 件以上出ている (空振り防止)", () => {
    // 0 件だと下の突き合わせが「一覧を空にすれば通る」 形になる
    expect(注意が出た図.length, "responsive-viewport の注意が 1 件も無い (検査が空振りしている)").toBeGreaterThan(
      0,
    );
  });

  it("一覧に無い図が注意に出ていない", () => {
    const 一覧に無い = 注意が出た図.filter((id) => !受け入れた図.includes(id));
    expect(
      一覧に無い,
      "受け入れていない図が注意に出た。 一覧へ理由付きで足すか、図を直すかを決める",
    ).toEqual([]);
  });

  it("注意に出ない図が一覧に残っていない", () => {
    const 出ていない = 受け入れた図.filter((id) => !注意が出た図.includes(id));
    expect(出ていない, "境の内側に入った図が一覧に残っている。 一覧から外す").toEqual([]);
  });

  it("突き合わせが両方向とも差を見つけられる (植え込み対照)", () => {
    /*
     * 上の 2 件はどちらも 0 件を期待する。 探し方が何も見つけない形だと永久に通るため、
     * 本番と同じ探し方に **一方だけ欠けた入力** を通して 1 件見つかることを確かめる。
     */
    const 片方欠け = 受け入れた図.slice(1);
    const 一覧に無い = 注意が出た図.filter((id) => !片方欠け.includes(id));
    expect(一覧に無い, "一覧から 1 件外しても差が出ない (突き合わせが効いていない)").toEqual([
      受け入れた図[0]!,
    ]);

    const 余分に持つ = [...受け入れた図, "実在しない図-植え込み"];
    const 出ていない = 余分に持つ.filter((id) => !注意が出た図.includes(id));
    expect(出ていない, "一覧に余分な名前を足しても差が出ない (突き合わせが効いていない)").toEqual([
      "実在しない図-植え込み",
    ]);
  });
});
