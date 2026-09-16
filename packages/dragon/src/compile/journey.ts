import { diagram } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslActor, DslDocument } from "../types";
import { 図表の大きさ, 語の欄から参照できる名前 } from "./chart-fields";
import { 箱の題 } from "./node-title";
import type { CompileNotice } from "./notice";
import { slugify } from "./slug";
import { 図の小見出し } from "./subtitle";
import { 気持ち } from "./word-state";
/**
 * 体験の道筋 (`type: journey`) の組み立て (#1154)。 描画側に 1 つの箱で渡す。
 *
 * 登場人物ごとに **気持ち** を読む (`- 登録: "不満"`)。 使える語は `気持ち` が持つ。
 */
export function compileJourney(
  doc: DslDocument,
  onNotice?: (n: CompileNotice) => void,
): CdlDiagram {
  const b = diagram(slugify(doc.title), { topic: doc.title, type: "journey" });
  const { w: W, h: H } = 図表の大きさ.journey;
  b.lane("chart", { width: W + 64 });
  const data: NonNullable<CdlDiagram["nodes"][number]["journeyData"]> = [];
  const 読めない: string[] = [];
  const 参照できる = 語の欄から参照できる名前(doc, 気持ち);
  for (const a of doc.actors) {
    const 語 = (a.value ?? a.subtitle ?? "").trim();
    // 状態を読む欄はそのまま渡す。 指す先の語は `語の状態を図の語へ直す` が図の語に直す
    const 参照 = 語.match(/^\{(\w+)\}$/);
    if (参照) {
      if (!参照できる.has(参照[1]!)) {
        読めない.push(a.name);
        continue;
      }
      data.push({ id: slugify(a.name), title: 箱の題(a), emotion: 語, ...道筋の欄(a) });
      continue;
    }
    const e = 気持ち.get(語);
    if (e === undefined) {
      読めない.push(a.name);
      continue;
    }
    data.push({ id: slugify(a.name), title: 箱の題(a), emotion: e, ...道筋の欄(a) });
  }
  if (読めない.length > 0) {
    const m = `type: journey で気持ちを読めない項目があります (道筋に載せません): ${読めない.join(", ")}。 \`- 登録: "不満"\` の形で、 ${[...気持ち.keys()].join(" / ")} のどれかを書いてください`;
    onNotice?.({ kind: "chart-value-unreadable", actor: 読めない[0]!, line: 0, message: m });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${m}`);
  }
  // 矢印は描けない。 書かれていたら伝える (黙って捨てると「書いたのに効かない」 が残る)
  if (doc.flow.length > 0) {
    const m2 = `type: journey では矢印を描けません (${doc.flow.length} 本を無視しました)。 関係を描くなら type: flow を使ってください`;
    onNotice?.({
      kind: "chart-edge-dropped",
      actor: doc.flow[0]?.from ?? "",
      line: doc.flow[0]?.pos?.line ?? 0,
      message: m2,
    });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${m2}`);
  }
  b.node(`${slugify(doc.title) || "journey"}-chart`, {
    lane: "chart",
    stack: 0,
    kind: "journey-map",
    title: doc.title,
    ...図の小見出し(doc),
    w: W,
    h: H,
    journeyData: data,
  });
  return b.build();
}

/**
 * 体験の道筋の段に添える欄 (#1251)。
 *
 * 書かなければ項目ごと落とす = `undefined` を明示して渡すと、 組立て側が「空を書いた」 と
 * 区別できなくなる (`図の小見出し` と同じ理由)。
 */
function 道筋の欄(a: DslActor): { touchpoint?: string; opportunity?: string } {
  return {
    ...(a.touchpoint !== undefined ? { touchpoint: a.touchpoint } : {}),
    ...(a.opportunity !== undefined ? { opportunity: a.opportunity } : {}),
  };
}
