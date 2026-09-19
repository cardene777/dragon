import { diagram, topology } from "@cardenelabs/cdl";
import { 箱の題 } from "./node-title";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslDocument } from "../types";

import { compileGenericWithAnimate, 共通の組み立てへ回す } from "./generic";
import { 描ける種別 } from "./kinds";

import { slugify } from "./slug";

export function compileTopology(doc: DslDocument): CdlDiagram {
  // 動きを書いた形と縦列を書いた形は共通の組み立てへ (#1263 / #2348 で 1 箇所にまとめた)
  if (共通の組み立てへ回す("topology", doc)) {
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
