import { diagram } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslDocument } from "../types";
import { 図表の大きさ } from "./chart-fields";
import { 矢印から親を決める, 放射に出す文字 } from "./hierarchy";
import type { CompileNotice } from "./notice";
import { slugify } from "./slug";
import { 図の小見出し } from "./subtitle";
/**
 * 木 (`type: tree`) の組み立て (#1154)。 描画側に 1 つの箱で渡す。
 *
 * 親子を `flow` の矢印で読む (`親 -> 子`)。 他の図表と違って `flow` を読むのは、親子が
 * 2 つの名前の関係で、 1 行 1 値では書けないため。
 */
export function compileTree(doc: DslDocument, onNotice?: (n: CompileNotice) => void): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title, type: "tree" });
  const { w: W, h: H } = 図表の大きさ.tree;
  b.lane("chart", { width: W + 64 });
  // **同じ slug になる名前を先に見る**。 違う名前が同じ id に潰れると、 自分を親にしたと
  // 誤判定したり、 同じ id の要素が 2 つできたりする (review 指摘)
  const slug別 = new Map<string, string[]>();
  for (const a of doc.actors) {
    const k = slugify(a.name);
    slug別.set(k, [...(slug別.get(k) ?? []), a.name]);
  }
  const 名前 = new Set(slug別.keys());
  // **行番号を渡す**。 `DslActor` / `DslStep` は `pos.line` を持つので遡れる。 前回「持てない」
  // と書いたのは誤り (review 指摘)。 0 にすると画面が問題の行を案内できない
  const 伝える = (名: string, message: string, line = 0) => {
    onNotice?.({ kind: "chart-value-unreadable", actor: 名, line, message });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${message}`);
  };
  for (const [k, 群] of slug別) {
    if (群.length > 1) {
      伝える(
        群[0]!,
        `type: tree で ${群.join(" / ")} が同じ id (${k}) になります。 名前を変えてください`,
      );
    }
  }
  const 親 = 矢印から親を決める(doc, "tree", 名前, 伝える);
  const data: NonNullable<CdlDiagram["nodes"][number]["treeData"]> = doc.actors.map((a) => {
    const id = slugify(a.name);
    const p3 = 親.get(id);
    // 木も放射と同じく名前と補足を分けて渡す (#1332)。 分けないと補足が捨てられ、
    // 書いた文字が図に出ない
    return { id, ...放射に出す文字(a), ...(p3 !== undefined ? { parent: p3 } : {}) };
  });
  b.node(`${slugify(doc.title) || "tree"}-chart`, {
    lane: "chart",
    stack: 0,
    kind: "tree-hierarchy",
    title: doc.title,
    ...図の小見出し(doc),
    w: W,
    h: H,
    treeData: data,
  });
  return b.build();
}
