import { diagram, topology } from "@cardenelabs/cdl";
import { 箱の題 } from "./node-title";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslDocument } from "../types";

import { compileGenericWithAnimate } from "./generic";
import { 描ける種別 } from "./kinds";
import { 書いた縦列に置く } from "./lanes";

import { slugify } from "./slug";

export function compileTopology(doc: DslDocument): CdlDiagram {
  // v0.4 ... animation あり時 builder 直接経路 (各 actor を別 lane に)
  // **縦列を書いた形は動きの有無に関わらず generic 経路へ** (#1263)。 動く図だけで効かせると、
  // 同じ記法でも静止図では指定が黙って消える (実測 = 縦列 3 本のはずが 1 本になり知らせも出ない)
  if ((doc.animate && doc.animate.phases.length > 0) || 書いた縦列に置く("topology", doc)) {
    return compileGenericWithAnimate(doc, { kind: "topology", laneWidth: 460 });
  }
  // 登場人物が 0 人なら枠も作らない。 描画側の `topology()` は枠を必ず 1 つ作るため、 そのまま
  // 通すと中身の無い枠が残る (#1096)
  if (doc.actors.length === 0) {
    return diagram(slugify(doc.title), { topic: doc.title, type: "topology" }).build();
  }
  // topology preset ... actors を 1 つの group 内 container として配置
  // v0.3 で「group」 ブロックを追加して複数 group 対応検討
  const topo = topology({
    id: slugify(doc.title),
    topic: doc.title,
  });
  const groupId = "main";
  const groupBuilder = topo.group(groupId, { label: doc.title });
  for (const a of doc.actors) {
    groupBuilder.add({
      id: slugify(a.name) || a.name,
      kind: 描ける種別(a.kind),
      title: 箱の題(a),
    });
  }
  for (const s of doc.flow) {
    topo.connect(slugify(s.from), slugify(s.to), {
      label: s.label,
      ...(s.sub ? { sub: s.sub } : {}),
      ...(s.side ? { side: s.side } : {}),

      ...(s.tone ? { tone: s.tone } : {}),
      ...(s.style ? { style: s.style } : {}),
    });
  }
  return topo.build();
}
