/**
 * 読みにくさを受け入れた図の一覧と、見本帳の全図 (#1747 / #1751)。
 *
 * 2 つの検査が同じ一覧を読む。 **同じ名前を 2 つの file に書かないため** = 拡大表示と
 * 一覧の枠で 12 枚が重なっており、別々に持つと片方だけ直って食い違う。
 *
 * ## 器は 2 つある
 *
 * 見本帳は同じ図を 2 通りの見せ方で出す。 器が違えば読めるかどうかも変わる。
 *
 * | 器 | 寸法 | 下限を割る枚数 |
 * |---|---|---|
 * | 拡大表示 | 1150 × 630px | 20 |
 * | 一覧に並べた枠 | 幅 874px (高さの上限なし) | 55 |
 *
 * 重なりは 12 枚。 拡大だけで割る 8 枚は縦に長い図で、一覧は縦を巻き取るので割らない。
 * 一覧だけで割る 43 枚は横に長い図で、拡大表示のほうが器が広いので割らない。
 *
 * ## 図ごとに器を書く
 *
 * 群ごとにまとめられない = 同じ群でも器によって割れ方が違う (`縦にも横にも大きい図` の
 * 5 枚は、拡大では 5 枚とも割るが一覧では 2 枚しか割らない)。
 *
 * ## 一覧は手で書く
 *
 * 実際の集合から作ると、何を書いても通る検査になる。 図を足して境を割ったら落ちるのが
 * この一覧の役目で、落ちた時に「受け入れる (理由付きで足す)」 か「図を直す」 かを決める。
 */
import type { CdlDiagram } from "@cardenelabs/cdl";

import * as cookbook from "../../../../apps/playground-spa/src/topics/catalog/cookbook.cdl";
import * as patterns from "../../../../apps/playground-spa/src/topics/catalog/patterns.cdl";
import * as presets from "../../../../apps/playground-spa/src/topics/catalog/presets.cdl";
import * as primitives from "../../../../apps/playground-spa/src/topics/catalog/primitives.cdl";
import * as primitivesExtra from "../../../../apps/playground-spa/src/topics/catalog/primitives-extra.cdl";
import * as textDsl from "../../../../apps/playground-spa/src/topics/catalog/text-dsl.cdl";
import * as animation from "../../../../apps/playground-spa/src/topics/catalog/animation.cdl";
import * as styles from "../../../../apps/playground-spa/src/topics/catalog/styles.cdl";
import * as interactive from "../../../../apps/playground-spa/src/topics/catalog/interactive.cdl";
import * as ethereum from "../../../../apps/playground-spa/src/topics/catalog/ethereum.cdl";
import * as parts from "../../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import * as charts from "../../../../apps/playground-spa/src/topics/catalog/charts.cdl";

const 図か = (v: unknown): v is CdlDiagram =>
  typeof v === "object" &&
  v !== null &&
  Array.isArray((v as CdlDiagram).nodes) &&
  Array.isArray((v as CdlDiagram).lanes);

