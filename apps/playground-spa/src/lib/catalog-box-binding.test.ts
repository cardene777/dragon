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
import { computeStateValues, interpolate } from "@cardenelabs/cdl";

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
  // #1032 の 4 本目
  "tutorialVideoCards", "teamAttendanceGrid", "globalTimezoneClock", "signupFormSummary",
  "monthCalendarView", "cliTerminalSession", "chessStartingBoard", "sprintKanbanBoard",
  "docsBreadcrumb", "dayScheduleTimeline", "serverUptimeStatus", "weekCalendarView",
  "teamKpiComparison", "publishWorkflowSteps",
  // #1032 の 5 本目 (残り 17 件、 これで 84 件が完了)
  "teamPresenceStatus", "feedbackThumbRating", "startupOrgChart", "npsTrendKpi",
  "postReactionPoll", "voiceMessagePlayback", "teamThreadSummary", "loginOtpVerify",
  "prodLogTail", "opsAlertBanner", "serviceHealthGrid", "checkoutCartSummary",
  "saasPricingTier", "checkoutCouponApply", "blogArticlePreview", "docsTocNav",
  "socialShareButtons",
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
 * | `calendar-week` | 先頭 **7 件** (`max` ではない)、今日の日は予定の丸を出さない |
 * | `kanban-board` | 既知の 3 列に振り分け、列ごとに `max` 件 + 溢れ件数 |
 * | `status-timeline` | 状態を小文字にし、5 文字超なら先頭 4 文字を大文字で出す |
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
const SLICE_ONLY = new Set([
  "activity-feed", "chat-bubble", "commit-list", "event-log", "search-result",
  "video-card", "terminal", "timeline-vertical",
]);
/**
 * `max` ではなく **実装に埋め込まれた固定値** で切る種別。
 *
 * `max` を渡していても件数には効かない (`max` を持たない種別もある)。
 * 数はすべて `interactive-panel.tsx` の `slice(...)` から引いた。
 */
