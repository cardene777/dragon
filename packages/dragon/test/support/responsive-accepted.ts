/**
 * 読みにくさを受け入れた図の一覧と、カタログの全図 (#1747 / #1751)。
 *
 * 2 つの検査が同じ一覧を読む。 **同じ名前を 2 つの file に書かないため** = 拡大表示と
 * 一覧の枠で 12 枚が重なっており、別々に持つと片方だけ直って食い違う。
 *
 * ## 器は 2 つある
 *
 * カタログは同じ図を 2 通りの見せ方で出す。 器が違えば読めるかどうかも変わる。
 *
 * | 器 | 寸法 |
 * |---|---|
 * | 拡大表示 | 1150 × 630px |
 * | 一覧に並べた枠 | 幅 874px (高さの上限なし) |
 *
 * 拡大だけで割るのは縦に長い図で、一覧は縦を巻き取るので割らない。
 * 一覧だけで割るのは横に長い図で、拡大表示のほうが器が広いので割らない。
 * 両方で割る図もある。
 *
 * **枚数は書かない** = カタログの群を足すたびに動く (実数は下の `受け入れた一覧` が持つ)。
 *
 * ## 図ごとに器を書く
 *
 * 群ごとにまとめられない = 同じ群でも器によって割れ方が違う (`縦にも横にも大きい図` の
 * 5 枚は、拡大では 5 枚とも割るが一覧では 2 枚しか割らない)。
 *
 * ## 受け入れた一覧は手で書き、母集団は走査で作る
 *
 * **受け入れた一覧** を実際の集合から作ると、何を書いても通る検査になる。 図を足して境を
 * 割ったら落ちるのがこの一覧の役目で、落ちた時に「受け入れる (理由付きで足す)」 か
 * 「図を直す」 かを決める。
 *
 * **母集団 (`全図`)** は逆に走査で作る (#2004)。 手で並べると、群を足した時に追記を忘れても
 * 何も落ちず、検査が見ない群が黙って増える (実際に `parts-in-box.cdl.ts` の 9 枚が
 * 4 つの検査から漏れていた)。 守りたい集合と検査の母集団を一致させるのは
 * 検査の側の責務で、受け入れの判断とは向きが逆になる。
 */
import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * dir を走査する Vite の仕掛けの型。
 *
 * 本来は `vite/client` が持つが、この package からは `vite` を引けない (pnpm の厳密な解決で
 * 依存に無い package は見えない)。 使う形だけをここで書く。
 *
 * **呼び出しは `import.meta.glob(...)` の形のまま書く**。 括弧で包んだり変数に入れたりすると
 * Vite が走査の対象と見なさず、実行時に「関数が無い」 で落ちる。
 */
declare global {
  interface ImportMeta {
    glob: (pattern: string, options: { eager: true }) => Record<string, unknown>;
  }
}

/**
 * カタログの群を **dir の走査で集める** (#2004)。
 *
 * 以前は `import` を 1 群ずつ手で並べていた。 群を足した時に追記を忘れても何も落ちず、
 * 実際に `parts-in-box.cdl.ts` (#1973 で足した 9 枚) が抜けたまま残って、この一覧を読む
 * 4 つの検査が 1 度も見ていなかった。
 *
 * 走査した群が dir の実体と一致することは `test/catalog-population.test.ts` が名前で確かめる
 * (走査に変えただけでは、走査の書き方を間違えて 0 件になっても気付けない)。
 */
const 群ごと: Record<string, unknown> = import.meta.glob(
  "../../../../apps/playground-spa/src/topics/catalog/*.cdl.ts",
  { eager: true },
);

const 図か = (v: unknown): v is CdlDiagram =>
  typeof v === "object" &&
  v !== null &&
  Array.isArray((v as CdlDiagram).nodes) &&
  Array.isArray((v as CdlDiagram).lanes);

/**
 * 走査で見つけたカタログの群の名前 (`*.cdl.ts` の `*`、並べ替え済)。
 *
 * dir の実体と突き合わせるために出す。 図の中身ではなく **どの群を読んだか** を見る値で、
 * 図を 1 枚も持たない群があっても数に入る。
 */
export const カタログの群の名 = (): string[] =>
  Object.keys(群ごと)
    .map((p) => p.slice(p.lastIndexOf("/") + 1).replace(/\.cdl\.ts$/, ""))
    .sort();

