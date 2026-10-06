import { SWIMLANE_SHAPES, type DslSwimlaneShape } from "../keywords";
import type { DslActor, DslDocument, DslStep } from "../types";

const 泳法図の印 = ["decision", "mark-start", "mark-end"] as const;
type 泳法図の印 = (typeof 泳法図の印)[number];

export type 泳法図の印の描き方 = "描く" | "札" | "省く";

/** 段の箱で、分かれ道を普通の箱に添えて見分ける字。 */
export const 分かれ道の札 = "分かれ道";

/** 泳法図の形と印ごとに、描画側へ渡す形を決める表。 */
export const 泳法図の印の描き方: Record<
  DslSwimlaneShape,
  Record<泳法図の印, 泳法図の印の描き方>
> = {
  stages: {
    decision: "札",
    "mark-start": "省く",
    "mark-end": "省く",
  },
  metro: {
    decision: "描く",
    "mark-start": "描く",
    "mark-end": "描く",
  },
  timeline: {
    decision: "描く",
    "mark-start": "省く",
    "mark-end": "描く",
  },
};

/** 泳法図の3形で印をどう描くかを返し、それ以外の図と種類では返さない。 */
export function 泳法図で印をどう描く(
  doc: Pick<DslDocument, "type" | "shape">,
  actor: Pick<DslActor, "kind">,
): 泳法図の印の描き方 | undefined {
  if (doc.type !== "swimlane") return undefined;
  if (!(SWIMLANE_SHAPES as readonly string[]).includes(doc.shape ?? "")) return undefined;
  if (!(泳法図の印 as readonly string[]).includes(actor.kind)) return undefined;
  return 泳法図の印の描き方[doc.shape as DslSwimlaneShape][actor.kind as 泳法図の印];
}

/**
 * 省く印を本文から外し、その印へ入る線と出る線を直接結ぶ。
 *
 * 繋いだ線は入る線の行と指定を保つ。説明だけは入る線が空なら出る線から受け継ぎ、
 * 後段が元の行から色や線種を写せるようにする。
 */
export function 省く泳法図の印を外す(doc: DslDocument): DslDocument {
  const 省く印 = doc.actors.filter((actor) => 泳法図で印をどう描く(doc, actor) === "省く");
  if (省く印.length === 0) return doc;

  let actors = doc.actors;
  let flow = doc.flow;
  for (const mark of 省く印) {
    const 出る線 = flow.filter((step) => step.from === mark.name && step.to !== mark.name);
    const 既に在る組 = new Set(
      flow
        .filter((step) => step.from !== mark.name && step.to !== mark.name)
        .map((step) => `${step.from}\u0000${step.to}`),
    );
    const 繋ぎ直した: DslStep[] = [];
    for (const step of flow) {
      if (step.from !== mark.name && step.to !== mark.name) {
        繋ぎ直した.push(step);
        continue;
      }
      if (step.to !== mark.name || step.from === mark.name) continue;
      for (const next of 出る線) {
        if (step.from === next.to) continue;
        const 組 = `${step.from}\u0000${next.to}`;
        if (既に在る組.has(組)) continue;
        既に在る組.add(組);
        繋ぎ直した.push({
          ...step,
          to: next.to,
          label: step.label === "" ? next.label : step.label,
        });
      }
    }
    actors = actors.filter((actor) => actor !== mark);
    flow = 繋ぎ直した;
  }
  return { ...doc, actors, flow };
}