/** 見本帳の全図。 枚数は増えるので書かない。 */
export const 全図: CdlDiagram[] = [
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

/**
 * 画面の実測に使う基準の画面 (px)。 `#1740` 以降の実測は全てこの大きさで取っている
 * (下の `一覧の器` の 874px も同じ画面で測った)。
 */
export const 基準の画面 = { width: 1440, height: 900 } as const;

/**
 * 一覧に並べた枠の内寸 (px)。 `.catalog-preview-stage` の 914px から左右の余白 20px を
 * 引いた実測値。 **高さは持たない** = 縦は巻き取るので上限が無く、大きな数で代用すると
 * 「上限が無い」 と「とても高い」 が同じ値になる。
 */
export const 一覧の器 = { width: 874 } as const;

/** どちらの器で受け入れたか */
export type 器 = "拡大" | "一覧";

/** 受け入れた図 1 枚。 器は図ごとに手で書く。 */
export interface 受け入れた図 {
  /** 見本帳の図の id */
  readonly id: string;
  /** その図が下限を割る器。 割らない器は書かない */
  readonly 器: readonly 器[];
}

/** 受け入れた図の群。 理由は群ごとに書く = 1 枚ずつ書くと同じ文が 63 行並ぶ。 */
export interface 受け入れた群 {
  /** 何でまとまっているか */
  readonly 群: string;
  /** なぜ注意が出続けてよいか */
  readonly 理由: string;
  /** その群に属する図 */
  readonly 図: readonly 受け入れた図[];
}

/**
 * 受け入れた図。 **実物から作らず手で書く** (#1740 の close comment が行き先の SSOT)。
 *
 * 新しく境を割る図が出たらここへ理由付きで足すか、図を直すかを決める。
 */
export const 受け入れた一覧: readonly 受け入れた群[] = [
  {
    群: "帯 1 本に 3 段を積む場面の図",
    理由:
      "同じ組み方の図が 30 枚あり、" +
      "高さ 20-80 world の差だけで境の内 25 枚と外 5 枚に割れている。" +
      " 5 枚だけ直すと割れ方が高さの偶然のまま残る",
    図: [
      { id: "scene-banking-flow", 器: ["拡大"] },
      { id: "scene-ec-order", 器: ["拡大"] },
      { id: "scene-stock-trading", 器: ["拡大"] },
      { id: "scene-token-deploy", 器: ["拡大"] },
      { id: "scene-web-infra", 器: ["拡大"] },
    ],
  },
  {
    群: "帯を横に並べる図",
    理由:
      "幅を決めているのは辺の名札で、短くすれば境の内側に入る (実測 11.7px から " +
      "12.6px)。 長い名札を見せることも見本帳の役割の 1 つなので短くしない",
    図: [
      { id: "infra-demo", 器: ["拡大", "一覧"] },
      { id: "interactive-kpi-dashboard", 器: ["拡大", "一覧"] },
      { id: "interactive-oauth-flow", 器: ["拡大", "一覧"] },
      { id: "interactive-year-roadmap", 器: ["拡大", "一覧"] },
      { id: "pattern-passthrough", 器: ["拡大", "一覧"] },
      { id: "sm2-demo", 器: ["拡大", "一覧"] },
      { id: "注文の状態", 器: ["拡大", "一覧"] },
      { id: "認証の状態遷移", 器: ["拡大", "一覧"] },
    ],
  },
  {
    群: "縦にも横にも大きい図",
    理由:
      "段を減らすか横に並べ替えれば縮むが、" +
      "どちらも図の意味が変わる。 表示の倍率を上げれば読める",
    図: [
      { id: "class-demo", 器: ["拡大", "一覧"] },
      { id: "fsm-demo", 器: ["拡大"] },
      { id: "interactive-exemplar-payment-flow", 器: ["拡大", "一覧"] },
      { id: "interactive-price-candlestick", 器: ["拡大"] },
      { id: "多対多が-2-組-8-表-8-関係", 器: ["拡大"] },
    ],
  },
  {
    群: "境の半分以下まで縮む図",
    理由:
      "12 箱規模の関係図で、骨格を変えても境に届かない見込み (収めると " +
      "4.8-5.8px)。 大きい図が書けること自体が見本の中身",
    図: [
      { id: "class-complex-demo", 器: ["拡大", "一覧"] },
      { id: "er-complex-demo", 器: ["拡大", "一覧"] },
    ],
  },
  {
    群: "触れる部品を横に並べる対話の見本",
    理由:
      "入力欄 / つまみ / 目盛を 1 枚に並べて何が触れるかを見せる図で、" +
      "幅は並べた部品の数で決まる。 減らすと見本にならない",
    図: [
      { id: "interactive-alert-notification", 器: ["一覧"] },
      { id: "interactive-audio-player", 器: ["一覧"] },
      { id: "interactive-checkout-coupon-apply", 器: ["一覧"] },
      { id: "interactive-contribution-heatmap", 器: ["一覧"] },
      { id: "interactive-exam-grade", 器: ["一覧"] },
      { id: "interactive-exemplar-login-flow", 器: ["一覧"] },
      { id: "interactive-exemplar-notification-flow", 器: ["一覧"] },
      { id: "interactive-formula-text", 器: ["一覧"] },
      { id: "interactive-grid-matrix", 器: ["一覧"] },
      { id: "interactive-input-variety", 器: ["一覧"] },
      { id: "interactive-kpi-bullet", 器: ["一覧"] },
      { id: "interactive-login-otp-verify", 器: ["一覧"] },
      { id: "interactive-matrix-heatmap", 器: ["一覧"] },
      { id: "interactive-month-calendar", 器: ["一覧"] },
      { id: "interactive-nps-trend", 器: ["一覧"] },
      { id: "interactive-prod-log-tail", 器: ["一覧"] },
      { id: "interactive-saas-pricing-tier", 器: ["一覧"] },
      { id: "interactive-server-event-log", 器: ["一覧"] },
      { id: "interactive-startup-org", 器: ["一覧"] },
      { id: "interactive-stepper", 器: ["一覧"] },
      { id: "interactive-team-thread-summary", 器: ["一覧"] },
      { id: "interactive-timer-stopwatch", 器: ["一覧"] },
      { id: "interactive-traffic-sankey", 器: ["一覧"] },
      { id: "interactive-visual-bar", 器: ["一覧"] },
      { id: "interactive-visual-opacity", 器: ["一覧"] },
      { id: "interactive-xypad-nav", 器: ["一覧"] },
    ],
  },
  {
    群: "左から右へ段を並べる型の図",
    理由: "分岐 / 合流 / 巻き戻し の形そのものが中身で、段を折り返すと形が読めなくなる",
    図: [
      { id: "pattern-branch", 器: ["一覧"] },
      { id: "pattern-fan-in", 器: ["一覧"] },
      { id: "pattern-fan-out", 器: ["一覧"] },
      { id: "pattern-rollback", 器: ["一覧"] },
      { id: "pattern-schedule", 器: ["一覧"] },
      { id: "pattern-validate-process", 器: ["一覧"] },
    ],
  },
  {
    群: "処理の順を左から右に並べる場面と仕組みの図",
    理由: "幅は段の数で決まる。 段をまとめると、どこで何が起きるかの粒度が落ちる",
    図: [
      { id: "er-demo", 器: ["一覧"] },
      { id: "eth-block-production", 器: ["一覧"] },
      { id: "eth-erc4337-flow", 器: ["一覧"] },
      { id: "network-demo", 器: ["一覧"] },
      { id: "swim-demo", 器: ["一覧"] },
      { id: "同時に走らせる処理", 器: ["一覧"] },
      { id: "呼び出しと書き込みと出来事", 器: ["一覧"] },
    ],
  },
];

/** その器で受け入れた図の id (並べ替え済) */
export const 受け入れた図の名 = (器: 器): string[] =>
  受け入れた一覧
    .flatMap((g) => g.図)
    .filter((d) => d.器.includes(器))
    .map((d) => d.id)
    .sort();

/**
 * 一覧の台に描かれる高さ (px)。
 *
 * 台は幅に合わせて図を伸ばす (`w-full h-auto`、高さの頭打ちなし) ので、
 * 高さは縦横比で決まる。 画面の実測と一致する
 * (`parts-traffic-light-stack` の viewBox 305 × 800 は画面で 874 × 2292px)。
 */
export const 一覧で描かれる高さ = (viewBox: { w: number; h: number }): number =>
  (一覧の器.width * viewBox.h) / viewBox.w;

/**
 * 縦に長すぎるとみなす線 (px)。 **基準の画面の高さ**に引く (#1753)。
 *
 * ここより長い図は、どの位置まで巻き上げても 1 画面に入り切らない。
 *
 * 巻き上げずに見える高さ (実測 338px = 900 − 台の上端 562px) には引かない =
 * その線ではほぼ全枚数が引っかかる。 一覧は元々巻き上げて見る面で、
 * 1 画面に収まることを求めていない。
 */
export const 縦に長い線 = 基準の画面.height;

/** 縦に長いことを受け入れた図の群。 理由は群ごとに書く。 */
export interface 縦に長い群 {
  /** 何でまとまっているか */
  readonly 群: string;
  /** なぜ長いままでよいか */
  readonly 理由: string;
  /** その群に属する図の id */
  readonly 図: readonly string[];
}

/**
 * 一覧の台で `縦に長い線` を超えて描かれる図。 **実物から作らず手で書く**。
 *
 * 伸ばすのをやめる道 (台に伸びの上限を入れる / 高さの頭打ちを入れる) は採らなかった =
 * 444 枚中 238 枚の見え方が変わる一方、読み手には倍率の操作があって縮められる (#1749)。
 * 詳細は #1753 の判断の記録。
 */
export const 縦に長い一覧: readonly 縦に長い群[] = [
  {
    群: "帯 1 本に 3 段を積む場面の図",
    理由:
      "30 枚とも同じ組み方で、細長い viewBox を幅に合わせると 1.6-1.8 " +
      "倍に伸びる。 一部だけ直すと一族の中で組み方が割れる",
    図: [
      "scene-audit-chain",
      "scene-audit-flow",
      "scene-banking-flow",
      "scene-bitcoin-tx",
      "scene-checkout",
      "scene-compliance",
      "scene-consensus",
      "scene-crypto-transfer",
      "scene-defi-lending",
      "scene-devops",
      "scene-ec-order",
      "scene-edge-compute",
      "scene-factory-line",
      "scene-iot-onchain",
      "scene-legal-notarization",
      "scene-mobile-api",
      "scene-network-path",
      "scene-nft-marketplace",
      "scene-nft-mint",
      "scene-notification",
      "scene-payment-settlement",
      "scene-satellite-chain",
      "scene-stock-trading",
      "scene-support-flow",
      "scene-task-flow",
      "scene-token-bridge",
      "scene-token-deploy",
      "scene-trust-asset",
      "scene-version-deploy",
      "scene-web-infra",
    ],
  },
  {
    群: "部品を縦に積む見本",
    理由:
      "部品を上下に並べて見せる図で、幅が狭いぶん伸びが大きい (最大 2.87 倍)。" +
      " 横に並べ替えると何を積んでいるかが読めなくなる",
    図: [
      "parts-battery-level",
      "parts-bind-cascade-3",
      "parts-bind-split-fill",
      "parts-bookmark",
      "parts-rainbow-stack",
      "parts-rating-stars",
      "parts-stacked-layer",
      "parts-thermometer",
      "parts-traffic-light-stack",
    ],
  },
  {
    群: "記法の見本",
    理由:
      "書き方を見せる図で、段の数がそのまま記法の説明になっている。" +
      " 段を減らすと見本の中身が減る",
    図: [
      "c4-の系統図",
      "クラスの関係",
      "値どうしの関係を書く例",
      "多対多が-2-組-8-表-8-関係",
      "系の構成",
      "認証の流れ",
    ],
  },
  {
    群: "触れる部品を縦に積む対話の見本",
    理由: "触れる部品と、その結果を出す欄を縦に並べる。 横に並べると操作と結果の対応が読めなくなる",
    図: [
      "interactive-activity-polar",
      "interactive-array-signal",
      "interactive-price-candlestick",
      "interactive-reviewer-stack",
    ],
  },
  {
    群: "縦に大きい関係と流れの図",
    理由:
      "段を減らすか横に並べ替えれば縮むが、" +
      "どちらも図の意味が変わる。 大きい図が書けること自体が見本の中身",
    図: [
      "animation-rich-order-status-flow",
      "er-complex-demo",
      "flow-demo",
    ],
  },
];

/** 縦に長いことを受け入れた図の id (並べ替え済) */
export const 縦に長い図の名 = (): string[] => 縦に長い一覧.flatMap((g) => g.図).sort();
