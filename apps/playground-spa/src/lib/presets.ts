/**
 * 19 preset metadata + CdlDiagram export。
 * SPA なので client/server 分割不要、 1 file で完結。
 *
 * クラス図と ER 図の複雑な版は、ひな形を別に持たない (#1960)。 カタログでは元の見本の中の
 * パターン「複雑」 として切り替える。
 */
import type { CdlDiagram } from "@cardenelabs/cdl";
import { itemName, type Locale } from "./i18n";
import {
  presetSwimlane,
  presetFlow,
  presetSequence,
  presetTopology,
  presetEr,
  presetStateMachine,
  presetInfrastructure,
  presetClassDiagram,
  presetTree,
  presetUserJourney,
  presetMindMap,
  presetFunnel,
  presetQuadrant,
  presetChartPie,
  presetChartLine,
  presetGantt,
  presetFlowchart,
  presetNetwork,
  presetStateMachine2,
} from "@/topics/catalog/presets.cdl";

/**
 * preset の metadata。
 *
 * **画面に出す名前は持たない** (#1047)。 以前は `title` を持ち、`stateMachine2` の
 * ような識別子風の文字列がそのまま見出しに出ていた。 表示名は `presetName()` が
 * catalog と同じ名前の表から引く。
 */
export interface PresetMetadata {
  /** 図を指す識別子。 catalog の名前の表を引く鍵を導く元にもなる。 */
  id: string;
  /** URL に出る識別子。 `id` とは形が違う (`stateMachine` に対して `state-machine`)。 */
  slug: string;
  /**
   * 名前の上に出る分類名。 `<系統> / <用途>` の形で書く (#1783)。
   *
   * 名前のすぐ上に出るため、名前や札の言い換えにすると同じことを 2 度読ませる。
   * その図がどの系統に属し何に使うものかを、名前とも札とも違う語で書く。
   */
  eyebrow: string;
  /**
   * 英語で開いた時の分類名 ・ 説明 ・ 札 (#2455)。
   *
   * **日本語の側を削って短くしない**。 英語の画面にも同じ情報量を出す。
   * 3 つとも必須にしてあるので、見本を足した時に書き忘れると型検査が落ちる。
   */
  eyebrowEn: string;
  subtitle: string;
  subtitleEn: string;
  tags: string[];
  tagsEn: string[];
  diagram: CdlDiagram;
}

/**
 * preset が catalog の名前の表 (`ITEM_NAME_JA` / `ITEM_NAME_EN`) を引く時の鍵 (#1047)。
 *
 * catalog 側は `presetSwimlane` のような export 名で引く。 preset 側の `id` は
 * `swimlane` なので、頭を大きくして `preset` を前に付けると一致する。
 *
 * **一致は機械で見る**。 導く形にすると `id` の付け方が変わった時に静かに外れるため、
 * 全 preset の鍵が両方の表にあることを `presets.test.ts` が確かめる。
 */
export function presetCatalogKey(preset: PresetMetadata): string {
  return `preset${preset.id.charAt(0).toUpperCase()}${preset.id.slice(1)}`;
}

/** 画面に出す preset の名前。 言語に応じて catalog と同じ名前を返す。 */
export function presetName(preset: PresetMetadata, locale: Locale): string {
  return itemName(presetCatalogKey(preset), locale);
}

/** 名前の上に出る分類名 (#2455) */
export function presetEyebrow(preset: PresetMetadata, locale: Locale): string {
  return locale === "ja" ? preset.eyebrow : preset.eyebrowEn;
}

/** 名前の下に出る説明 (#2455) */
export function presetSubtitle(preset: PresetMetadata, locale: Locale): string {
  return locale === "ja" ? preset.subtitle : preset.subtitleEn;
}

/** 説明の下に並ぶ札 (#2455) */
export function presetTags(preset: PresetMetadata, locale: Locale): string[] {
  return locale === "ja" ? preset.tags : preset.tagsEn;
}

