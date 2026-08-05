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
 * 描画側が値をどう絵にするかの射影。 生の値が違っても画面が同じになる形を捕まえる。
 *
 * 射影の根拠は `cdl/packages/cdl/src/render/interactive-panel.tsx` の各 readout 実装。
 * 表に無い種別は生の値をそのまま返す (加工しない種別は生値の一致 = 画面の一致)。
 *
 * | 種別 | 描画側の加工 |
 * |---|---|
 * | `poll-bar` | `count / 総数` の百分率で帯を伸ばし、最大の行に ★ を付ける |
 * | `reaction-bar` | `count > 0` の行だけ札にする (0 件は札自体が出ない) |
 * | `podium` | 先頭 3 件だけ台にする |
 * | `user-stack` | `max` 件まで丸にし、超えた分は残り件数として出す |
 * | `ROW_LIMIT_KINDS` | `max` 件までしか出さない |
 * | 既定 | 加工しない (生値の一致 = 画面の一致) |
 *
 * **`max` の意味は種別で違う**。 件数の上限として使う種別と、色や長さの基準値として
 * 使う種別 (`calendar-heatmap` は濃さの基準、`progress-group` / `radar` は帯の基準) がある。
 * 既定で件数として切ると、基準値を持つ種別で「先頭 N 件が同じなら同じ絵」 と誤判定する
 * (実測 = 30 日の升目を上限 10 で切り、後半だけ違う 2 段を同じとみなした)。
 * 下の集合は `interactive-panel.tsx` で `slice(0, max)` を持つ種別だけを列挙している。
 */
const ROW_LIMIT_KINDS = new Set([
  "array-list", "leaderboard", "activity-feed", "chat-bubble", "user-stack",
  "commit-list", "event-log", "search-result", "video-card", "song-queue",
  "terminal", "kanban-board", "timeline-vertical", "status-timeline", "user-presence",
]);
function visibleSignature(kind: string, raw: string, max: number | undefined): string {
  let rows: unknown;
  try { rows = JSON.parse(raw); } catch { return raw; }
  if (!Array.isArray(rows)) return raw;
  const at = (r: unknown, i: number): number =>
    Array.isArray(r) && typeof r[i] === "number" ? (r[i] as number) : Number.NaN;
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
      return JSON.stringify(rows.slice(0, 3));
    case "user-stack":
      return typeof max === "number"
        ? `${JSON.stringify(rows.slice(0, max))}+${Math.max(0, rows.length - max)}`
        : JSON.stringify(rows);
    default:
      return JSON.stringify(
        ROW_LIMIT_KINDS.has(kind) && typeof max === "number" ? rows.slice(0, max) : rows,
      );
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
      for (const r of (d as { readouts?: Array<{ id?: string; kind?: string; source?: string; max?: number }> }).readouts ?? []) {
        if (!r.source || owned.has(r.source)) continue;
        let prev: string | undefined;
        for (let i = 0; i < phases.length; i += 1) {
          // 状態の実効値は文字列か数値で入る (`sets` の `value` は `string | number`)。
          // それ以外は文字列化しても中身が読めないため、空として扱う
          const values = computeStateValues(laid, i, 1) as Record<string, string | number | undefined>;
          const raw = values[r.source];
          const sig = visibleSignature(String(r.kind ?? ""), typeof raw === "string" || typeof raw === "number" ? String(raw) : "", r.max);
          if (prev !== undefined && sig === prev) {
            bad.push(`${k}/${r.id}[段${i}]: 前段と描画結果が同じ`);
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
    const AXIS: Record<string, { x: number; y: number }> = { "map-pin": { x: 1, y: 2 } };
    /** 主張の語と、その語が要求する「軸の値が最小か最大か」。 y は大きいほど下。 */
    const DIR = [
      { re: /最も左/, axis: "x" as const, want: "min" as const },
      { re: /最も右/, axis: "x" as const, want: "max" as const },
      { re: /最も上/, axis: "y" as const, want: "min" as const },
      { re: /最も下/, axis: "y" as const, want: "max" as const },
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
            for (const dir of DIR) {
              if (!dir.re.test(n.subtitle ?? "") || !n.title) continue;
              const title = n.title.toLowerCase();
              const idx = rows.findIndex((r) => Array.isArray(r)
                && typeof r[0] === "string" && r[0].toLowerCase() === title);
              if (idx < 0) continue;
              const at = dir.axis === "x" ? ax.x : ax.y;
              const vals = rows.map((r) => (Array.isArray(r) ? r[at] : undefined));
              if (!vals.every((v) => typeof v === "number")) continue;
              const nums = vals as number[];
              const want = dir.want === "min" ? Math.min(...nums) : Math.max(...nums);
              if (nums[idx] !== want) {
                bad.push(`${k}/${n.id}[段${pi}]: "${n.subtitle}" だが ${dir.axis}=${nums[idx]} (端は ${want})`);
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
