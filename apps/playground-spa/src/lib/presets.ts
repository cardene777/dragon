/**
 * 21 preset metadata + CdlDiagram export。
 * SPA なので client/server 分割不要、 1 file で完結。
 */
import type { CdlDiagram } from "@cardenelabs/cdl";
import { itemName, type Locale } from "./i18n";
import {
  presetSwimlane,
  presetFlow,
  presetSequence,
  presetTopology,
  presetEr,
  presetErComplex,
  presetStateMachine,
  presetInfrastructure,
  presetClassDiagram,
  presetClassComplex,
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
  eyebrow: string;
  subtitle: string;
  tags: string[];
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

export const PRESETS: PresetMetadata[] = [
  { id: "swimlane", slug: "swimlane", eyebrow: "SWIMLANE / LAYOUT", subtitle: "3 レーンで呼び出す側・処理する側・知らせる側を分け、依頼が役割をまたいで進む様子を追う図。", tags: ["レーン", "役割の分担"], diagram: presetSwimlane },
  { id: "flow", slug: "flow", eyebrow: "FLOW / SEQUENCE", subtitle: "ログインの要求が受付の窓口・認証・利用者の表の順に進む様子を、上から下への 1 本の流れで示す図。", tags: ["一本の流れ", "上から下"], diagram: presetFlow },
  { id: "sequence", slug: "sequence", eyebrow: "SEQUENCE / UML", subtitle: "注文から発送までの呼び出しと返事を、登場する仕組みごとの縦の時間軸に並べた UML のシーケンス図。", tags: ["時間軸", "UML"], diagram: presetSequence },
  { id: "topology", slug: "topology", eyebrow: "TOPOLOGY / DEPLOY", subtitle: "利用者の端末とクラウドを区画に分け、負荷分散・コンテナ・データベースを接続でつないだ構成図。", tags: ["区画", "接続"], diagram: presetTopology },
  { id: "er", slug: "er", eyebrow: "ER / DB SCHEMA", subtitle: "3 表 × 3 関係。 主キーと外部キー、識別する関係としない関係、自己参照を示す ER 図。", tags: ["表", "関係"], diagram: presetEr },
  { id: "erComplex", slug: "er-complex", eyebrow: "ER / DB SCHEMA", subtitle: "12 表 × 14 関係。 多対多、自己参照、必須・任意を含む商取引の構造。", tags: ["多対多", "必須と任意"], diagram: presetErComplex },
  { id: "stateMachine", slug: "state-machine", eyebrow: "STATE / FSM", subtitle: "注文が下書きから受付・支払を経て終わるか、受付の後に取り消されるかを、状態と遷移の条件で示す状態遷移図。", tags: ["状態", "遷移"], diagram: presetStateMachine },
  { id: "infrastructure", slug: "infrastructure", eyebrow: "INFRA / ARCHITECTURE", subtitle: "利用者から配信・負荷分散・アプリを経て、データベースとキャッシュに届くウェブサービスの階層構成図。", tags: ["クラウド", "階層構成"], diagram: presetInfrastructure },
  { id: "classDiagram", slug: "class", eyebrow: "CLASS / UML", subtitle: "7 クラス × 6 関係。 継承・実装・集約・コンポジション・関連・依存の 6 種を 1 枚で示す UML クラス図。", tags: ["クラス", "UML"], diagram: presetClassDiagram },
  { id: "classComplex", slug: "class-complex", eyebrow: "CLASS / UML", subtitle: "12 クラス × 14 関係。 抽象クラスとインターフェース、6 種の関係を含む決済の仕組み。", tags: ["抽象クラス", "インターフェース"], diagram: presetClassComplex },
  { id: "tree", slug: "tree", eyebrow: "TREE / ORG CHART", subtitle: "社長の下に技術と財務の責任者が並び、技術の下に開発と運用の部門が続く組織図。", tags: ["階層", "組織図"], diagram: presetTree },
  { id: "userJourney", slug: "user-journey", eyebrow: "USER JOURNEY", subtitle: "サイトを訪れてから登録を終えるまでの各段階で、利用者の気持ちと接点が変わる様子を示す体験の図。", tags: ["体験", "気持ちの変化"], diagram: presetUserJourney },
  { id: "mindMap", slug: "mind", eyebrow: "MIND MAP / IDEA", subtitle: "中心の主題から機能・画面の設計・公開の枝を広げ、機能をさらに認証と課金に分ける発想の図。", tags: ["放射", "発想"], diagram: presetMindMap },
  { id: "funnel", slug: "funnel", eyebrow: "FUNNEL / CONVERSION", subtitle: "訪問から登録・試用・有料の契約へ段階が進むにつれて、人数が絞られていく様子を示す図。", tags: ["段階", "離脱"], diagram: presetFunnel },
  { id: "quadrant", slug: "quadrant", eyebrow: "QUADRANT / MATRIX", subtitle: "労力と価値の 2 軸で項目を 4 つの枠に振り分け、どこから手を付けるかを決める優先度の図。", tags: ["4 象限", "優先度"], diagram: presetQuadrant },
  { id: "chartPie", slug: "chart-pie", eyebrow: "CHART / PIE", subtitle: "利用の経路ごとの内訳を、全体に対する割合で示す円グラフ。", tags: ["グラフ", "割合"], diagram: presetChartPie },
  { id: "chartLine", slug: "chart-line", eyebrow: "CHART / LINE", subtitle: "月ごとの計画と実績を 1 本の折れ線で比べ、どの月で計画を上回ったかを示す折れ線グラフ。", tags: ["グラフ", "推移"], diagram: presetChartLine },
  { id: "gantt", slug: "gantt", eyebrow: "GANTT / TIMELINE", subtitle: "設計・実装・検証・公開の工程を期ごとの横棒で並べ、前の工程が終わってから次が始まる関係を示す工程表。", tags: ["工程", "期間"], diagram: presetGantt },
  { id: "flowchart", slug: "flowchart", eyebrow: "FLOWCHART / DECISION", subtitle: "2 レーンで申請者と承認者を分け、承認されるか差し戻されるかに分かれる申請の流れ図。", tags: ["承認", "分岐"], diagram: presetFlowchart },
  { id: "network", slug: "network", eyebrow: "NETWORK / TOPOLOGY", subtitle: "ファイアウォールからスイッチを経て、アプリとデータベースのサーバーにつながる社内ネットワークの接続図。", tags: ["ネットワーク", "接続"], diagram: presetNetwork },
  { id: "stateMachine2", slug: "state-machine-2", eyebrow: "STATE / NESTED FSM", subtitle: "状態の中に状態を入れ子にし、入る時と出る時の処理を添えた、階層を持つ状態遷移図。", tags: ["入れ子の状態", "入る時と出る時の処理"], diagram: presetStateMachine2 },
];
