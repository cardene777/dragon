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
  // #1032 の 3 本目
  "postReactions", "techPills", "dashboardMetricsGrid", "kpiIconTile",
  "cryptoWallet", "worldMapPins", "tournamentPodium", "featurePoll",
  "reviewerStack", "gitCommitList", "serverEventLog", "searchResults",
  "yearRoadmap", "weekWeather",
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

  it("箱が語る順位が、段の渡す値の順位と一致する", () => {
    // 4 度繰り返した誤り (説明と実装の食い違い) の型。 箱に「最も多い」 と書いておきながら
    // 段が渡す配列ではその行が 1 位でない、という食い違いは他のどの検査でも拾えない
    // (値としては正しく解決し、束ねの形も正しく、値域にも収まるため)。
    //
    // 箱と行の対応は **箱の題に行の文字列が現れるか** で機械的に取る
    // (`👍 Thumbs up` ↔ `["👍",24]`、`₿ BTC` ↔ `["₿","BTC","0.42",5.3]`)。
    //
    // 順位を付ける数は **行がちょうど 1 つだけ数を持つ場合** に限る。 2 つ以上ある行
    // (`["Mon","☀",24,18]` の高低、`["Tokyo",100,60]` の座標) はどちらで順位を付けるかが
    // 決まらないため見ない。 0 個の行 (`["Alice","1200 pts"]` は数が文字列の中) も見ない。
    const RANK = [
      { re: /最も(多|大き|高|暖か)/, want: "max" },
      { re: /次に多/, want: "second" },
      { re: /中ほど/, want: "middle" },
      { re: /最も(少な|小さ|低|寒)/, want: "min" },
    ] as const;
    const bad: string[] = [];
    // 題に対応する行が 1 度も見つからない箱 (綴り違い) を、段ごとの判定とは別に拾う
    const everMatched = new Map<string, boolean>();
    for (const k of DRIVEN) {
      const d = mod[k]!;
      type Node = { id?: string; title?: string; subtitle?: string };
      const nodes = (d as { nodes?: Node[] }).nodes ?? [];
      if (!nodes.some((n) => RANK.some((r) => r.re.test(n.subtitle ?? "")))) continue;
      for (const [pi, p] of ((d as { phases?: Array<{ sets?: Array<{ stateId?: string; value?: string | number }> }> }).phases ?? []).entries()) {
        for (const st of p.sets ?? []) {
          let rows: unknown;
          try { rows = JSON.parse(String(st.value ?? "")); } catch { continue; }
          if (!Array.isArray(rows)) continue;
          // 行ごとに「ちょうど 1 つの数」 を取る。 取れない行がある配列は順位を付けられない
          const nums = rows.map((r) => (Array.isArray(r) ? r.filter((v) => typeof v === "number") : []));
          if (nums.length < 2 || !nums.every((n) => n.length === 1)) continue;
          const values = nums.map((n) => n[0] as number);
          const sorted = [...values].sort((a, b) => b - a);
          for (const n of nodes) {
            const claim = RANK.find((r) => r.re.test(n.subtitle ?? ""));
            if (!claim || !n.title) continue;
            // 題と行の対応は双方向で見る (題 `Search` ↔ 行 `Faster search`、題 `👍 Thumbs up` ↔ 行 `👍`)
            const title = n.title.toLowerCase();
            const idx = rows.findIndex((r) => Array.isArray(r) && r.some((v) => {
              if (typeof v !== "string" || v.length === 0) return false;
              const s = v.toLowerCase();
              return title.includes(s) || s.includes(title);
            }));
            const key = `${k}/${n.id}`;
            everMatched.set(key, (everMatched.get(key) ?? false) || idx >= 0);
            // その段に行が無いのは正しい (段ごとに出す件数が違う図がある)。 順位は付けられないので見ない
            if (idx < 0) continue;
            // 同じ数が並ぶと、その行が何番目かが決まらない
            if (values.filter((v) => v === values[idx]).length > 1) {
              bad.push(`${k}/${n.id}[段${pi}]: 同じ数が並び順位が決まらない (${values.join(",")})`);
              continue;
            }
            const rank = sorted.indexOf(values[idx]!);
            const okRank =
              claim.want === "max" ? rank === 0
              : claim.want === "second" ? rank === 1
              : claim.want === "min" ? rank === values.length - 1
              : rank > 0 && rank < values.length - 1;
            if (!okRank) {
              bad.push(`${k}/${n.id}[段${pi}]: "${n.subtitle}" だが ${values[idx]} は ${rank + 1} 番目`);
            }
          }
        }
      }
    }
    for (const [key, hit] of everMatched) {
      if (!hit) bad.push(`${key}: 題に対応する行がどの段にも無い`);
    }
    expect(bad, `順位の説明が値と合わない: ${bad.slice(0, 6).join(", ")}`).toHaveLength(0);
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
