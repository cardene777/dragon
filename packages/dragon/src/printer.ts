/**
 * 図の原本の JSON を、人が書く dragon記法へ書き戻す (#3137)。
 *
 * 並べ方は決まった形に整える。JSON の欄の並び順は見ず、欄の名前で読むので、
 * 同じ内容の JSON からは毎回同じ文字列になる。書き手の行の並べ方とコメントは保たない。
 * 段の中で起きることは JSON の並び順 (起きる順) のまま書く。
 * 状態遷移図の移れる道 (`state.paths`) は、帯の宣言の後、最初の `step` より前に JSON の並びのまま書く (#3163)。
 *
 * `"` で囲むのは要る時だけにする。`[` を含む名前と、`,` か `]` を含む属性の値と、`"` で始まる字を囲む。
 * 箱は JSON の並びのまま書き、同じ区画の箱が続く所を 1 つの `group … end` にする。
 * 区画の箱が飛び飛びの時は同じ `group` を開き直す。区画の並びが箱の現れる順と違う時と、
 * 箱の無い区画がある時は、先に全ての区画を中の無い `group … end` で宣言してから開き直す。
 * 枝分かれの図 (#3164) は、枝の `branch` の行を箱より前に書き、札を動かす線の運ぶ物が送る側の名前の札なら書かない。
 * 時間軸の図 (#3165) は、目盛りと区切りと印の列と節目と拡大の範囲の行を箱より前に書き、物差しの欄の後ろに `[meter: <割合>]` を書く。
 * 時間軸の図の `note` は属性を持てるので、`[` を含む字を `"` で囲む。
 * 段の出典 (#3199) は `say` と `code` の後ろ、段の中で起きることより前に、JSON の並びのまま 1 つずつ `source` の行に書く。
 */
import type { Box, Diagram, DiagramEvent, Region, TimeSpec } from "./schema";
import { AT, COPY, FROM, MERGE, NOW, ON } from "./words";

