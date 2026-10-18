/** カタログのひな形と、その識別子の対応。 画面の検査がひな形を総当たりする時に読む。 */
import type { CdlDiagram } from "@cardenelabs/cdl";
import {
  presetSwimlane,
  presetFlow,
  presetDeliverySequence,
  presetTopology,
  presetDeliveryComponents,
  presetDeliveryRelations,
  presetStateMachine,
  presetInfrastructure,
  presetDeliveryClasses,
  presetTree,
  presetUserJourney,
  presetMindMap,
  presetFunnel,
  presetQuadrant,
  presetChartPie,
  presetChartLine,
  presetGantt,
  presetDeliveryFlow,
  presetDeliveryStages,
  presetDeliveryMetro,
  presetDeliveryTimeline,
  presetNetwork,
  presetStateMachine2,
} from "../src/topics/catalog/presets.cdl";

export interface PresetMetadata {
  /** カタログの名前の表を引く鍵を導く識別子。 */
  id: string;
  diagram: CdlDiagram;
}

/** `presetSwimlane` のようなカタログの名前の鍵を導く。 */
export function presetCatalogKey(preset: PresetMetadata): string {
  return `preset${preset.id.charAt(0).toUpperCase()}${preset.id.slice(1)}`;
}

export const PRESETS: PresetMetadata[] = [
  { id: "swimlane", diagram: presetSwimlane },
  { id: "flow", diagram: presetFlow },
  { id: "deliverySequence", diagram: presetDeliverySequence },
  { id: "topology", diagram: presetTopology },
  { id: "deliveryComponents", diagram: presetDeliveryComponents },
  { id: "deliveryRelations", diagram: presetDeliveryRelations },
  { id: "stateMachine", diagram: presetStateMachine },
  { id: "infrastructure", diagram: presetInfrastructure },
  { id: "deliveryClasses", diagram: presetDeliveryClasses },
  { id: "tree", diagram: presetTree },
  { id: "userJourney", diagram: presetUserJourney },
  { id: "mindMap", diagram: presetMindMap },
  { id: "funnel", diagram: presetFunnel },
  { id: "quadrant", diagram: presetQuadrant },
  { id: "chartPie", diagram: presetChartPie },
  { id: "chartLine", diagram: presetChartLine },
  { id: "gantt", diagram: presetGantt },
  { id: "deliveryFlow", diagram: presetDeliveryFlow },
  { id: "deliveryStages", diagram: presetDeliveryStages },
  { id: "deliveryMetro", diagram: presetDeliveryMetro },
  { id: "deliveryTimeline", diagram: presetDeliveryTimeline },
  { id: "network", diagram: presetNetwork },
  { id: "stateMachine2", diagram: presetStateMachine2 },
];
