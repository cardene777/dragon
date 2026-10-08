import { diagram } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import type { DslDocument } from "../types";
import { 図表の大きさ, 数の欄から参照できる名前, 語の欄から参照できる名前 } from "./chart-fields";
import { 箱の題 } from "./node-title";
import type { CompileNotice } from "./notice";
import { slugify } from "./slug";
import { 図の小見出し } from "./subtitle";
import { 区画 } from "./word-state";
/**
 * 四象限 (`type: quadrant`) の組み立て (#1154)。 描画側に 1 つの箱で渡す。
 *
 * 登場人物ごとに **どの区画か** を読む (`- 重複削除: "左上"`)。 使える語は `区画` が持つ。
 */
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
  const 数を参照できる = 数の欄から参照できる名前(doc);
  const 伝える = (a: DslDocument["actors"][number], message: string): void => {
    onNotice?.({
      kind: "chart-value-unreadable",
      actor: a.name,
      line: a.atPos?.line ?? a.pos?.line ?? 0,
      message,
    });
    if (typeof console !== "undefined" && console.warn) console.warn(`[dragon] ${message}`);
  };
  for (const a of doc.actors) {
    const 語 = (a.value ?? a.subtitle ?? "").trim();
    if (a.at !== undefined) {
      const 座標 = 四象限の座標(a.at, 数を参照できる);
      if (座標 === null) {
        伝える(
          a,
          `type: quadrant で ${a.name} の at (${a.at.raw}) が読めません (図に載せません)。 at: [0.2, 0.8] の形で 0..1 の数か {状態名} を 2 つ書いてください`,
        );
        continue;
      }
      const 範囲外 = [
        座標.x,
        座標.y,
        ...[座標.x, 座標.y].flatMap((v) =>
          typeof v === "string" ? 状態が取る値(v, doc) : [],
        ),
      ].filter(
        (v): v is number => typeof v === "number" && (v < 0 || v > 1),
      );
      if (範囲外.length > 0) {
        伝える(
          a,
          `type: quadrant で ${a.name} の at (${a.at.raw}) が 0..1 の範囲外です (描画時に最寄りの端へ寄せます)`,
        );
      }
      const q = 区画.get(語);
      const 座標の区画 = 数の象限(座標);
      if (q !== undefined && 座標の区画 !== undefined && q !== 座標の区画) {
        伝える(
          a,
          `type: quadrant で ${a.name} の区画 (${語}) と at (${a.at.raw}) の象限が食い違います (at を採ります)`,
        );
      }
      items.push({ id: slugify(a.name), title: 箱の題(a), at: 座標 });
      continue;
    }
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

function 四象限の座標(
  at: NonNullable<DslDocument["actors"][number]["at"]>,
  参照できる: ReadonlySet<string>,
): { x: number | string; y: number | string } | null {
  if (!at.raw.startsWith("[") || !at.raw.endsWith("]") || at.x === undefined || at.y === undefined)
    return null;
  if (at.raw.slice(1, -1).split(",").length !== 2) return null;
  const 読める = (v: number | string): boolean => {
    if (typeof v === "number") return Number.isFinite(v);
    const m = v.match(/^\{([\w-]+)\}$/);
    return m !== null && 参照できる.has(m[1]!);
  };
  return 読める(at.x) && 読める(at.y) ? { x: at.x, y: at.y } : null;
}

/** 座標の `{状態名}` が、記法に書かれた範囲で取り得る数を集める。 */
function 状態が取る値(参照: string, doc: DslDocument): number[] {
  const m = 参照.match(/^\{([\w-]+)\}$/);
  if (m === null) return [];
  const 名前 = m[1]!;
  const values: number[] = [];
  const 数を加える = (value: unknown): void => {
    if (typeof value === "number" && Number.isFinite(value)) values.push(value);
    else if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)))
      values.push(Number(value));
  };
  let 初期値: unknown;
  let 初期値あり = false;
  for (const state of doc.animate?.states ?? []) {
    if (state.name !== 名前) continue;
    初期値 = state.initial;
    初期値あり = true;
  }
  if (初期値あり) 数を加える(初期値);
  for (const phase of doc.animate?.phases ?? []) {
    for (const tween of phase.tweens ?? []) {
      if (tween.state !== 名前) continue;
      数を加える(tween.from);
      数を加える(tween.to);
    }
    for (const set of phase.sets ?? []) if (set.state === 名前) 数を加える(set.value);
  }
  return values;
}

function 数の象限(at: { x: number | string; y: number | string }):
  | "topLeft"
  | "topRight"
  | "bottomLeft"
  | "bottomRight"
  | undefined {
  if (typeof at.x !== "number" || typeof at.y !== "number") return undefined;
  return `${at.y >= 0.5 ? "top" : "bottom"}${at.x >= 0.5 ? "Right" : "Left"}`;
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
  const 軸 = 軸の名前(doc);
  return { ...軸, quadrantLabels: 区画の名前(doc, 軸) };
}

/** 軸の両端の名前。 書かなかった側は既定のまま = 空文字を渡すと名前の無い軸が描かれる */
function 軸の名前(doc: DslDocument): {
  xAxis: { left: string; right: string };
  yAxis: { bottom: string; top: string };
} {
  if (doc.axes === undefined) return { xAxis: 軸の既定.xAxis, yAxis: 軸の既定.yAxis };
  return {
    xAxis: {
      left: doc.axes.x?.left ?? 軸の既定.xAxis.left,
      right: doc.axes.x?.right ?? 軸の既定.xAxis.right,
    },
    yAxis: {
      bottom: doc.axes.y?.bottom ?? 軸の既定.yAxis.bottom,
      top: doc.axes.y?.top ?? 軸の既定.yAxis.top,
    },
  };
}

/**
 * 区画の中に出す名前 (#2667)。
 *
 * 決め方は 3 段で、書いたものが勝つ。
 *
 * | 何を書いたか | 出る名前 |
 * |---|---|
 * | `regions:` にその区画を書いた | 書いた名前 |
 * | `axes:` を書いた | 軸の掛け合わせ (`{上} × {左}`) |
 * | どちらも書かない | 位置の名前 (`左上` 等) |
 *
 * **区画ごとに独立して決める**。 `regions:` を 1 つだけ書いた図で、残り 3 つが
 * 位置の名前に戻ると「書いた所だけ変わる」 という読み方ができなくなる。
 */
function 区画の名前(
  doc: DslDocument,
  軸: { xAxis: { left: string; right: string }; yAxis: { bottom: string; top: string } },
): { topLeft: string; topRight: string; bottomLeft: string; bottomRight: string } {
  const 掛け合わせ =
    doc.axes === undefined
      ? 軸の既定.quadrantLabels
      : {
          topLeft: `${軸.yAxis.top} × ${軸.xAxis.left}`,
          topRight: `${軸.yAxis.top} × ${軸.xAxis.right}`,
          bottomLeft: `${軸.yAxis.bottom} × ${軸.xAxis.left}`,
          bottomRight: `${軸.yAxis.bottom} × ${軸.xAxis.right}`,
        };
  const r = doc.regions;
  if (r === undefined) return { ...掛け合わせ };
  return {
    topLeft: r.topLeft ?? 掛け合わせ.topLeft,
    topRight: r.topRight ?? 掛け合わせ.topRight,
    bottomLeft: r.bottomLeft ?? 掛け合わせ.bottomLeft,
    bottomRight: r.bottomRight ?? 掛け合わせ.bottomRight,
  };
}
