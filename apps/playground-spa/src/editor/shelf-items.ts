/**
 * 左の棚の中身 (#3031)。見本の一覧、部品、記法の早見。
 *
 * 部品の行と早見の行は、図に 1 つ足した図を `printNotation` で書き、足す前の図を書いた行との差から作る。
 * 記法の語 (`区画` や `[札 …]`) は `@cardenelabs/dragon` の語の表だけが持ち、ここには写さない。
 * 差の行のうち、最初の段の見出しより前の行は宣言、見出しから後の行は段の中の行として扱う。
 */
import { type Diagram, type DiagramEvent, FORMAT_VERSION, type NotationLang, parseNotation, printNotation, type Step } from "@cardenelabs/dragon";

import { EXAMPLE_KEYS, type ExampleKey, exampleText } from "../examples";

export interface Sample {
  key: ExampleKey;
  title: string;
}

export interface SampleGroup {
  kind: Diagram["kind"];
  samples: Sample[];
}

/** 見本を図の種類ごとに束ねる。題と種類は見本の記法から読む */
export function sampleGroups(lang: NotationLang): SampleGroup[] {
  const groups: SampleGroup[] = [];
  for (const key of EXAMPLE_KEYS) {
    const parsed = parseNotation(exampleText(key, lang), { lang });
    if (!parsed.ok) continue;
    const { kind, title } = parsed.diagram;
    const group = groups.find((g) => g.kind === kind);
    if (group) group.samples.push({ key, title });
    else groups.push({ kind, samples: [{ key, title }] });
  }
  return groups;
}

/** 足した行。`declarations` は最初の段の見出しより前、`steps` は見出しから後に足された行 */
export interface Added {
  declarations: string[];
  steps: string[];
}

/** `after` を書いた行のうち、`before` を書いた行に無い行。空の行は数えない */
export function addedLines(before: Diagram, after: Diagram, lang: NotationLang): Added {
  const remaining = new Map<string, number>();
  for (const line of printNotation(before, { lang }).split("\n")) remaining.set(line, (remaining.get(line) ?? 0) + 1);
  const lines = printNotation(after, { lang }).split("\n");
  const firstStep = lines.findIndex((line) => line.startsWith("#"));
  const added: Added = { declarations: [], steps: [] };
  lines.forEach((line, i) => {
    const left = remaining.get(line) ?? 0;
    if (left > 0) {
      remaining.set(line, left - 1);
      return;
    }
    if (line.trim() === "") return;
    (firstStep >= 0 && i >= firstStep ? added.steps : added.declarations).push(line);
  });
  return added;
}

/**
 * 書く欄の記法に行を足す。宣言は最初の段の見出しの前 (宣言の並びの終わり)、段の中の行は末尾 (最後の段) に足す。
 * 新しい段は前に空の行を 1 つ置く。`line` は足した最初の行の番号 (1 から)。
 */
export function insertLines(text: string, added: Added): { text: string; line: number } {
  const lines = text.replace(/\s+$/u, "").split("\n");
  let first = -1;
  if (added.declarations.length > 0) {
    const head = lines.findIndex((l, i) => i > 0 && l.trimStart().startsWith("#"));
    let at = head < 0 ? lines.length : head;
    while (at > 1 && lines[at - 1]?.trim() === "") at--;
    lines.splice(at, 0, ...added.declarations);
    first = at;
  }
  if (added.steps.length > 0) {
    const block = added.steps[0]?.startsWith("#") ? ["", ...added.steps] : added.steps;
    if (first < 0) first = lines.length + (block[0] === "" ? 1 : 0);
    lines.push(...block);
  }
  return { text: lines.join("\n"), line: first + 1 };
}

export const PART_IDS = ["box", "region", "step", "edge", "edge-tag", "edge-coin", "edge-none", "edge-below", "action", "swap", "strip"] as const;
export type PartId = (typeof PART_IDS)[number];