const quote = (text: string): string => `"${text.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
/** 行の終わりか `[` の前に置く名前と文 */
const name = (text: string): string => (text.includes("[") || text.startsWith('"') ? quote(text) : text);
/** `:` の前に置く字 (帯の題と、`set` の欄) */
const key = (text: string): string => (text.includes(":") || text.includes("[") || text.startsWith('"') ? quote(text) : text);
/** `strip` の行に `,` で並べる欄。時間軸の図の欄は後ろに物差しの属性を書けるので、`[` を含む名前も囲む */
const field = (text: string, time: boolean): string => (text.includes(",") || text.startsWith('"') || (time && text.includes("[")) ? quote(text) : text);
/** 属性の値 */
const value = (text: string): string => (text.includes(",") || text.includes("]") || text.startsWith('"') ? quote(text) : text);

/** 属性の並び。値の無い鍵は書かず、1 つも無ければ何も付けない */
const attrs = (pairs: [string, string | undefined][]): string => {
  const written = pairs.filter((pair): pair is [string, string] => pair[1] !== undefined);
  return written.length === 0 ? "" : ` [${written.map(([k, v]) => `${k}: ${value(v)}`).join(", ")}]`;
};

/** 名札と違う名前だけを `as` の後ろに書く */
const shown = (id: string, text: string): string => (text === id ? "" : ` as ${name(text)}`);

const declareRegion = (r: Region): string =>
  `group ${r.id}${shown(r.id, r.name)}${attrs([
    ["note", r.note],
    ["color", r.color],
    ["icon", r.icon],
  ])}`;
const declareBox = (b: Box): string =>
  `box ${b.id}${shown(b.id, b.name)}${attrs([
    ["note", b.sub],
    ["color", b.color],
    ["icon", b.icon],
    ["link", b.link],
  ])}`;

/** 線の行の両端と名前 */
const line = (from: string, to: string, label: string | undefined): string => `${from} -> ${to}${label === undefined ? "" : `: ${name(label)}`}`;

/** 目盛りの範囲。1 つの目盛りは番号だけを書く */
const range = (from: number, to: number): string => (from === to ? `${from}` : `${from}-${to}`);
/** 数の属性の値 */
const num = (n: number | undefined): string | undefined => (n === undefined ? undefined : `${n}`);

/** 段の中の 1 行。`kind` は図の種類。枝分かれの図の線は、送る側の名前の札を書かない時の運ぶ物にする */
function event(e: DiagramEvent, kind: Diagram["kind"]): string {
  switch (e.type) {
    case "edge": {
      const plain = kind === "git" ? e.carry.kind === "tag" && e.carry.text === e.from : e.carry.kind === "envelope";
      const carry: [string, string][] = plain ? [] : e.carry.kind === "tag" ? [["tag", e.carry.text]] : [["carry", e.carry.kind]];
      return `${line(e.from, e.to, e.label)}${attrs([...carry, ["side", e.labelSide], ["at", num(e.at)], ["into", num(e.into)]])}`;
    }
    case "action":
      return `act ${e.box}: ${e.label}`;
    case "swap":
      return kind === "time" ? `note ${e.box}: ${name(e.text)}${attrs([["color", e.color]])}` : `note ${e.box}: ${e.text}`;
    case "now":
      return `${NOW} -> ${e.to}`;
    case "mark":
      return `mark ${e.row} ${range(e.from, e.to)}${attrs([["color", e.color]])}`;
    case "span":
      return `span ${range(e.from, e.to)}: ${name(e.text)}${attrs([
        ["shape", e.shape],
        ["color", e.color],
      ])}`;
    case "strip":
      return `set ${key(e.field)}${e.value === undefined ? "" : `: ${name(e.value)}`}${attrs([["tag", e.tag]])}`;
    case "commit":
      return `commit ${e.id} ${ON} ${e.branch}${e.copy === undefined ? "" : ` ${COPY} ${e.copy}`}${e.merge === undefined ? "" : ` ${MERGE} ${e.merge}`}${attrs([
        ["hash", e.hash],
        ["note", e.note],
      ])}`;
    case "branch":
      return `${e.branch} ${FROM} ${e.from}`;
  }
}

/** 時間軸の図の目盛りと区切りと印の列と節目と拡大の範囲の宣言の塊 */
function timeBlocks(time: TimeSpec): string[] {
  const head = [
    `scale ${time.scale.unit} ${time.scale.length} ${time.scale.count}${attrs([["from", num(time.scale.from)]])}`,
    ...(time.period ? [`period ${time.period.name} ${time.period.length}${attrs([["from", num(time.period.from)]])}`] : []),
  ];
  const rows = time.rows.map(
    (r) =>
      `row ${r.id}${shown(r.id, r.name)}${attrs([
        ["color", r.color],
        ["empty", r.empty && r.empty.length > 0 ? r.empty.join(" ") : undefined],
      ])}`,
  );
  const points = (time.points ?? []).map((p) => `point ${p.id} ${AT} ${p.at}`);
  return [head.join("\n"), rows.join("\n"), ...(points.length > 0 ? [points.join("\n")] : []), ...(time.zoom ? [`zoom ${range(time.zoom.from, time.zoom.to)}`] : [])];
}

/** 区画と箱の宣言の塊。塊どうしは空行で区切る */
function declarations(diagram: Diagram): string[] {
  const regions = diagram.regions ?? [];
  const runs: { region?: string; boxes: Box[] }[] = [];
  for (const b of diagram.boxes) {
    const last = runs.at(-1);
    if (last && last.region === b.region) last.boxes.push(b);
    else runs.push({ ...(b.region !== undefined ? { region: b.region } : {}), boxes: [b] });
  }
  const opened = [...new Set(runs.flatMap((run) => (run.region === undefined ? [] : [run.region])))];
  const inOrder = opened.length === regions.length && opened.every((id, i) => regions[i]?.id === id);
  const declared = new Set<string>();
  const blocks: string[] = [];
  if (!inOrder) {
    for (const r of regions) {
      blocks.push(`${declareRegion(r)}\nend`);
      declared.add(r.id);
    }
  }
  for (const run of runs) {
    const lines = run.boxes.map(declareBox);
    if (run.region === undefined) {
      blocks.push(lines.join("\n"));
      continue;
    }
    const region = regions.find((r) => r.id === run.region);
    const open = declared.has(run.region) || !region ? `group ${run.region}` : declareRegion(region);
    declared.add(run.region);
    blocks.push([open, ...lines.map((line) => `  ${line}`), "end"].join("\n"));
  }
  return blocks;
}

export function printNotation(diagram: Diagram): string {
  const branches = (diagram.git?.branches ?? []).map((b) => `branch ${b.id}${attrs([["note", b.note]])}`);
  const time = diagram.kind === "time";
  const blocks = [
    `${diagram.kind} ${name(diagram.title)}${attrs([["view", diagram.view]])}`,
    ...(branches.length > 0 ? [branches.join("\n")] : []),
    ...(diagram.time ? timeBlocks(diagram.time) : []),
    ...declarations(diagram),
  ];
  if (diagram.strip) {
    const meters = new Map((diagram.strip.meters ?? []).map((m) => [m.field, m.line]));
    const fields = diagram.strip.fields.map((f) => `${field(f, time)}${attrs([["meter", meters.get(f)]])}`);
    blocks.push(`strip ${key(diagram.strip.title)}: ${fields.join(", ")}`);
  }
  if (diagram.state) blocks.push(diagram.state.paths.map((p) => line(p.from, p.to, p.label)).join("\n"));
  for (const step of diagram.steps) {
    const body = step.body.split("\n");
    const say = body.length === 1 ? [`  say ${step.body}`] : ["  say", ...body.map((line) => (line === "" ? "" : `    ${line}`))];
    blocks.push(
      [
        `step ${step.title}`,
        ...say,
        ...(step.code === undefined ? [] : [`  code ${step.code}`]),
        ...(step.sources ?? []).map((s) => `  source ${name(s.name)}${attrs([["url", s.url]])}`),
        ...step.events.map((e) => `  ${event(e, diagram.kind)}`),
      ].join("\n"),
    );
  }
  return `${blocks.join("\n\n")}\n`;
}
