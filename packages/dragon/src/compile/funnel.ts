import { diagram } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslDocument } from "../types";
import {
  parseChartValue,
  数の欄から参照できる名前,
  参照する名前,
  図表の大きさ,
} from "./chart-fields";

import { 箱の題 } from "./node-title";
import type { CompileNotice } from "./notice";
import { slugify } from "./slug";
import { 図の小見出し } from "./subtitle";
/**
 * 漏斗 (`type: funnel`) の組み立て (#1154)。 描画側に 1 つの箱で渡す。
 *
 * 登場人物ごとに **数** を読む (`- 訪問: "12000"`)。 段の人数なので負の数は読めない値として扱う。
 */
export function compileFunnel(doc: DslDocument, onNotice?: (n: CompileNotice) => void): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title, type: "funnel" });
  const { w: W, h: H } = 図表の大きさ.funnel;
  b.lane("chart", { width: W + 64 });
  const data: NonNullable<CdlDiagram["nodes"][number]["funnelData"]> = [];
  const 読めない: string[] = [];
  const 未宣言: string[] = [];
  const 参照できる = 数の欄から参照できる名前(doc);
  for (const a of doc.actors) {
    const v = parseChartValue(a.value ?? a.subtitle);
    // 段の数なので負に意味が無い (状態を読む欄は符号が決まらないので通す)
    if (v === null || (typeof v === "number" && v < 0)) {
      読めない.push(a.name);
      continue;
    }
    // 数にならない参照は落とす (棒 / 折れ線 / 円と同じ扱い)
    const 名前 = 参照する名前(v);
    if (名前 !== null && !参照できる.has(名前)) {
      未宣言.push(a.name);
      continue;
    }
    data.push({ id: slugify(a.name), title: 箱の題(a), count: v });
  }
  if (未宣言.length > 0) {
    const m3 = `type: funnel で数にならない値を参照した項目があります (段に載せません): ${未宣言.join(", ")}。 \`states:\` にその名前を数で書いてください`;
    onNotice?.({ kind: "chart-value-unreadable", actor: 未宣言[0]!, line: 0, message: m3 });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${m3}`);
  }
  if (読めない.length > 0) {
    const m = `type: funnel で数を読めない項目があります (段に載せません): ${読めない.join(", ")}。 \`- 訪問: "12000"\` の形で書いてください`;
    onNotice?.({ kind: "chart-value-unreadable", actor: 読めない[0]!, line: 0, message: m });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${m}`);
  }
  // 矢印は描けない。 書かれていたら伝える (黙って捨てると「書いたのに効かない」 が残る)
  if (doc.flow.length > 0) {
    const m2 = `type: funnel では矢印を描けません (${doc.flow.length} 本を無視しました)。 関係を描くなら type: flow を使ってください`;
    onNotice?.({
      kind: "chart-edge-dropped",
      actor: doc.flow[0]?.from ?? "",
      line: doc.flow[0]?.pos?.line ?? 0,
      message: m2,
    });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${m2}`);
  }
  b.node(`${slugify(doc.title) || "funnel"}-chart`, {
    lane: "chart",
    stack: 0,
    kind: "funnel-stages",
    title: doc.title,
    ...図の小見出し(doc),
    w: W,
    h: H,
    funnelData: data,
  });
  return b.build();
}
