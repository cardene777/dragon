import { layout, type CdlDiagram, type LaidDiagram } from "@cardenelabs/cdl";

/** カタログの字を比例・等幅のどちらで描いても収まる骨組みを1度だけ作る。 */
export function カタログの図を組む(diagram: CdlDiagram): LaidDiagram {
  if (diagram.textMetrics === "widest") return layout(diagram);
  return layout({ ...diagram, textMetrics: "widest" });
}
