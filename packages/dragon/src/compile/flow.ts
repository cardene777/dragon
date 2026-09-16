import { diagram, flow } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslDocument } from "../types";
import { compileGenericWithAnimate } from "./generic";
import { 描ける種別 } from "./kinds";
import { 鎖でつなぐ形か, 鎖に並べる登場人物 } from "./chain";
import { 箱の題 } from "./node-title";
import { slugify } from "./slug";
export function compileFlow(
  doc: DslDocument,
  /** 鎖に並べない部品を決める一覧 (#1987) */
  partsCatalog?: Record<string, CdlDiagram>,
): CdlDiagram {
  // v0.4 ... animation あり時 builder 直接経路で複数 phase 注入
  // **縦列を書いた形は動きの有無に関わらず generic 経路へ** (#1263)。 動く図だけで効かせると、
  // 同じ記法でも静止図では指定が黙って消える (実測 = 縦列 3 本のはずが 1 本になり知らせも出ない)
  // **向きを書いた形も generic 経路へ** (#1494)。 静止図の経路は並びを固定で持つので、
  // ここを通さないと書いた向きが黙って消える (縦列を書いた形と同じ理由)
  //
  // 振り分けは行の対応と端の知らせと同じ判定で行う (#1986)
  if (!鎖でつなぐ形か(doc)) {
    return compileGenericWithAnimate(doc, { kind: "flow", laneId: "main", laneWidth: 400 });
  }
  // 登場人物が 0 人なら枠も作らない。 描画側の `flow()` は枠を必ず 1 つ作るため、 そのまま
  // 通すと中身の無い枠が残る (実測 = `title` と `type` だけの本文で枠 `flow` が空)。
  // 枠を持たない図として返す = `swimlane` / `c4` が 0 人で枠 0 になるのと揃う。
  // 鎖に並べる登場人物で見る = 行に書かれていない部品しか居ない図も枠を作らない (#1987)
  const 並び = 鎖に並べる登場人物(doc, partsCatalog);
  if (並び.length === 0) {
    return diagram(slugify(doc.title), { topic: doc.title, type: "flow" }).build();
  }
  // flow preset は actors を順に step として配置、 step 間に edge auto
  const flowBuilder = flow({
    id: slugify(doc.title),
    topic: doc.title,
  });
  // 各 actor を step として登録、 edge label は流れ から拾う
  for (const a of 並び) {
    // 名前から id を作れない時の番号は、書いた順の番号にする (部品を飛ばしても変わらない)
    const i = doc.actors.indexOf(a);
    // 直前の step との edge label = この actor を to に持つ flow から拾う
    const incomingEdge = doc.flow.find((s) => s.to === a.name);
    const edgeLabel = incomingEdge?.label;
    flowBuilder.step(
      {
        id: slugify(a.name) || `n${i}`,
        kind: 描ける種別(a.kind),
        title: 箱の題(a),
      },
      edgeLabel,
    );
  }
  return flowBuilder.build();
}
