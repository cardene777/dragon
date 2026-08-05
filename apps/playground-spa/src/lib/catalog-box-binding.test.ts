/**
 * 箱の説明が、段ごとに実際どう描かれるかを engine の処理で解決して確かめる (#1032)。
 *
 * これまでの検査は「束ねの形 (`{...}`) を持つか」 しか見ておらず、束ねた結果が正しいかを
 * 見ていなかった。 その結果、以下がすべて素通りした (実測)。
 *
 * - **入れ子の配列に添字は届かない**。 `{cm[0]}` は行全体を `"9,0,0,0"` として出す
 * - `{stages[1]}` は `["Signup",400]` を `"Signup,400"` として出す
 * - 添字が箱の並びとずれていても、形としては正しいので通る
 *
 * ここでは engine の `computeStateValues` と `interpolate` を通して、各段で箱が実際に
 * 何を表示するかを組み立て、壊れた出力を弾く。
 */
import { describe, it, expect } from "vitest";
import { layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import * as Interactive from "@/topics/catalog/interactive.cdl";
import { computeStateValues, interpolate } from "../../../../../cdl/packages/cdl/src/render/utils";

/** 段で表示部品を動かす図 (#1032 / #1033 の対象)。 */
const DRIVEN = [
  "arraySignalHistogram", "arrayLineChart", "arrayStackedBar", "arrayWaterfall",
  "eip1559GasFlow", "interactiveOauthFlow", "portfolioDonut", "abTestResult",
  "canvasMiniMap", "matrixHeatmap", "taskProgressGroup", "skillRadar",
  "perfBubbleChart", "contributionHeatmap", "priceCandlestick", "userVenn",
  "scoreSlope", "salesFunnel", "projectGantt", "resourceTreemap",
  "trafficSankey", "activityPolar",
  // #1032 の 2 本目
  "playerLeaderboard", "techTagCloud", "teamActivityFeed", "supportChat",
  "sprintChecklist", "pathProgressDemo",
] as const;

const mod = Interactive as unknown as Record<string, CdlDiagram>;

/** 各段で、箱と矢印の説明が実際に描かれる文字列。 */
function renderedTexts(d: CdlDiagram): Array<{ phase: number; id: string; text: string; template: string }> {
  const laid = layout(d) as never;
  const out: Array<{ phase: number; id: string; text: string; template: string }> = [];
  const phases = (d as { phases?: unknown[] }).phases ?? [];
  for (let i = 0; i < phases.length; i += 1) {
    const values = computeStateValues(laid, i, 1);
    // 描画側 (`nodes.tsx`) が解決するのは title / subtitle / eyebrow / value / rows / visibleIf。
    // subtitle だけを見ると、他の field に書いた束ねが無検査になる
    type Node = {
      id?: string; title?: string; subtitle?: string; eyebrow?: string;
      value?: string; rows?: string[]; visibleIf?: string;
    };
    for (const n of (d as { nodes?: Node[] }).nodes ?? []) {
      const fields: Array<[string, string | undefined]> = [
        ["title", n.title], ["subtitle", n.subtitle], ["eyebrow", n.eyebrow],
        ["value", n.value], ["visibleIf", n.visibleIf],
        ...((n.rows ?? []).map((r, ri) => [`rows[${ri}]`, r] as [string, string])),
      ];
      for (const [field, tpl] of fields) {
        if (!tpl) continue;
        out.push({ phase: i, id: `${n.id}.${field}`, text: interpolate(tpl, values), template: tpl });
      }
    }
  }
  return out;
}

describe("箱の束ねが実際に解決する (#1032)", () => {
  it("対象が全件 実在する", () => {
    const missing = DRIVEN.filter((k) => mod[k] === undefined);
    expect(missing, `図が無い: ${missing.join(", ")}`).toHaveLength(0);
  });

  it("解決できない束ねが残らない", () => {
    // 綴り違いや存在しない状態を書くと `{xxx}` がそのまま画面に出る
    const bad: string[] = [];
    for (const k of DRIVEN) {
      for (const r of renderedTexts(mod[k]!)) {
        if (/\{[\w.[\]]+\}/.test(r.text)) bad.push(`${k}/${r.id}[段${r.phase}]: "${r.text}"`);
      }
    }
    expect(bad, `解決できていない: ${bad.slice(0, 6).join(", ")}`).toHaveLength(0);
  });

  it("入れ子の配列に添字を当てていない", () => {
    // `{cm[0]}` は行全体を "9,0,0,0" として出す。 数値 1 つのつもりで書くと壊れる
    const bad: string[] = [];
    for (const k of DRIVEN) {
      for (const r of renderedTexts(mod[k]!)) {
        // 添字は 1 つの値を取り出すもの。 結果にカンマが出たら行や組をそのまま出している
        // (実測 = `{cm[0]}` が "9,0,0,0"、`{players[0]}` が "Carol,1240")
        if (!/\[\d+\]/.test(r.template)) continue;
        if (r.text.includes(",")) {
          bad.push(`${k}/${r.id}[段${r.phase}]: "${r.text}"`);
        }
      }
    }
    expect(bad, `入れ子をそのまま出している: ${bad.slice(0, 6).join(", ")}`).toHaveLength(0);
  });

  it("箱の題名と添字が、名前の配列と対応する", () => {
    // 添字がずれていても値としては正しく解決するため、他の検査では拾えない
    // (実測 = `title: "Impl"` の箱が Design の値を出していた)
    const bad: string[] = [];
    for (const k of DRIVEN) {
      const d = mod[k]!;
      // 表示部品が名前の一覧を持つ図だけを見る
      const labelSrc = (d as { readouts?: Array<{ labelSource?: string }> }).readouts
        ?.map((r) => r.labelSource).find(Boolean);
      if (!labelSrc) continue;
      const st = (d as { states?: Array<{ id?: string; initial?: unknown }> }).states
        ?.find((x) => x.id === labelSrc);
      if (!st) continue;
      let names: unknown;
      try { names = JSON.parse(String(st.initial)); } catch { continue; }
      if (!Array.isArray(names)) continue;
      for (const n of (d as { nodes?: Array<{ id?: string; title?: string; subtitle?: string }> }).nodes ?? []) {
        const m = n.subtitle?.match(/\{\w+\[(\d+)\]\}/);
        if (!m || !n.title) continue;
        const want = names[Number(m[1])];
        if (typeof want === "string" && want !== n.title) {
          bad.push(`${k}/${n.id}: 題名 "${n.title}" に対し添字 ${m[1]} は "${want}"`);
        }
      }
    }
    expect(bad, `題名と添字が対応していない: ${bad.join(", ")}`).toHaveLength(0);
  });

  it("矢印の説明に束ねを書かない", () => {
    // 描画側 (`edges.tsx`) は矢印の説明を解決しない。 書くと波括弧がそのまま画面に出る
    const bad: string[] = [];
    for (const k of DRIVEN) {
      for (const e of (mod[k] as { edges?: Array<{ id?: string; label?: string }> }).edges ?? []) {
        if (e.label?.includes("{")) bad.push(`${k}/${e.id}: "${e.label}"`);
      }
    }
    expect(bad, `矢印に束ねを書いている: ${bad.join(", ")}`).toHaveLength(0);
  });

  it("段が動かす状態を束ねた箱は、段ごとに表示が変わる", () => {
    // 束ねていても段ごとに同じ値しか出ないなら固定値と変わらない。
    // ただし入力欄が握る状態を束ねた箱は段では変わらないのが正しいので、対象から外す
    const still: string[] = [];
    for (const k of DRIVEN) {
      const d = mod[k]!;
      const owned = new Set([
        ...((d as { inputs?: Array<{ id?: string }> }).inputs ?? []).map((i) => i.id),
        ...((d as { formulas?: Array<{ id?: string }> }).formulas ?? []).map((f) => f.id),
      ]);
      const driven = new Set<string>();
      for (const p of (d as { phases?: Array<{ tweens?: Array<{ stateId?: string }>; sets?: Array<{ stateId?: string }> }> }).phases ?? []) {
        for (const t of p.tweens ?? []) if (t.stateId) driven.add(t.stateId);
        for (const x of p.sets ?? []) if (x.stateId) driven.add(x.stateId);
      }
      const rows = renderedTexts(d);
      const byId = new Map<string, Set<string>>();
      for (const r of rows) {
        // 段が動かす状態を束ねている箱だけを見る
        const refs = [...r.template.matchAll(/\{(\w+)/g)].map((m) => m[1]!);
        if (!refs.some((x) => driven.has(x) && !owned.has(x))) continue;
        byId.set(r.id, (byId.get(r.id) ?? new Set()).add(r.text));
      }
      // **箱ごとに** 見る。 図の中の 1 つが動けば通る形だと、個別の誤りを見逃す
      for (const [id, texts] of byId) {
        if (texts.size <= 1) still.push(`${k}/${id}`);
      }
    }
    expect(still, `段が動かす状態を束ねているのに変わらない: ${still.join(", ")}`).toHaveLength(0);
  });
});
