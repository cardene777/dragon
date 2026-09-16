import { diagram } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslDocument } from "../types";
import { 図表の大きさ, 語の欄から参照できる名前 } from "./chart-fields";
import { 箱の題 } from "./node-title";
import type { CompileNotice } from "./notice";
import { slugify } from "./slug";
import { 図の小見出し } from "./subtitle";
import { 区画 } from "./word-state";
export function compileQuadrant(
  doc: DslDocument,
  onNotice?: (n: CompileNotice) => void,
): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title, type: "quadrant" });
  const { w: W, h: H } = 図表の大きさ.quadrant;
  b.lane("chart", { width: W + 64 });
  const items: NonNullable<CdlDiagram["nodes"][number]["quadrantData"]>["items"] = [];
  const 読めない: string[] = [];
  const 参照できる = 語の欄から参照できる名前(doc, 区画);
  for (const a of doc.actors) {
    const 語 = (a.value ?? a.subtitle ?? "").trim();
    const 参照 = 語.match(/^\{(\w+)\}$/);
    if (参照) {
      if (!参照できる.has(参照[1]!)) {
        読めない.push(a.name);
        continue;
      }
      items.push({ id: slugify(a.name), title: 箱の題(a), quadrant: 語 });
      continue;
    }
    const q = 区画.get(語);
    if (q === undefined) {
      読めない.push(a.name);
      continue;
    }
    items.push({ id: slugify(a.name), title: 箱の題(a), quadrant: q });
  }
  if (読めない.length > 0) {
    const m = `type: quadrant で区画を読めない項目があります (図に載せません): ${読めない.join(", ")}。 \`- 重複削除: "左上"\` の形で、 ${[...区画.keys()].join(" / ")} のどれかを書いてください`;
    onNotice?.({ kind: "chart-value-unreadable", actor: 読めない[0]!, line: 0, message: m });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${m}`);
  }
  // 矢印は描けない。 書かれていたら伝える (黙って捨てると「書いたのに効かない」 が残る)
  if (doc.flow.length > 0) {
    const m2 = `type: quadrant では矢印を描けません (${doc.flow.length} 本を無視しました)。 関係を描くなら type: flow を使ってください`;
    onNotice?.({
      kind: "chart-edge-dropped",
      actor: doc.flow[0]?.from ?? "",
      line: doc.flow[0]?.pos?.line ?? 0,
      message: m2,
    });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${m2}`);
  }
  b.node(`${slugify(doc.title) || "quadrant"}-chart`, {
    lane: "chart",
    stack: 0,
    kind: "quadrant-matrix",
    title: doc.title,
    ...図の小見出し(doc),
    w: W,
    h: H,
    quadrantData: { ...軸と区画の名前(doc), items },
  });
  return b.build();
}

/** 軸を書かなかった時の名前。 何の軸か分からないため、位置をそのまま出す */
const 軸の既定 = {
  xAxis: { left: "小さい", right: "大きい" },
  yAxis: { bottom: "小さい", top: "大きい" },
  quadrantLabels: { topLeft: "左上", topRight: "右上", bottomLeft: "左下", bottomRight: "右下" },
} as const;

/**
 * 2 軸で仕分ける図の軸と区画の名前を決める (#1251)。
 *
 * `axes:` を書かなければ従来どおり位置の名前 (`左上` 等) を出す = 既に描いてある図が動かない。
 *
 * 書いたら区画の名前は **軸の名前から決める** (`{上} × {右}`)。 組立て API 側が同じ規則で
 * 導いており (実測 = `xAxis: {left: "L", right: "R"}` / `yAxis: {bottom: "B", top: "T"}` で
 * `topLeft: "T × L"`)、 別の規則にすると同じ内容を書いても図が食い違う。
 *
 * 片側だけ書いた形では、書かなかった側は既定のままにする。 空文字を渡すと名前の無い軸が描かれる。
 */
function 軸と区画の名前(doc: DslDocument): {
  xAxis: { left: string; right: string };
  yAxis: { bottom: string; top: string };
  quadrantLabels: { topLeft: string; topRight: string; bottomLeft: string; bottomRight: string };
} {
  if (doc.axes === undefined) return 軸の既定;
  const left = doc.axes.x?.left ?? 軸の既定.xAxis.left;
  const right = doc.axes.x?.right ?? 軸の既定.xAxis.right;
  const bottom = doc.axes.y?.bottom ?? 軸の既定.yAxis.bottom;
  const top = doc.axes.y?.top ?? 軸の既定.yAxis.top;
  return {
    xAxis: { left, right },
    yAxis: { bottom, top },
    quadrantLabels: {
      topLeft: `${top} × ${left}`,
      topRight: `${top} × ${right}`,
      bottomLeft: `${bottom} × ${left}`,
      bottomRight: `${bottom} × ${right}`,
    },
  };
}
