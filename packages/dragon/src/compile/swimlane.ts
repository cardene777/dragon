import { swimlane } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslDocument } from "../types";
import { compileGenericWithAnimate, 共通の組み立てへ回す } from "./generic";
import { 描ける種別 } from "./kinds";
import { 箱の題 } from "./node-title";
import { slugify } from "./slug";
export function compileSwimlane(doc: DslDocument): CdlDiagram {
  // 動きを書いた形と縦列を書いた形は共通の組み立てへ (#1263 / #2348 で 1 箇所にまとめた)。
  // **向きを書いた形も** (#1494)。 静止図の経路は並びを固定で持つので、
  // ここを通さないと書いた向きが黙って消える (縦列を書いた形と同じ理由)
  if (共通の組み立てへ回す("swimlane", doc, doc.direction !== undefined)) {
    return compileGenericWithAnimate(doc, { kind: "swimlane", laneWidth: 400 });
  }
  // swimlane preset は lane 配置 + 自由 node/edge。
  // v0.2 では actors を lane 化、 流れ の各 step から node を生成、 edge を引く。
  const swim = swimlane({
    id: slugify(doc.title),
    topic: doc.title,
    lanes: doc.actors.map((a) => a.name),
  });

  // 各 step で from / to の node を lane 内 stack 配置
  const placedNodes = new Set<string>();
  const laneStackCount = new Map<string, number>();
  let edgeIdx = 0;

  for (const s of doc.flow) {
    for (const actorName of [s.from, s.to]) {
      if (placedNodes.has(actorName)) continue;
      const laneId = swim.laneId(actorName);
      const actor = doc.actors.find((a) => a.name === actorName);
      const stack = laneStackCount.get(laneId) ?? 0;
      const nodeId = slugify(actorName) || `n${placedNodes.size}`;
      swim.node(nodeId, {
        lane: laneId,
        stack,
        kind: 描ける種別(actor?.kind),
        title: actorName,
      });
      laneStackCount.set(laneId, stack + 1);
      placedNodes.add(actorName);
    }
    const fromId = slugify(s.from);
    const toId = slugify(s.to);
    swim.edge(fromId, toId, {
      id: `e${edgeIdx++}-${fromId}-${toId}`,
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.side ? { side: s.side } : {}),

      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
    });
  }

  // **箱が 1 つも置けなかった時は、 登場人物をそのまま置く** (#1219)。
  //
  // この図種は矢印の端から箱を作るため、 矢印が 1 本も無いと箱が 0 件になり `compile` が
  // 落ちる (実測 = 矢印を書かない図は本 Issue の前から落ちていた)。 解決できない矢印を
  // 外すと同じ形になるので、 受け皿を置く。
  //
  // **1 つでも置けた時は触らない**。 矢印に出てこない登場人物にも箱を置くと、 今まで枠だけ
  // だった所に箱が増えて既存の図の見た目が変わる (それを変えるかは別の判断)。
  if (placedNodes.size === 0) {
    doc.actors.forEach((a, i) => {
      swim.node(slugify(a.name) || `n${i}`, {
        lane: swim.laneId(a.name),
        stack: 0,
        kind: 描ける種別(a.kind),
        title: 箱の題(a),
      });
    });
  }
  return swim.build();
}