const FIXED_LIMIT: Record<string, number> = {
  "otp-input": 6,
  "service-health": 6,
  "toc-nav": 6,
  "share-buttons": 4,
};
function visibleSignature(kind: string, inputs: Array<[string, string]>, max: number | undefined, minBound?: number): string {
  const parse = (raw: string | undefined): unknown[] | undefined => {
    if (raw === undefined) return undefined;
    try {
      const v: unknown = JSON.parse(raw);
      return Array.isArray(v) ? v : undefined;
    } catch { return undefined; }
  };
  const asIs = () => JSON.stringify(inputs);
  /** 入力を field 名で引く (2 つ以上の入力から 1 つの絵を描く種別で使う)。 */
  const input = (field: string): string | undefined =>
    inputs.find(([name]) => name === field)?.[1];

  // 入力を 2 つ以上取る種別は、1 入力前提の `rows` に乗らないため先に処理する。
  // ここに書かないと、下の `if (!rows) return asIs()` で生の入力をそのまま返し、
  // 種別ごとの加工が **一度も実行されない** (実測 = 波形の 40 本上限が dead code だった)
  const num = (v: unknown): number => Number(v);
  switch (kind) {
    case "voice-message": {
      // 振幅は先頭 40 本まで、**数として読めない要素は棒にしない** (描画側は `push` しない)。
      // 各値は 0..1 に丸め、色が付く本数は `floor(本数 * 進み具合)` で決まる
      // **数として読めない要素を捨ててから 40 本に切る**。 順序が逆だと、先頭 40 件に
      // 不正値があった時に 41 件目が繰り上がらず、棒の本数が 1 本ずれる
      const amps = parse(input("source")) ?? [];
      const bars = amps.flatMap((v) => {
        const n = num(v);
        return Number.isFinite(n) ? [Math.max(0, Math.min(1, n))] : [];
      }).slice(0, 40);
      const rawP = num(input("progressSource"));
      const p = Number.isFinite(rawP) ? Math.max(0, Math.min(1, rawP)) : 0;
      return JSON.stringify({ bars, active: Math.floor(bars.length * p) });
    }
    case "kpi-trend-tile": {
      // 折れ線は履歴の **最小と最大で正規化** して描く。 平行移動や等倍した並びは
      // 同じ形になる。 差は `現在 - 前回` で、0 以上なら上向きの印になる
      const hist = (parse(input("historySource")) ?? []).map(num).filter(Number.isFinite);
      const lo = hist.length ? Math.min(...hist) : 0;
      const hi = hist.length ? Math.max(...hist) : 1;
      const range = hi - lo || 1;
      const cur = num(input("source"));
      const prev = num(input("prevSource"));
      const delta = (Number.isFinite(cur) ? cur : 0) - (Number.isFinite(prev) ? prev : 0);
      return JSON.stringify({
        cur: Number.isFinite(cur) ? cur : 0,
        delta,
        up: delta >= 0,
        spark: hist.map((v) => (v - lo) / range),
      });
    }
    case "step-progress": {
      // 現在位置は 0..(件数 - 1) に丸められる。 範囲の外を渡しても端で止まる
      const steps = parse(input("stepsSource")) ?? [];
      const raw = num(input("source"));
      const cur = Number.isFinite(raw) ? Math.max(0, Math.min(steps.length - 1, raw)) : 0;
      return JSON.stringify({ steps, cur });
    }
    case "breadcrumb": {
      // 現在位置は **整数として読む** (`1.2` と `1.8` はどちらも 1 段目を指す)。
      // 範囲の外なら末尾が現在になる (`-1` を渡すと末尾が濃くなる)
      const items = (parse(input("source")) ?? []).map(String);
      const raw = Number.parseInt(input("currentSource") ?? "", 10);
      const cur = Number.isFinite(raw) && raw >= 0 && raw < items.length ? raw : items.length - 1;
      return JSON.stringify({ items, cur });
    }
    case "order-status": {
      // 現在位置は四捨五入してから 0..(件数 - 1) に丸める
      const steps = parse(input("stepsSource")) ?? [];
      const raw = num(input("source"));
      const cur = Number.isFinite(raw) ? Math.max(0, Math.min(steps.length - 1, Math.round(raw))) : 0;
      return JSON.stringify({ steps, cur });
    }
    case "song-queue": {
      // `max` 件まで出し、現在位置は四捨五入する (範囲の外は -1 = どれも現在でない)
      const songs = parse(input("source")) ?? [];
      const raw = num(input("currentSource"));
      return JSON.stringify({
        shown: typeof max === "number" ? songs.slice(0, max) : songs,
        cur: Number.isFinite(raw) ? Math.round(raw) : -1,
      });
    }
    default:
      break;
  }
  // 値の並びと **名前の並び** を別々に取る種別。 値は `max` を基準に伸ばし、
  // 名前は文字としてそのまま出す。 名前だけを変えても絵は変わる (文字が出るため)
  if (input("labelSource") !== undefined && input("source") !== undefined && inputs.length === 2) {
    const vals = (parse(input("source")) ?? []).map((v) => {
      const n = num(v);
      return Number.isFinite(n) ? n : 0;
    });
    const base = max || 1;
    // 名前は **値の件数ぶんだけ** 描かれる。 余った名前は画面に出ず、
    // 足りない分は連番で補われる。 名前の並び全体を署名に入れると、
    // 出ない名前を変えただけで「絵が変わった」 と誤認する
    const names = (parse(input("labelSource")) ?? []).map(String);
    return JSON.stringify({
      bars: vals.map((v) => Math.max(0, Math.min(1, v / base))),
      labels: vals.map((_, i) => names[i] ?? String(i + 1)),
    });
  }
  if (kind === "attendance-grid") {
    // 行の 2 つ目以降を真偽として読み、印の有無に変える。
    // **列は人数ぶんだけ描かれる**。 人数を超えた真偽は升目にならないため署名に入れない
    const members = (parse(input("membersSource")) ?? []).map(String);
    const grid = (parse(input("source")) ?? []).flatMap((r) => {
      if (!Array.isArray(r) || r.length < 2) return [];
      return [[String(r[0]), ...members.map((_, i) => Boolean(r[i + 1]))]];
    });
    return JSON.stringify({ grid, members });
  }
  if (kind === "stacked-bar") {
    // 2 系列の高さは `min` / `max` で正規化してから 0..1 に切り詰める。
    // 値域の外に出た値は端で頭打ちになり、違う値が同じ高さの棒になる。
    // 数として読めない要素は 0 として扱う (描画側が `map` で 0 に倒す)
    const lo = minBound ?? 0;
    const hi = max ?? 1;
    const range = hi - lo || 1;
    const norm = (raw: string | undefined) => (parse(raw) ?? []).map((v) => {
      const n = num(v);
      return Math.max(0, Math.min(1, ((Number.isFinite(n) ? n : 0) - lo) / range));
    });
    return JSON.stringify({ a: norm(input("sourceA")), b: norm(input("sourceB")) });
  }

  const one = inputs.length === 1 ? inputs[0]![1] : undefined;
  const rows = parse(one);
  // 入力が 2 つ以上あるのにここへ届いたら、その種別の射影を書き忘れている。
  // 生の値で比べる形に静かに落とすと、描画側の加工で同じ絵になる段を見逃す
  if (!rows && inputs.length > 1) {
    throw new Error(`複数入力の射影が未実装: ${kind} (入力 ${inputs.map(([f]) => f).join(" / ")})`);
  }
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
    case "calendar-week":
      // 先頭 7 件だけを描き、**今日の日には予定の丸を出さない** (`hasEvent && !isToday`)。
      // 生の真偽 2 つを比べると、今日が移った時に入れ替わる予定の丸を見落とす
      return JSON.stringify(cut(7).map((r) => {
        if (!Array.isArray(r)) return r;
        const today = Boolean(r[2]);
        return [r[0], Boolean(r[1]) && !today, today];
      }));
    case "kanban-board": {
      // 既知の 3 列に振り分けてから列ごとに切る。 列をまたぐ入力の並びだけが違う
      // 2 段は同じ絵になる。 列名は小文字にして区切り文字を落として引く
      const buckets: Record<string, unknown[]> = { todo: [], inprogress: [], done: [] };
      for (const r of rows) {
        if (!Array.isArray(r)) continue;
        const key = String(r[0] ?? "").toLowerCase().replace(/[-_ ]/g, "");
        const b = buckets[key];
        if (b) b.push([r[1], r[2]]);
      }
      const lim = typeof max === "number" ? max : Number.POSITIVE_INFINITY;
      return JSON.stringify(Object.entries(buckets).map(([k, v]) =>
        [k, v.slice(0, lim), Math.max(0, v.length - Math.min(v.length, lim))]));
    }
    case "status-timeline": {
      // 画面に出るのは **色と表示名** の 2 つで、状態の生値ではない。
      // 色は小文字にした状態名で引き、無ければ灰色に落ちる。 表示名は 5 文字を超えると
      // 先頭 4 文字を大文字にして出す。 生値が違っても、この 2 つが同じなら同じ絵になる
      // (実測 = `active` と `activated` はどちらも `ACTI` + 灰色ではなく、色で分かれる)
      const colorOf = (s: string) =>
        ({ active: "#22c55e", idle: "#94a3b8", error: "#ef4444" } as Record<string, string>)[s] ?? "#cbd5e1";
      return JSON.stringify((typeof max === "number" ? cut(max) : rows).map((r) => {
        if (!Array.isArray(r)) return r;
        const s = String(r[1] ?? "").toLowerCase();
        return [r[0], colorOf(s), s.length > 5 ? s.slice(0, 4).toUpperCase() : s.toUpperCase()];
      }));
    }
    case "user-presence": {
      // `max` 件まで出し、**溢れた件数を「+N more」 として描く**。
      // 溢れ件数を落とすと、先頭が同じで人数だけ違う 2 段を同じ絵とみなす。
      // 名前は 24 文字を超えると末尾を省き、状態は小文字にして色を引く
      const users = rows.flatMap((r) => {
        if (!Array.isArray(r) || r.length < 2) return [];
        const name = String(r[0]);
        return [[name.length > 24 ? `${name.slice(0, 23)}…` : name, String(r[1]).toLowerCase()]];
      });
      const lim = typeof max === "number" ? max : users.length;
      return JSON.stringify({ shown: users.slice(0, lim), overflow: Math.max(0, users.length - lim) });
    }
    case "log-stream":
      // **末尾** 5 行だけを出す (`slice(-5)`)。 他の種別と切る向きが逆で、
      // 先頭を変えても絵が変わらず、末尾を変えた時だけ変わる。
      // 重さは 0..3 に丸め、本文は 24 文字を超えると末尾を省く
      return JSON.stringify(rows.slice(-5).map((r) => {
        if (!Array.isArray(r)) return r;
        const lv = Number(r[1]);
        const msg = String(r[2] ?? "");
        return [r[0], Number.isFinite(lv) ? Math.max(0, Math.min(3, Math.floor(lv))) : 1,
          msg.length > 24 ? `${msg.slice(0, 23)}…` : msg];
      }));
    case "pricing-tier":
      // 名前と価格の後、**3 つ目から 3 件まで** が特典として出る (index 2..4)
      return JSON.stringify([rows[0], rows[1], ...rows.slice(2, 5)]);
    default: {
      const fixed = FIXED_LIMIT[kind];
      if (fixed !== undefined) return JSON.stringify(cut(fixed));
      return JSON.stringify(SLICE_ONLY.has(kind) && typeof max === "number" ? cut(max) : rows);
    }
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
    /** 画面に出る行数の上限。 切られた行は順位の対象にしない。 */
    const VISIBLE_LIMIT: Record<string, number> = { "share-buttons": 4, "podium": 3 };
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
          // 画面に出る範囲だけで順位を見る。 切られて見えない行を数に入れると、
          // 「最も少ない」 が画面の外の行を指すことになる (実測 = 共有先を 5 つ渡すと
          // 先頭 4 つしか出ないのに、5 つ目を含めて順位を付けていた)
          const limit = VISIBLE_LIMIT[kind];
          const shown: unknown[] = limit === undefined ? rows : rows.slice(0, limit);
          let values: number[];
          if (RANK_BY_ORDER.has(kind)) {
            // 並び順がそのまま順位。 先頭ほど大きいとみなすため降順の連番を当てる
            values = shown.map((_, i) => shown.length - i);
          } else if (RANK_INDEX[kind] !== undefined) {
            const at = RANK_INDEX[kind]!;
            const picked = shown.map((r) => (Array.isArray(r) ? r[at] : undefined));
            if (!picked.every((v) => typeof v === "number")) continue;
            values = picked as number[];
          } else {
            // 行ごとに「ちょうど 1 つの数」 を取る。 取れない行がある配列は順位を付けられない
            const nums = shown.map((r) => (Array.isArray(r) ? r.filter((v) => typeof v === "number") : []));
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
            const scores = shown.map(score);
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
        // 積み上げ棒は `min` と `max` の 2 つで高さを正規化する
        const minBound = typeof r.min === "number" ? r.min : undefined;
        let prev: string | undefined;
        for (let i = 0; i < phases.length; i += 1) {
          // 状態の実効値は文字列か数値で入る (`sets` の `value` は `string | number`)。
          // それ以外は文字列化しても中身が読めないため、空として扱う
          const values = computeStateValues(laid, i, 1) as Record<string, string | number | undefined>;
          const inputs = fields.map(([f, s]) => {
            const raw = values[s];
            return [f, typeof raw === "string" || typeof raw === "number" ? String(raw) : ""] as [string, string];
          });
          const sig = visibleSignature(kind, inputs, max, minBound);
          if (prev !== undefined && sig === prev) {
            bad.push(`${k}/${String(r.id)}[段${i}]: 前段と描画結果が同じ`);
          }
          prev = sig;
        }
      }
    }
    expect(bad, `段を進めても表示が変わらない: ${bad.slice(0, 6).join(", ")}`).toHaveLength(0);
  });

  it("箱が語る有無が、段の渡す真偽と一致する", () => {
    // 順位でも位置でもなく「その行が印を持つか」 を語る箱がある。 描画側は真偽を
    // `Boolean()` で読んで印の有無に変えるため、値を false にしても他の検査には掛からない
    // (順位が付く数でも座標でもないため)。
    //
    // 箱と真偽の対応は 2 形ある。 どちらも `interactive-panel.tsx` の実装から引く。
    //
    // | 形 | 種別 | 箱の題が指すもの | 見る値 |
    // |---|---|---|---|
    // | 行 | `calendar-week` | 行の先頭 (曜日) | その行の 2 番目 |
    // | 列 | `attendance-grid` | 名前の一覧の要素 (人) | 全行の (その人の位置 + 1) 番目 |
    //
    // 列の形では「全行が真か」 を見る。 1 行でも偽なら「欠けが無い」 は成立しない。
    const ROW_FLAG: Record<string, number> = { "calendar-week": 1 };
    const COL_FLAG = new Set(["attendance-grid"]);
    const ROW_CLAIM = [
      { re: /予定を持つ/, want: true },
      { re: /予定を持たない/, want: false },
    ];
    const COL_CLAIM = [
      { re: /欠けが無い/, want: true },
      { re: /欠けがある/, want: false },
    ];
    const bad: string[] = [];
    for (const k of DRIVEN) {
      const d = mod[k]!;
      const r0 = ((d as { readouts?: Array<{ kind?: string; source?: string; membersSource?: string }> }).readouts ?? [])[0];
      const kind = String(r0?.kind ?? "");
      const at = ROW_FLAG[kind];
      const isCol = COL_FLAG.has(kind);
      if ((at === undefined && !isCol) || !r0?.source) continue;
      type Node = { id?: string; title?: string; subtitle?: string };
      const nodes = (d as { nodes?: Node[] }).nodes ?? [];
      // 列の形では、名前の一覧から人の位置を引く
      let members: string[] = [];
      if (isCol && r0.membersSource) {
        // 名前の一覧は JSON 文字列で状態に入る (`arraySignal` が文字列化して持つ)
        const st = (d as { states?: Array<{ id?: string; initial?: string | number }> }).states
          ?.find((x) => x.id === r0.membersSource);
        try {
          const v: unknown = JSON.parse(typeof st?.initial === "string" ? st.initial : "");
          if (Array.isArray(v)) members = v.map((x) => String(x));
        } catch { /* 引けない図は対象外 */ }
      }
      for (const [pi, p] of ((d as { phases?: Array<{ sets?: Array<{ stateId?: string; value?: string | number }> }> }).phases ?? []).entries()) {
        for (const st of p.sets ?? []) {
          if (st.stateId !== r0.source) continue;
          let rows: unknown;
          try { rows = JSON.parse(String(st.value ?? "")); } catch { continue; }
          if (!Array.isArray(rows)) continue;
          for (const n of nodes) {
            if (!n.title) continue;
            const title = n.title.toLowerCase();
            if (isCol) {
              const claim = COL_CLAIM.find((f) => f.re.test(n.subtitle ?? ""));
              if (!claim) continue;
              const mi = members.findIndex((m) => m.toLowerCase() === title);
              if (mi < 0) { bad.push(`${k}/${n.id}: 題 "${n.title}" が名前の一覧に無い`); continue; }
              const allTrue = rows.every((r) => Array.isArray(r) && Boolean(r[mi + 1]));
              if (allTrue !== claim.want) {
                bad.push(`${k}/${n.id}[段${pi}]: "${n.subtitle}" だが全行が真か = ${String(allTrue)}`);
              }
              continue;
            }
            const claim = ROW_CLAIM.find((f) => f.re.test(n.subtitle ?? ""));
            if (!claim) continue;
            const row = rows.find((r) => Array.isArray(r)
              && typeof r[0] === "string" && r[0].toLowerCase() === title);
            if (!Array.isArray(row)) continue;
            if (Boolean(row[at!]) !== claim.want) {
              bad.push(`${k}/${n.id}[段${pi}]: "${n.subtitle}" だが値は ${String(row[at!])}`);
            }
          }
        }
      }
    }
    expect(bad, `有無の説明が値と合わない: ${bad.slice(0, 6).join(", ")}`).toHaveLength(0);
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
