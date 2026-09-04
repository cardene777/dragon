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
  { id: "swimlane", slug: "swimlane", eyebrow: "SWIMLANE / LAYOUT", subtitle: "3 lane 自動配置。 laneId(label) で slug 参照、 lane.x を auto-layout。", tags: ["3 lane", "auto layout"], diagram: presetSwimlane },
  { id: "flow", slug: "flow", eyebrow: "FLOW / SEQUENCE", subtitle: "1 lane sequence。 前 step → 次 step 自動 edge、 縦 stack。", tags: ["1 lane", "sequential"], diagram: presetFlow },
  { id: "sequence", slug: "sequence", eyebrow: "SEQUENCE / UML", subtitle: "actor 列 × 時系列 row。 UML sequence diagram 風、 return 動作あり。", tags: ["actor", "UML"], diagram: presetSequence },
  { id: "topology", slug: "topology", eyebrow: "TOPOLOGY / DEPLOY", subtitle: "group + container 配置。 構成図 / deployment diagram 風。", tags: ["group", "container"], diagram: presetTopology },
  { id: "er", slug: "er", eyebrow: "ER / DB SCHEMA", subtitle: "entity + cardinality。 ER 図 / DB schema 風、 relation 表現。", tags: ["entity", "relation"], diagram: presetEr },
  { id: "erComplex", slug: "er-complex", eyebrow: "ER / DB SCHEMA", subtitle: "12 表 × 14 関係。 多対多、自己参照、必須・任意を含む商取引の構造。", tags: ["12 tables", "many-to-many"], diagram: presetErComplex },
  { id: "stateMachine", slug: "state-machine", eyebrow: "STATE / FSM", subtitle: "state + transition trigger。 FSM / workflow 図風。", tags: ["state", "transition"], diagram: presetStateMachine },
  { id: "infrastructure", slug: "infrastructure", eyebrow: "INFRA / ARCHITECTURE", subtitle: "SaaS architecture、 web + api + db + cache の tier 構成。", tags: ["saas", "arch"], diagram: presetInfrastructure },
  { id: "classDiagram", slug: "class", eyebrow: "CLASS / UML", subtitle: "class + attribute + relation。 UML クラス図風、 aggregates / extends。", tags: ["class", "UML"], diagram: presetClassDiagram },
  { id: "classComplex", slug: "class-complex", eyebrow: "CLASS / UML", subtitle: "12 class × 14 関係。 抽象・実装・組み立てと 6 種の関係を含む支払いの仕組み。", tags: ["12 classes", "6 relations"], diagram: presetClassComplex },
  { id: "tree", slug: "tree", eyebrow: "TREE / ORG CHART", subtitle: "組織図 / hierarchy tree。 root → branch 縦展開。", tags: ["hierarchy", "org"], diagram: presetTree },
  { id: "userJourney", slug: "user-journey", eyebrow: "USER JOURNEY", subtitle: "Signup / Onboarding 等の step 別 emotion / touchpoint。", tags: ["ux", "journey"], diagram: presetUserJourney },
  { id: "mindMap", slug: "mind", eyebrow: "MIND MAP / IDEA", subtitle: "root + branch 放射。 idea / brain storm 図風。", tags: ["mind map", "brain storm"], diagram: presetMindMap },
  { id: "funnel", slug: "funnel", eyebrow: "FUNNEL / CONVERSION", subtitle: "Visit → Signup → Purchase の conversion funnel。", tags: ["metric", "conversion"], diagram: presetFunnel },
  { id: "quadrant", slug: "quadrant", eyebrow: "QUADRANT / MATRIX", subtitle: "2x2 マトリクス、 impact vs effort 型の decision matrix。", tags: ["matrix", "2x2"], diagram: presetQuadrant },
  { id: "chartPie", slug: "chart-pie", eyebrow: "CHART / PIE", subtitle: "pie chart、 category 比率の可視化。", tags: ["chart", "pie"], diagram: presetChartPie },
  { id: "chartLine", slug: "chart-line", eyebrow: "CHART / LINE", subtitle: "line chart、 時系列 metric の trend 可視化。", tags: ["chart", "line"], diagram: presetChartLine },
  { id: "gantt", slug: "gantt", eyebrow: "GANTT / TIMELINE", subtitle: "Release timeline、 task 別 duration bar。", tags: ["timeline", "gantt"], diagram: presetGantt },
  { id: "flowchart", slug: "flowchart", eyebrow: "FLOWCHART / DECISION", subtitle: "2 lane 承認フロー。 approval / rejection 分岐、 decision diamond。", tags: ["approval", "decision"], diagram: presetFlowchart },
  { id: "network", slug: "network", eyebrow: "NETWORK / TOPOLOGY", subtitle: "Office NW topology、 firewall / switch / server segment。", tags: ["network", "nw"], diagram: presetNetwork },
  { id: "stateMachine2", slug: "state-machine-2", eyebrow: "STATE / FSM 拡張", subtitle: "拡張 FSM (nested state + action + entry/exit)。", tags: ["fsm", "nested"], diagram: presetStateMachine2 },
];