export const PRESETS: PresetMetadata[] = [
  { id: "swimlane", slug: "swimlane", eyebrow: "流れの図 / 担当の切り分け", eyebrowEn: "Flow diagram / splitting by owner", subtitle: "3 つの縦列で呼び出す側・処理する側・知らせる側を分け、依頼が役割をまたいで進む様子を追う図。", subtitleEn: "Three lanes split the caller, the worker and the notifier, following one request as it crosses roles.", tags: ["縦列", "役割の分担"], tagsEn: ["Lanes", "Split by role"], diagram: presetSwimlane },
  { id: "flow", slug: "flow", eyebrow: "道筋の図 / 順を追う", eyebrowEn: "Path diagram / following the order", subtitle: "ログインの要求が受付の窓口・認証・利用者の表の順に進む様子を、左から右への 1 本の流れで示す図。", subtitleEn: "A single left-to-right line showing a login request move through the front desk, authentication and the user table.", tags: ["一本の流れ", "左から右"], tagsEn: ["One line", "Left to right"], diagram: presetFlow },
  { id: "sequence", slug: "sequence", eyebrow: "やり取りの図 / 呼び出しと返事", eyebrowEn: "Exchange diagram / calls and replies", subtitle: "注文から発送までの呼び出しと返事を、登場する仕組みごとの縦の時間軸に並べた UML のシーケンス図。", subtitleEn: "A UML sequence diagram laying the calls and replies from order to shipment along one vertical timeline per participant.", tags: ["時間軸", "UML"], tagsEn: ["Timeline", "UML"], diagram: presetSequence },
  { id: "topology", slug: "topology", eyebrow: "配置の図 / どこで動くか", eyebrowEn: "Placement diagram / where things run", subtitle: "利用者の端末とクラウドを区画に分け、負荷分散・コンテナ・データベースを接続でつないだ構成図。", subtitleEn: "A layout that splits the user's device from the cloud and wires the load balancer, containers and database together.", tags: ["区画", "接続"], tagsEn: ["Zones", "Links"], diagram: presetTopology },
  { id: "er", slug: "er", eyebrow: "構造の図 / データ設計", eyebrowEn: "Structure diagram / data design", subtitle: "3 表 × 3 関係。 主キーと外部キー、識別する関係としない関係、自己参照を示す ER 図。", subtitleEn: "Three tables and three relationships. An ER diagram showing primary and foreign keys, identifying and non-identifying relationships, and a self reference.", tags: ["表", "関係"], tagsEn: ["Tables", "Relationships"], diagram: presetEr },
  { id: "stateMachine", slug: "state-machine", eyebrow: "ふるまいの図 / 切り替わり", eyebrowEn: "Behavior diagram / transitions", subtitle: "注文が下書きから受付・支払を経て終わるか、受付の後に取り消されるかを、状態と遷移の条件で示す状態遷移図。", subtitleEn: "A state diagram showing an order run from draft through accepted and paid to done, or be cancelled after acceptance, with the condition on each transition.", tags: ["状態", "遷移"], tagsEn: ["States", "Transitions"], diagram: presetStateMachine },
  { id: "infrastructure", slug: "infrastructure", eyebrow: "積み上げの図 / 全体の見取り", eyebrowEn: "Stack diagram / the whole picture", subtitle: "利用者から配信・負荷分散・アプリを経て、データベースとキャッシュに届くまでの階層構成図。", subtitleEn: "A layered diagram from the user through delivery, load balancing and the application down to the database and cache.", tags: ["クラウド", "階層構成"], tagsEn: ["Cloud", "Layers"], diagram: presetInfrastructure },
  { id: "classDiagram", slug: "class", eyebrow: "構造の図 / 設計の型", eyebrowEn: "Structure diagram / design shapes", subtitle: "7 クラス × 6 関係。 継承・実装・集約・コンポジション・関連・依存の 6 種を 1 枚で示す UML クラス図。", subtitleEn: "Seven classes and six relationships. A UML class diagram showing inheritance, realization, aggregation, composition, association and dependency on one sheet.", tags: ["クラス", "UML"], tagsEn: ["Classes", "UML"], diagram: presetClassDiagram },
  { id: "tree", slug: "tree", eyebrow: "親子の図 / 枝分かれ", eyebrowEn: "Parent and child diagram / branching", subtitle: "社長の下に技術と財務の責任者が並び、技術の下に開発と運用の部門が続く組織図。", subtitleEn: "An org chart with the technology and finance leads under the president, and the development and operations teams under technology.", tags: ["階層", "組織図"], tagsEn: ["Hierarchy", "Org chart"], diagram: presetTree },
  { id: "userJourney", slug: "user-journey", eyebrow: "満足度の図 / 段階ごとの手ごたえ", eyebrowEn: "Satisfaction diagram / how each stage feels", subtitle: "サイトを訪れてから登録を終えるまでの各段階で、利用者の気持ちと接点が変わる様子を示す体験の図。", subtitleEn: "A journey diagram showing how the user's feeling and touchpoints shift at each stage, from landing on the site to finishing sign-up.", tags: ["体験", "気持ちの変化"], tagsEn: ["Journey", "Shifts in feeling"], diagram: presetUserJourney },
  { id: "mindMap", slug: "mind", eyebrow: "思いつきの図 / 考えの棚卸し", eyebrowEn: "Idea diagram / taking stock of thoughts", subtitle: "中心の主題から機能・画面の設計・公開の枝を広げ、機能をさらに認証と課金に分ける発想の図。", subtitleEn: "A mind map spreading features, screen design and release out from a central topic, then splitting features into authentication and billing.", tags: ["放射", "発想"], tagsEn: ["Radial", "Ideation"], diagram: presetMindMap },
  { id: "funnel", slug: "funnel", eyebrow: "数の図 / 絞り込み", eyebrowEn: "Number diagram / narrowing down", subtitle: "訪問から登録・試用・有料の契約へ段階が進むにつれて、人数が絞られていく様子を示す図。", subtitleEn: "A funnel showing how the count narrows as visitors move through sign-up, trial and a paid plan.", tags: ["段階", "離脱"], tagsEn: ["Stages", "Drop-off"], diagram: presetFunnel },
  { id: "quadrant", slug: "quadrant", eyebrow: "比較の図 / 位置づけ", eyebrowEn: "Comparison diagram / positioning", subtitle: "労力と価値の 2 軸で項目を 4 つの枠に振り分け、どこから手を付けるかを決める優先度の図。", subtitleEn: "A priority chart sorting items into four boxes on the effort and value axes, to decide where to start.", tags: ["4 象限", "優先度"], tagsEn: ["Four quadrants", "Priority"], diagram: presetQuadrant },
  { id: "chartPie", slug: "chart-pie", eyebrow: "数の図 / 内訳", eyebrowEn: "Number diagram / breakdown", subtitle: "利用の経路ごとの内訳を、全体に対する割合で示す円グラフ。", subtitleEn: "A pie chart showing the breakdown by channel as a share of the whole.", tags: ["グラフ", "割合"], tagsEn: ["Chart", "Share"], diagram: presetChartPie },
  { id: "chartLine", slug: "chart-line", eyebrow: "数の図 / 上がり下がり", eyebrowEn: "Number diagram / ups and downs", subtitle: "月ごとの計画と実績を 1 本の折れ線で比べ、どの月で計画を上回ったかを示す折れ線グラフ。", subtitleEn: "A line chart comparing plan and actual month by month, showing which months came in above plan.", tags: ["グラフ", "推移"], tagsEn: ["Chart", "Trend"], diagram: presetChartLine },
  { id: "gantt", slug: "gantt", eyebrow: "時間の図 / 工程の割り当て", eyebrowEn: "Time diagram / assigning the work", subtitle: "設計・実装・検証・公開の工程を期ごとの横棒で並べ、前の工程が終わってから次が始まる関係を示す工程表。", subtitleEn: "A schedule laying design, build, verification and release out as bars per period, showing that each stage starts once the one before it ends.", tags: ["工程", "期間"], tagsEn: ["Stages", "Duration"], diagram: presetGantt },
  { id: "flowchart", slug: "flowchart", eyebrow: "手順の図 / 分かれ道", eyebrowEn: "Procedure diagram / forks", subtitle: "2 つの縦列で申請者と承認者を分け、承認されるか差し戻されるかに分かれる申請のフローチャート。", subtitleEn: "A request flowchart with two lanes for the requester and the approver, forking into approved or sent back.", tags: ["承認", "分岐"], tagsEn: ["Approval", "Branching"], diagram: presetFlowchart },
  { id: "network", slug: "network", eyebrow: "つながりの図 / 通り道", eyebrowEn: "Connection diagram / the route", subtitle: "ファイアウォールからスイッチを経て、アプリとデータベースのサーバーにつながる社内ネットワークの接続図。", subtitleEn: "An internal network map running from the firewall through the switch to the application and database servers.", tags: ["ネットワーク", "接続"], tagsEn: ["Network", "Links"], diagram: presetNetwork },
  { id: "stateMachine2", slug: "state-machine-2", eyebrow: "ふるまいの図 / 入れ子", eyebrowEn: "Behavior diagram / nesting", subtitle: "状態の中に状態を入れ子にし、入る時と出る時の処理を添えた、階層を持つ状態遷移図。", subtitleEn: "A hierarchical state diagram nesting states inside states, with the entry and exit actions attached.", tags: ["入れ子の状態", "入る時と出る時の処理"], tagsEn: ["Nested states", "Entry and exit actions"], diagram: presetStateMachine2 },
];
