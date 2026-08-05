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

/**
 * 描画側が値をどう絵にするかの射影。 生の値が違っても画面が同じになる形と、
 * 生の値が違っても画面は同じになる形の両方を捕まえる。
 *
 * 射影の根拠は `cdl/packages/cdl/src/render/interactive-panel.tsx` の各 readout 実装。
 * **加工する種別だけを書く**。 表に無い種別は値をそのまま返す (値をそのまま絵にするため、
 * 生値の一致がそのまま画面の一致になる)。
 *
 * | 種別 | 描画側の加工 |
 * |---|---|
 * | `poll-bar` | `count / 総数` の百分率で帯を伸ばし、最大の行に ★ を付ける |
 * | `reaction-bar` | `count > 0` の行だけ札にする (0 件は札自体が出ない) |
 * | `podium` | 先頭 3 件だけ台にする |
 * | `leaderboard` | 値の降順に並べ替えてから `max` 件に切る |
 * | `array-list` / `user-stack` | `max` 件まで出し、超えた分を残り件数として出す |
 * | `SLICE_ONLY` | `max` 件までしか出さない (残り件数は出さない) |
 *
 * **`max` の意味は種別で違う**。 件数の上限として使う種別と、色や長さの基準値として
 * 使う種別 (`calendar-heatmap` は濃さの基準、`progress-group` / `radar` は帯の基準、
 * `stacked-bar` は高さの基準) がある。 既定で件数として切ると、基準値を持つ種別で
 * 「先頭 N 件が同じなら同じ絵」 と誤判定する (実測 = 30 日の升目を上限 10 で切り、
 * 後半だけ違う 2 段を同じとみなした)。
 *
 * 値域による切り詰め (`Math.min(max, v)` 等) は射影に入れない。 値域を外れる値は
 * §「段が渡す配列が表示部品の値域に収まる」 が別に弾くため、ここに届かない。
 */