/** カタログの全図。 枚数は増えるので書かない。 */
export const 全図: CdlDiagram[] = Object.keys(群ごと)
  .sort()
  .flatMap((k) => Object.values(群ごと[k] as Record<string, unknown>).filter(図か));

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
  /** カタログの図の id */
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
      "12.6px)。 長い名札を見せることもカタログの役割の 1 つなので短くしない",
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
    群: "12 箱を格子に置いた複雑な構成図 (#2139)",
    理由:
      "線を全て隣の枠へ引くため 5 列 4 段に置く (viewBox 3024x996、拡大で題が 8.4px / 一覧で 6.4px)。" +
      " 6 列 3 段の置き方 (3630x724) より縦横の比が小さい。 同じ段に空いた列を挟んで詰める置き方は" +
      "段の間隔の揃い (`row-gap-uniform`) に掛かる。 大きい構成図が書けること自体が見本の中身",
    図: [{ id: "infra-complex-demo", 器: ["拡大", "一覧"] }],
  },
  {
    群: "終わり方を 3 つ持つ複雑な状態遷移図 (#2163)",
    理由:
      "主な道を左の 1 列に置き、外れる道を右へ出して終わりの印まで並べる " +
      "(viewBox 2212x1488、拡大で題が 9.3px / 一覧で 8.7px)。 箱の幅 (`stateWidth`) を " +
      "320 / 280 / 240 と変えても大きさは 2212x1488 から動かない (実測)。 線を斜めに引けば " +
      "段は減るが、間の箱を貫いて重い指摘になる (実測 2 件)。 終わり方を列で分ける置き方自体が見本の中身",
    図: [{ id: "fsm-complex-demo", 器: ["拡大", "一覧"] }],
  },
  {
    群: "担当を 3 列に分けた複雑な流れ図 (#2143)",
    理由:
      "申請者 / 経理 / 上長 の 3 列に 8 箱を置く (viewBox 1768x972、一覧で題が 10.9px、拡大は下限に届く)。" +
      " 組み立て器は列の幅を 320 / 330 / 340 / 380 と変えても図の幅が 1768 から動かない (実測)。" +
      " 担当ごとの列で分けること自体が流れ図の見本の中身",
    図: [{ id: "flowchart-complex-demo", 器: ["一覧"] }],
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
      // 名札を書かない変種 (#1916)。 元の図と同じ組み立てで、幅も同じ
      { id: "interactive-formula-text-bare", 器: ["一覧"] },
      { id: "interactive-grid-matrix", 器: ["一覧"] },
      { id: "interactive-input-variety", 器: ["一覧"] },
      // 文字の入力を日時の入力に替えた変種 (#1969)。 元の図と同じ組み立てで、幅も同じ
      { id: "スライダ-複数選択-タブ-日時の-4-入力を並べる", 器: ["一覧"] },
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
      // C4 の 3 段 (全体の見取り図 / 動かす単位 / 部品) を横に並べる (#2135)。 縦列の幅は組み立て側が
      // 決めており、見本の側で縮めるには段を減らすしかない
      { id: "ネット注文の-c4-系統図", 器: ["一覧"] },
      { id: "swim-demo", 器: ["一覧"] },
      { id: "同時に走らせる処理", 器: ["一覧"] },
      { id: "呼び出しと書き込みと出来事", 器: ["一覧"] },
    ],
  },
  {
    群: "部品を箱に使う見本 (#2004 / #2010)",
    理由:
      "幅を決めているのは部品そのものの大きさで、部品を減らすか小さくするしか縮める道がない。" +
      " どちらも「部品を図の箱として使う」 という見本の中身を削る" +
      " (#2002 で縦の空きは詰めた。 残るのは部品の実寸)。" +
      " 矢印を引く見本は縦列 1 本に部品 1 つを置くため、部品を 2 つ置くと横に 2 本ぶん伸びる (#2010)。" +
      " 高さの違う部品どうしを繋ぐ見本も同じ理由で横に伸びる (#2012)。" +
      " 集める見本は部品 2 つの左右に箱を 1 つずつ置くため、縦列が 4 本になり" +
      " 拡大 の器でも境を割る (#2011)。" +
      " 部品を基準にして箱を置く見本 (#2039) はこの群に入らない = 部品 2 つの間に箱を 1 つ挟んで" +
      " 横に 3 つ並べても幅 1489 で、どちらの器でも境の内側に入る。" +
      " #2041 で格子の起点を直す前は基準の部品だけが下に落ち、その分の高さで幅も伸びていた" +
      " (実測 = 1649 × 684 が 1489 × 774 になり、一覧 の器での縮みが 0.530 倍から 0.587 倍に戻った)",
    図: [
      { id: "受注から在庫の上層へ-在庫の底層から出荷へ矢印を繋ぐ", 器: ["一覧"] },
      { id: "点検の結果を部品に送り-部品から保全へ知らせる", 器: ["一覧"] },
      { id: "製造ラインの設備-3-台と乾燥炉の温度-工場の回線を並べる", 器: ["拡大", "一覧"] },
      { id: "検査の結果を設備の稼働と炉の温度へ分けて送る", 器: ["一覧"] },
      { id: "成形機の稼働から塗装機の稼働へ-部品どうしを矢印で繋ぐ", 器: ["一覧"] },
      { id: "成形機の稼働から乾燥炉の温度へ-高さの違う部品どうしを矢印で繋ぐ", 器: ["一覧"] },
      { id: "成形機と塗装機の稼働を-どちらも記録へ集める", 器: ["拡大", "一覧"] },
    ],
  },
  {
    群: "部品を繋いで動かす見本 (#2125)",
    理由:
      "幅を決めているのは部品の実寸で、繋ぐ相手を減らすと「繋いだ先へ値が渡る」 という見本の中身が消える。" +
      " 部品 1 つが横 360-580 を占めるため、縦列 3 本に置くと 1900-2400 になる。" +
      " **拡大 の器では 5 枚とも境の内側に入る** (実測 = 軸 23 の指摘 0 件) = 割るのは幅 874 の 一覧 の器だけ。" +
      " 分ける形と集める形を 1 枚にまとめれば縦列は 4 本になり、拡大 の器でも割る" +
      " (実測 = 2634 × 780 で箱の題が 9.6px)。 2 枚に割ったのはそのため。" +
      " 部品の段のまま置く形と宿主の段で動かす形を並べる見本は縦列 2 本で、どちらの器でも境の内側に入る",
    図: [
      { id: "入ってくる量を溜めて送り出す", 器: ["一覧"] },
      { id: "在庫の上層へ積み-底層から出荷する", 器: ["一覧"] },
      { id: "検査の結果を-2-つの計器へ分けて送る", 器: ["一覧"] },
      { id: "2-つの計器の値をどちらも記録へ集める", 器: ["一覧"] },
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
 * 決めた当時の 444 枚中 238 枚の見え方が変わる一方、読み手には倍率の操作があって縮められる (#1749)。
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
      // 受け手 3 つの棒が発行と同じ高さまで伸びる形が図の中身 (#2157)。 3 つを縦に並べるので、
      // 入口を真ん中の段に置くと図が 3 段になる
      "parts-fanout-copy",
      // 上から下へ絞る形そのものが図の中身 (#2129)。 横に並べると「段ごとに狭くなる」 が消える
      "parts-funnel-3",
      // 3 つの出口へ同じ量ずつ配る形が図の中身 (#2157)。 複製器と同じ並べ方にして、棒の高さの
      // 違いだけで「分ける」 と「写す」 を見比べられるようにする
      "parts-load-balancer",
      // 入口 2 つを上下に置き、出口をその真ん中の段に置く (#2154)。 出口を入口と同じ段に置くと、
      // 描画側が同じ辺に入る 2 本の終点を離すため、真横の線が出口の手前で小さな段を作る
      "parts-merge-junction",
      "parts-rainbow-stack",
      "parts-rating-stars",
      // 合流点と同じ理由で、入口を 2 つの出口の真ん中の段に置く (#2154)。 繋いだ見本で出口と
      // 合流点の入口が同じ段に並び、部品どうしの矢印が真横に引ける
      "parts-split-router",
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
  {
    群: "部品を箱に使う見本 (#2004)",
    理由:
      "部品 1 つを箱として置く 4 枚は縦横がほぼ 1 対 1 (viewBox 514x552 / 351x400) で、" +
      "幅に合わせると縦も同じだけ伸びる。" +
      " 流れの途中に部品を置く 1 枚は箱の下に部品を置く形そのもので縦に長い",
    図: [
      "注文を受けてから出荷するまでの間に設備の稼働を置く",
      "部品の塗りの割合を-4-割で止める",
      "部品の塗りを赤の色番号にする",
      "部品を-0-6-倍に縮めて置く",
      "部品を箱に置き何も書き換えない",
    ],
  },
];

/** 縦に長いことを受け入れた図の id (並べ替え済) */
export const 縦に長い図の名 = (): string[] => 縦に長い一覧.flatMap((g) => g.図).sort();