/** 部品で足す中身の仮の名前。記法の語ではなく、書き手が書き換える前提の字で、記法の言葉ごとに持つ */
const CONTENT = {
  ja: {
    box: "箱",
    newBox: "新しい箱",
    region: "区画",
    newRegion: "新しい区画",
    newStep: "新しい段",
    stepBody: "この段で起きることを書く。",
    call: "呼ぶ",
    handOver: "渡す",
    key: "鍵",
    pay: "払う",
    notify: "知らせる",
    process: "処理する",
    rewritten: "書き換えた字",
    stripTitle: "状態",
    stripField: "値",
    stripValue: "1",
  },
  en: {
    box: "box",
    newBox: "New box",
    region: "zone",
    newRegion: "New region",
    newStep: "New step",
    stepBody: "Write what happens in this step.",
    call: "call",
    handOver: "hand over",
    key: "key",
    pay: "pay",
    notify: "notify",
    process: "process",
    rewritten: "Rewritten",
    stripTitle: "State",
    stripField: "value",
    stripValue: "1",
  },
} as const satisfies Record<NotationLang, Record<string, string>>;

type Content = (typeof CONTENT)[NotationLang];

/** 箱と区画の名札と重ならない `prefix` + 番号 */
function freshId(d: Diagram, prefix: string): string {
  const used = new Set([...d.boxes.map((b) => b.id), ...(d.regions ?? []).map((r) => r.id)]);
  let n = 1;
  while (used.has(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}

/** 箱を 1 つ足す。構成図では最後の箱と同じ区画に入れ、時系列図では生存線にも足す */
function withBox(d: Diagram, c: Content, region?: string): { diagram: Diagram; id: string } {
  const id = freshId(d, c.box);
  const inside = region ?? (d.kind === "architecture" ? d.boxes.at(-1)?.region : undefined);
  const box = { id, name: c.newBox, ...(inside ? { region: inside } : {}) };
  const sequence = d.sequence ? { sequence: { lifelines: [...d.sequence.lifelines, id] } } : {};
  return { id, diagram: { ...d, boxes: [...d.boxes, box], ...sequence } };
}

/** 線の両端。箱が 1 つしかない時は相手の箱を足す */
function pair(d: Diagram, c: Content): { diagram: Diagram; from: string; to: string } {
  const [a, b] = d.boxes;
  if (a && b) return { diagram: d, from: a.id, to: b.id };
  const added = withBox(d, c);
  return { diagram: added.diagram, from: a?.id ?? added.id, to: added.id };
}

/** 最後の段の終わりに起きることを 1 つ足す */
function withEvent(d: Diagram, event: DiagramEvent): Diagram {
  const last = d.steps.at(-1);
  if (!last) return d;
  return { ...d, steps: [...d.steps.slice(0, -1), { ...last, events: [...last.events, event] }] };
}

const edge =
  (carry: Extract<DiagramEvent, { type: "edge" }>["carry"], label: keyof Content, labelSide?: "below") =>
  (d: Diagram, c: Content): Diagram => {
    const p = pair(d, c);
    return withEvent(p.diagram, { type: "edge", from: p.from, to: p.to, label: c[label], carry, ...(labelSide ? { labelSide } : {}) });
  };

const BUILD: Record<PartId, (d: Diagram, c: Content) => Diagram> = {
  box: (d, c) => withBox(d, c).diagram,
  region: (d, c) => {
    const id = freshId(d, c.region);
    return withBox({ ...d, regions: [...(d.regions ?? []), { id, name: c.newRegion }] }, c, id).diagram;
  },
  step: (d, c) => {
    const p = pair(d, c);
    const step: Step = { title: c.newStep, body: c.stepBody, events: [{ type: "edge", from: p.from, to: p.to, label: c.call, carry: { kind: "envelope" } }] };
    return { ...p.diagram, steps: [...p.diagram.steps, step] };
  },
  edge: edge({ kind: "envelope" }, "call"),
  "edge-tag": (d, c) => edge({ kind: "tag", text: c.key }, "handOver")(d, c),
  "edge-coin": edge({ kind: "coin" }, "pay"),
  "edge-none": edge({ kind: "none" }, "notify"),
  "edge-below": edge({ kind: "envelope" }, "call", "below"),
  action: (d, c) => withEvent(d, { type: "action", box: d.boxes[0]?.id ?? "", label: c.process }),
  swap: (d, c) => withEvent(d, { type: "swap", box: d.boxes[0]?.id ?? "", text: c.rewritten }),
  strip: (d, c) => {
    const strip = d.strip ?? { title: c.stripTitle, fields: [c.stripField] };
    return withEvent({ ...d, strip }, { type: "strip", field: strip.fields[0] ?? c.stripField, value: c.stripValue });
  },
};

/** 部品を `base` の図に足した時に足される行。`lang` は書く欄の記法の言葉 */
export const partLines = (id: PartId, base: Diagram, lang: NotationLang): Added => addedLines(base, BUILD[id](base, CONTENT[lang]), lang);

export type SyntaxId = "kind" | "view" | "region" | "box" | "strip" | "step" | "code" | "edge" | "carry" | "side" | "action" | "swap" | "strip-value" | "comment";

/** 早見の行に置く穴の名前。`<名札>` のように山括弧で囲んで出す */
const HOLE = {
  ja: { title: "題", id: "名札", name: "名前", note: "添え書き", color: "色", icon: "印", field: "欄", value: "値", tag: "札", stepTitle: "段の題", stepBody: "段の本文", command: "命令", label: "線の名前", action: "処理の名前", text: "字", memo: "メモ" },
  en: { title: "title", id: "id", name: "name", note: "note", color: "color", icon: "icon", field: "field", value: "value", tag: "tag", stepTitle: "step title", stepBody: "step body", command: "command", label: "label", action: "action", text: "text", memo: "memo" },
} as const satisfies Record<NotationLang, Record<string, string>>;

/** 記法の行の形。穴の字は型の値 (色の名前など) に当たらないので、書くためだけに図の形として扱う */
export function syntaxLines(lang: NotationLang): { id: SyntaxId; lines: string[] }[] {
  const h = Object.fromEntries(Object.entries(HOLE[lang]).map(([k, v]) => [k, `<${v}>`])) as Record<keyof (typeof HOLE)["ja"], string>;
  const draw = (shape: object): Diagram => shape as Diagram;
  const empty = (kind: Diagram["kind"]): Diagram => draw({ version: FORMAT_VERSION, kind, title: h.title, boxes: [], steps: [] });
  const base = empty("sequence");
  const step = { title: h.stepTitle, body: h.stepBody, events: [] as DiagramEvent[] };
  const withStep = draw({ ...base, steps: [step] });
  const inStep = (events: object[], extra: object = {}): Diagram => draw({ ...base, ...extra, steps: [{ ...step, events }] });
  const edgeOf = (carry: object, labelSide?: string): object => ({ type: "edge", from: h.id, to: h.id, label: h.label, carry, ...(labelSide ? { labelSide } : {}) });
  const diff = (pairs: [Diagram, Diagram][]): string[] =>
    pairs.flatMap(([before, after]) => {
      const added = addedLines(before, after, lang);
      return [...added.declarations, ...added.steps];
    });
  const strip = { title: h.title, fields: [h.field] };
  const head = (d: Diagram): string => printNotation(d, { lang }).split("\n")[0] ?? "";
  return [
    { id: "kind", lines: [head(base), head(empty("architecture"))] },
    { id: "view", lines: diff([[base, draw({ ...base, view: "fixed" })], [base, draw({ ...base, view: "follow" })]]) },
    { id: "region", lines: diff([[base, draw({ ...base, regions: [{ id: h.id, name: h.name, note: h.note, color: h.color, icon: h.icon }] })]]) },
    { id: "box", lines: diff([[base, draw({ ...base, boxes: [{ id: h.id, name: h.name, sub: h.note, color: h.color, icon: h.icon, region: h.id }] })]]) },
    { id: "strip", lines: diff([[base, draw({ ...base, strip: { title: h.title, fields: [h.field, h.field] } })]]) },
    { id: "step", lines: diff([[base, withStep]]) },
    { id: "code", lines: diff([[withStep, draw({ ...base, steps: [{ ...step, code: h.command }] })]]) },
    { id: "edge", lines: diff([[withStep, inStep([edgeOf({ kind: "envelope" })])]]) },
    { id: "carry", lines: diff([{ kind: "tag", text: h.value }, { kind: "coin" }, { kind: "none" }].map((carry) => [withStep, inStep([edgeOf(carry)])])) },
    { id: "side", lines: diff(["above", "below", "left", "right"].map((side) => [withStep, inStep([edgeOf({ kind: "envelope" }, side)])])) },
    { id: "action", lines: diff([[withStep, inStep([{ type: "action", box: h.id, label: h.action }])]]) },
    { id: "swap", lines: diff([[withStep, inStep([{ type: "swap", box: h.id, text: h.text }])]]) },
    { id: "strip-value", lines: diff([[draw({ ...withStep, strip }), inStep([{ type: "strip", field: h.field, value: h.value, tag: h.tag }], { strip })]]) },
    { id: "comment", lines: [`// ${h.memo}`] },
  ];
}