const SLICE_ONLY = new Set(["activity-feed", "chat-bubble", "commit-list", "event-log", "search-result"]);
function visibleSignature(kind: string, inputs: Array<[string, string]>, max: number | undefined): string {
  const one = inputs.length === 1 ? inputs[0]![1] : undefined;
  const parse = (raw: string | undefined): unknown[] | undefined => {
    if (raw === undefined) return undefined;
    try {
      const v: unknown = JSON.parse(raw);
      return Array.isArray(v) ? v : undefined;
    } catch { return undefined; }
  };
  const rows = parse(one);
  const asIs = () => JSON.stringify(inputs);
  if (!rows) return asIs();
  const at = (r: unknown, i: number): number =>
    Array.isArray(r) && typeof r[i] === "number" ? (r[i] as number) : Number.NaN;
  const cut = (n: number) => rows.slice(0, n);
  switch (kind) {
    case "poll-bar": {
      const counts = rows.map((r) => at(r, 1)).filter(Number.isFinite);
      const total = counts.reduce((s, c) => s + c, 0) || 1;
      const top = counts.length ? Math.max(...counts) : 0;
      return counts.map((c) => `${Math.round((c / total) * 100)}${c === top ? "*" : ""}`).join(",");
    }
    case "reaction-bar":
      return JSON.stringify(rows.filter((r) => at(r, 1) > 0));
    case "podium":
      return JSON.stringify(cut(3));
    case "leaderboard": {
      // 値の降順に並べ替えてから切る。 入力の並びだけが違う 2 段は同じ絵になる
      const sorted = [...rows].sort((a, b) => at(b, 1) - at(a, 1));
      return JSON.stringify(typeof max === "number" ? sorted.slice(0, max) : sorted);
    }
    case "array-list":
    case "user-stack":
      // 溢れた件数を「… +N」 として出すため、切った先の件数も絵の一部
      return typeof max === "number"
        ? `${JSON.stringify(cut(max))}+${Math.max(0, rows.length - max)}`
        : JSON.stringify(rows);
    default:
      return JSON.stringify(SLICE_ONLY.has(kind) && typeof max === "number" ? cut(max) : rows);
  }
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
    // 順位を付ける数は **表示部品の種別ごとに、描画実装が読む位置** から取る。
    // 行に数が 2 つ以上あっても、どれで順位が決まるかは実装を読めば一意に定まる。
    //
    // | 種別 | 順位の決まり方 | 実装 |
    // |---|---|---|
    // | `weather-forecast` | 行の 3 番目 (高い方の気温) | `[日, 記号, 高, 低]` を順に読む |
    // | `podium` | 配列の並び順 (台の高さは `[0.7, 0.55, 0.4]` 固定) | 得点は文字として出すだけ |
    // | 既定 | 行がちょうど 1 つ持つ数 | 数が 1 つなら曖昧さが無い |
    //
    // `map-pin` の上下左右は順位ではなく座標のため、別の検査 (§ 位置の説明) で見る。
    const RANK_INDEX: Record<string, number> = { "weather-forecast": 2 };
    /** 台の高さが並び順で決まる種別。 数の大小ではなく行の位置が順位になる。 */
    const RANK_BY_ORDER = new Set(["podium"]);
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
      const kind = String(((d as { readouts?: Array<{ kind?: string }> }).readouts ?? [])[0]?.kind ?? "");
      for (const [pi, p] of ((d as { phases?: Array<{ sets?: Array<{ stateId?: string; value?: string | number }> }> }).phases ?? []).entries()) {
        for (const st of p.sets ?? []) {
          let rows: unknown;
          try { rows = JSON.parse(String(st.value ?? "")); } catch { continue; }
          if (!Array.isArray(rows)) continue;
          let values: number[];
          if (RANK_BY_ORDER.has(kind)) {
            // 並び順がそのまま順位。 先頭ほど大きいとみなすため降順の連番を当てる
            values = rows.map((_, i) => rows.length - i);
          } else if (RANK_INDEX[kind] !== undefined) {
            const at = RANK_INDEX[kind]!;
            const picked = rows.map((r) => (Array.isArray(r) ? r[at] : undefined));
            if (!picked.every((v) => typeof v === "number")) continue;
            values = picked as number[];
          } else {
            // 行ごとに「ちょうど 1 つの数」 を取る。 取れない行がある配列は順位を付けられない
            const nums = rows.map((r) => (Array.isArray(r) ? r.filter((v) => typeof v === "number") : []));
            if (!nums.every((n) => n.length === 1)) continue;
            values = nums.map((n) => n[0] as number);
          }
          if (values.length < 2) continue;
          const sorted = [...values].sort((a, b) => b - a);
          for (const n of nodes) {
            const claim = RANK.find((r) => r.re.test(n.subtitle ?? ""));
            if (!claim || !n.title) continue;
            // 題と行の対応は双方向で見る (題 `Search` ↔ 行 `Faster search`、題 `👍 Thumbs up` ↔ 行 `👍`)。
            // **最も長く一致した行を選ぶ**。 最初に一致した行を取ると、複数の行が共有する
            // 短い文字 (天気の `☀` 等) で別の行に吸われる (実測 = 題 `☀ Fri` が `Mon` の行に一致した)
            const title = n.title.toLowerCase();
            const score = (r: unknown): number => {
              if (!Array.isArray(r)) return 0;
              let best = 0;
              for (const v of r) {
                if (typeof v !== "string" || v.length === 0) continue;
                const s = v.toLowerCase();
                if (title.includes(s) || s.includes(title)) best = Math.max(best, s.length);
              }
              return best;
            };
            const scores = rows.map(score);
            const top = Math.max(0, ...scores);
            const idx = top === 0 ? -1 : scores.indexOf(top);
            if (top > 0 && scores.filter((s) => s === top).length > 1) {
              bad.push(`${k}/${n.id}[段${pi}]: 題 "${n.title}" が複数の行に同じ長さで一致する`);
              continue;
            }
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

  it("隣り合う段で、表示部品の描画結果が変わる", () => {
    // 生の値を比べるだけでは足りない。 描画側が値を加工する種別では、
    // 違う値から同じ絵が出る (実測 = 割合で伸びる帯に 8/6/3/2 と 23/16/10/7 を渡すと
    // どちらも 42/32/16/11 と 41/29/18/13 でほぼ同じ)。
    //
    // engine の `computeStateValues` を通して段ごとの実効値を取り (段が触らない状態は
    // 前段の値を持ち越す)、種別ごとの射影で「画面に出る形」 に変えてから比べる。
    const bad: string[] = [];
    for (const k of DRIVEN) {
      const d = mod[k]!;
      const laid = layout(d) as never;
      const owned = new Set([
        ...((d as { inputs?: Array<{ id?: string }> }).inputs ?? []).map((i) => i.id),
        ...((d as { formulas?: Array<{ id?: string }> }).formulas ?? []).map((f) => f.id),
        ...((d as { scrollTriggers?: Array<{ id?: string }> }).scrollTriggers ?? []).map((t) => t.id),
      ]);
      const phases = (d as { phases?: unknown[] }).phases ?? [];
      for (const r of (d as { readouts?: Array<Record<string, unknown>> }).readouts ?? []) {
        // 表示部品が状態を指す field は `source` で始まるか `Source` で終わる。
        // 積み上げ棒は `sourceA` / `sourceB` の 2 系列で 1 つの絵を描くため、
        // 末尾一致 (`/source$/`) だけでは 2 系列とも拾えず 3 図が丸ごと外れる (実測)
        const fields = Object.entries(r)
          .filter(([f, v]) => /(^source|Source$)/.test(f) && typeof v === "string")
          .map(([f, v]) => [f, v as string] as [string, string])
          .filter(([, s]) => !owned.has(s))
          .sort((a, b) => a[0].localeCompare(b[0]));
        if (fields.length === 0) continue;
        const kind = typeof r.kind === "string" ? r.kind : "";
        const max = typeof r.max === "number" ? r.max : undefined;
        let prev: string | undefined;
        for (let i = 0; i < phases.length; i += 1) {
          // 状態の実効値は文字列か数値で入る (`sets` の `value` は `string | number`)。
          // それ以外は文字列化しても中身が読めないため、空として扱う
          const values = computeStateValues(laid, i, 1) as Record<string, string | number | undefined>;
          const inputs = fields.map(([f, s]) => {
            const raw = values[s];
            return [f, typeof raw === "string" || typeof raw === "number" ? String(raw) : ""] as [string, string];
          });
          const sig = visibleSignature(kind, inputs, max);
          if (prev !== undefined && sig === prev) {
            bad.push(`${k}/${String(r.id)}[段${i}]: 前段と描画結果が同じ`);
          }
          prev = sig;
        }
      }
    }
    expect(bad, `段を進めても表示が変わらない: ${bad.slice(0, 6).join(", ")}`).toHaveLength(0);
  });

  it("箱が語る位置が、座標の向きと一致する", () => {
    // 座標を持つ表示部品では上下左右の主張が順位検査に乗らない。
    // `map-pin` の `yFor` は `pad + 正規化した y * 高さ` で **上下を反転しない** ため、
    // y が大きい点ほど画面の下に出る (実測 = 上限 80 に対し y=60 は 75% 地点)。
    // 「右上」 と書いて y が大きい点を指す形は、この検査でしか拾えない。
    //
    // 「最も」 の付かない位置表現 (`右寄り` / `やや下` / `左下`) も見る。 最上級だけを見ると、
    // 直した文言そのものが検査に届かない (実測 = `右上寄り` も `右寄り・やや下` も
    // 4 つの最上級に一致せず、Tokyo の箱に一度も到達していなかった)。
    //
    // 最上級は「その軸の端であること」、 それ以外は「その軸の中点より外側であること」 を要求する。
    const AXIS: Record<string, { x: number; y: number }> = { "map-pin": { x: 1, y: 2 } };
    /** 軸ごとに、主張の語を「端」 と「片側」 の 2 段階で読む。 y は大きいほど下。 */
    const CLAIM = [
      { axis: "x" as const, top: /最も右/, side: /右/, want: "max" as const },
      { axis: "x" as const, top: /最も左/, side: /左/, want: "min" as const },
      { axis: "y" as const, top: /最も下/, side: /下/, want: "max" as const },
      { axis: "y" as const, top: /最も上/, side: /上/, want: "min" as const },
    ];
    const bad: string[] = [];
    for (const k of DRIVEN) {
      const d = mod[k]!;
      const r0 = ((d as { readouts?: Array<{ kind?: string; source?: string }> }).readouts ?? [])[0];
      const ax = AXIS[String(r0?.kind ?? "")];
      if (!ax || !r0?.source) continue;
      type Node = { id?: string; title?: string; subtitle?: string };
      const nodes = (d as { nodes?: Node[] }).nodes ?? [];
      for (const [pi, p] of ((d as { phases?: Array<{ sets?: Array<{ stateId?: string; value?: string | number }> }> }).phases ?? []).entries()) {
        for (const st of p.sets ?? []) {
          if (st.stateId !== r0.source) continue;
          let rows: unknown;
          try { rows = JSON.parse(String(st.value ?? "")); } catch { continue; }
          if (!Array.isArray(rows) || rows.length < 2) continue;
          for (const n of nodes) {
            const sub = n.subtitle ?? "";
            for (const claim of CLAIM) {
              const isTop = claim.top.test(sub);
              if (!isTop && !claim.side.test(sub)) continue;
              if (!n.title) continue;
              const title = n.title.toLowerCase();
              const idx = rows.findIndex((r) => Array.isArray(r)
                && typeof r[0] === "string" && r[0].toLowerCase() === title);
              if (idx < 0) continue;
              const at = claim.axis === "x" ? ax.x : ax.y;
              const vals = rows.map((r) => (Array.isArray(r) ? r[at] : undefined));
              if (!vals.every((v) => typeof v === "number")) continue;
              const nums = vals as number[];
              const lo = Math.min(...nums);
              const hi = Math.max(...nums);
              // 端が 1 つに定まらない (全点が同じ座標) 段では、どちら寄りかを判定できない
              if (lo === hi) continue;
              const v = nums[idx]!;
              if (isTop) {
                const want = claim.want === "min" ? lo : hi;
                if (v !== want) {
                  bad.push(`${k}/${n.id}[段${pi}]: "${sub}" だが ${claim.axis}=${v} (端は ${want})`);
                }
              } else {
                const mid = (lo + hi) / 2;
                const ok = claim.want === "min" ? v < mid : v > mid;
                if (!ok) {
                  bad.push(`${k}/${n.id}[段${pi}]: "${sub}" だが ${claim.axis}=${v} (中点は ${mid})`);
                }
              }
            }
          }
        }
      }
    }
    expect(bad, `位置の説明が座標と合わない: ${bad.slice(0, 6).join(", ")}`).toHaveLength(0);
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
