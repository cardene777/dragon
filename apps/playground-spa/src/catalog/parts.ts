/**
 * カタログの部品の表 (#3166)。
 *
 * package の描く部品 (`render/parts.ts`) は図の種類の間で共通で、図の種類ごとに違うのは並べ方だけなので、
 * カタログは「どの図でも使える部品」「図の種類だけの部品」「図 (部品を組み合わせた物と見本)」の 3 段に並べる。
 *
 * 1 行は部品の名札と、その部品を描ける図の種類と、その部品が受け持つ記法の語を持つ。図の種類を 2 つ以上持つ部品が、どの図でも使える部品。
 * 列の図 (#3239) は線と箱の中の処理を持たないので、線と線の名前と運ぶ物と絵と飛び先と箱の中の処理の部品は、列の図を除いた図の種類を持つ。
 * 語は `kind:<図の種類>`、`head:<行の頭の語>`、`attr:<行>.<鍵>`、線の行の `edge:->`、枝分かれの図の行の中の語の `git:<語>` の形で書き、
 * package の記法の語の表 (`words.ts`) の語を、どれかの部品が必ず受け持つ (`catalog-parts.test.ts` が数える)。
 * 区画は時系列図に描かれないので、区画の属性 (`attr:group.*`) は区画の部品が受け持つ。
 * 色の役と絵と小さな字の部品は、構成図の図で同じ属性を区画にも付けて見せる。
 *
 * 部品の図は `parts/<名札>.<図の種類>.dragon` と英語の `.en.dragon` の記法の file で、file の名前から引く。
 * 部品の図の記法は最初に読む script に入れず、1 つの塊にして後から読む (#3246)。
 *
 * 部品の頁は、その部品の語を 1 つでも使う見本を並べる (#3167)。見本が語を使うかは、見本の記法から作った原本の JSON の形で決める。
 */
import { type Diagram, type DiagramEvent, parseNotation } from "@cardenelabs/dragon/light";

import { EXAMPLE_KEYS, type ExampleKey, exampleText, LATER_EXAMPLES } from "../examples";
import { laterChunk } from "../site/later";
import { type Lang, TEXT } from "../text";
import { KINDS, type Kind } from "./catalog";

/** 部品の名札。名前と説明は `TEXT.<言葉>.site.catalog.parts` が持つ */
export type PartId = keyof typeof TEXT.ja.site.catalog.parts;

export interface Part {
  readonly id: PartId;
  readonly kinds: readonly Kind[];
  readonly words: readonly string[];
}

/** 線を引ける図の種類。列の図は線と箱の中の処理を持たない */
const LINED = KINDS.filter((kind) => kind !== "lineup");

/** 部品の表。並びは一覧の札と図の頁の使う部品の並び */
export const PARTS: readonly Part[] = [
  { id: "box", kinds: KINDS, words: ["head:box"] },
  { id: "edge", kinds: LINED, words: ["edge:->"] },
  { id: "edge-label", kinds: LINED, words: ["attr:edge.side"] },
  { id: "carry", kinds: LINED, words: ["attr:edge.carry", "attr:edge.tag"] },
  { id: "color", kinds: KINDS, words: ["attr:box.color"] },
  { id: "icon", kinds: LINED, words: ["attr:box.icon"] },
  { id: "link", kinds: LINED, words: ["attr:box.link"] },
  { id: "note", kinds: KINDS, words: ["attr:box.note", "head:note"] },
  { id: "act", kinds: LINED, words: ["head:act"] },
  { id: "strip", kinds: KINDS, words: ["head:strip", "head:set", "attr:set.tag"] },
  { id: "step", kinds: KINDS, words: ["head:step", "head:say", "head:code", "attr:diagram.view"] },
  { id: "source", kinds: KINDS, words: ["head:source", "attr:source.url"] },
  { id: "lifeline", kinds: ["sequence"], words: ["kind:sequence"] },
  { id: "group", kinds: ["architecture"], words: ["kind:architecture", "head:group", "head:end", "attr:group.note", "attr:group.color", "attr:group.icon"] },
  { id: "start-finish", kinds: ["state"], words: ["kind:state", "edge:start", "edge:finish"] },
  { id: "side-path", kinds: ["state"], words: ["edge:before-step"] },
  { id: "branch", kinds: ["git"], words: ["kind:git", "head:branch", "attr:branch.note", "git:from"] },
  { id: "commit", kinds: ["git"], words: ["head:commit", "attr:commit.hash", "attr:commit.note"] },
  { id: "copy", kinds: ["git"], words: ["git:copy"] },
  { id: "merge", kinds: ["git"], words: ["git:merge"] },
  // 時間軸の図 (#3165)。中身の帯の物差し (`attr:strip.meter`) は時間軸の図でしか書けないので、目盛りと針の部品が受け持つ
  {
    id: "scale",
    kinds: ["time"],
    words: ["kind:time", "head:scale", "attr:scale.from", "head:period", "attr:period.from", "head:span", "attr:span.shape", "attr:span.color", "attr:strip.meter"],
  },
  { id: "row", kinds: ["time"], words: ["head:row", "attr:row.color", "attr:row.empty", "head:mark", "attr:mark.color"] },
  { id: "point", kinds: ["time"], words: ["head:point", "attr:note.color"] },
  { id: "zoom", kinds: ["time"], words: ["head:zoom", "attr:edge.at", "attr:edge.into"] },
  // 木の図 (#3233)
  { id: "leaf", kinds: ["tree"], words: ["kind:tree", "head:leaf", "attr:leaf.hash"] },
  { id: "node", kinds: ["tree"], words: ["head:node", "attr:node.hash"] },
  // 列の図 (#3239)
  { id: "item", kinds: ["lineup"], words: ["kind:lineup", "head:item", "attr:item.color", "attr:item.label"] },
  { id: "line", kinds: ["lineup"], words: ["head:line"] },
  { id: "seal", kinds: ["lineup"], words: ["head:seal", "head:open"] },
  { id: "pick", kinds: ["lineup"], words: ["head:pick"] },
  { id: "stamp", kinds: ["lineup"], words: ["head:stamp"] },
];

/** どの図でも使える部品か。図の種類を 2 つ以上持つ */
export const isCommon = (part: Part): boolean => part.kinds.length > 1;

/** 名札の部品。表に無ければ `undefined` */
export const partOf = (id: string | undefined): Part | undefined => PARTS.find((part) => part.id === id);

/** その図の種類で使える部品。部品の表の並び */
export const partsOf = (kind: Kind): Part[] => PARTS.filter((part) => part.kinds.includes(kind));

/** 部品の図の記法の塊。`snippets.ts` を 1 つの塊にして後から読む (#3246) */
export const LATER_SNIPPETS = laterChunk(() => import("./snippets").then((m) => m.SNIPPETS));

/** 部品をその図の種類で描いた図の記法。部品の図の塊がまだ届いていないか読めなかった時は `undefined` */
export function snippetOf(id: PartId, kind: Kind, lang: Lang): string | undefined {
  const later = LATER_SNIPPETS.state();
  if (later.status !== "ready") return undefined;
  return (later.value[`./parts/${id}.${kind}${lang === "en" ? ".en" : ""}.dragon`] ?? "").trimEnd();
}

const events = (d: Diagram): DiagramEvent[] => d.steps.flatMap((step) => step.events);
const edges = (d: Diagram) => events(d).flatMap((e) => (e.type === "edge" ? [e] : []));
const commits = (d: Diagram) => events(d).flatMap((e) => (e.type === "commit" ? [e] : []));
const spans = (d: Diagram) => events(d).flatMap((e) => (e.type === "span" ? [e] : []));
/** 札を運ぶ線のうち、札を書いた線。枝分かれの図の線は書かなければ送る側の名前の札を運ぶので、その札は書いた札に数えない */
const writtenTag = (d: Diagram, e: ReturnType<typeof edges>[number]): boolean => e.carry.kind === "tag" && !(d.kind === "git" && e.carry.text === e.from);

/**
 * 記法の語ごとの、図がその語を使ったか。原本の JSON のどこに現れるかで決める。
 * 区画の行を閉じる `end` は区画があれば必ず書くので、区画があるかで決める
 */
const USES: Readonly<Record<string, (d: Diagram) => boolean>> = {
  "kind:sequence": (d) => d.kind === "sequence",
  "kind:architecture": (d) => d.kind === "architecture",
  "kind:state": (d) => d.kind === "state",
  "kind:git": (d) => d.kind === "git",
  "head:group": (d) => (d.regions ?? []).length > 0,
  "head:end": (d) => (d.regions ?? []).length > 0,
  "head:box": (d) => d.boxes.length > 0,
  "head:strip": (d) => d.strip !== undefined,
  "head:step": (d) => d.steps.length > 0,
  "head:say": (d) => d.steps.some((step) => step.body !== ""),
  "head:code": (d) => d.steps.some((step) => step.code !== undefined),
  "head:source": (d) => d.steps.some((step) => step.sources !== undefined),
  "head:act": (d) => events(d).some((e) => e.type === "action"),
  "head:note": (d) => events(d).some((e) => e.type === "swap"),
  "head:set": (d) => events(d).some((e) => e.type === "strip"),
  "attr:diagram.view": (d) => d.view !== undefined,
  "attr:group.note": (d) => (d.regions ?? []).some((r) => r.note !== undefined),
  "attr:group.color": (d) => (d.regions ?? []).some((r) => r.color !== undefined),
  "attr:group.icon": (d) => (d.regions ?? []).some((r) => r.icon !== undefined),
  "attr:box.note": (d) => d.boxes.some((b) => b.sub !== undefined),
  "attr:box.color": (d) => d.boxes.some((b) => b.color !== undefined),
  "attr:box.icon": (d) => d.boxes.some((b) => b.icon !== undefined),
  "attr:box.link": (d) => d.boxes.some((b) => b.link !== undefined),
  "attr:source.url": (d) => d.steps.some((step) => step.sources !== undefined),
  "attr:edge.carry": (d) => edges(d).some((e) => e.carry.kind === "coin" || e.carry.kind === "none"),
  "attr:edge.tag": (d) => edges(d).some((e) => writtenTag(d, e)),
  "attr:edge.side": (d) => edges(d).some((e) => e.labelSide !== undefined),
  "attr:set.tag": (d) => events(d).some((e) => e.type === "strip" && e.tag !== undefined),
  "edge:->": (d) => edges(d).length > 0,
  "edge:start": (d) => edges(d).some((e) => e.from === "start"),
  "edge:finish": (d) => edges(d).some((e) => e.to === "finish"),
  "edge:before-step": (d) => (d.state?.paths ?? []).length > 0,
  "head:branch": (d) => (d.git?.branches ?? []).length > 0,
  "head:commit": (d) => commits(d).length > 0,
  "attr:branch.note": (d) => (d.git?.branches ?? []).some((b) => b.note !== undefined),
  "attr:commit.hash": (d) => commits(d).some((c) => c.hash !== undefined),
  "attr:commit.note": (d) => commits(d).some((c) => c.note !== undefined),
  "git:from": (d) => events(d).some((e) => e.type === "branch"),
  "git:copy": (d) => commits(d).some((c) => c.copy !== undefined),
  "git:merge": (d) => commits(d).some((c) => c.merge !== undefined),
  "kind:time": (d) => d.kind === "time",
  "head:scale": (d) => d.time !== undefined,
  "attr:scale.from": (d) => d.time?.scale.from !== undefined,
  "head:period": (d) => d.time?.period !== undefined,
  "attr:period.from": (d) => d.time?.period?.from !== undefined,
  "head:span": (d) => spans(d).length > 0,
  "attr:span.shape": (d) => spans(d).some((e) => e.shape !== undefined),
  "attr:span.color": (d) => spans(d).some((e) => e.color !== undefined),
  "attr:strip.meter": (d) => (d.strip?.meters ?? []).length > 0,
  "head:row": (d) => (d.time?.rows ?? []).length > 0,
  "attr:row.color": (d) => (d.time?.rows ?? []).some((r) => r.color !== undefined),
  "attr:row.empty": (d) => (d.time?.rows ?? []).some((r) => r.empty !== undefined),
  "head:mark": (d) => events(d).some((e) => e.type === "mark"),
  "attr:mark.color": (d) => events(d).some((e) => e.type === "mark"),
  "head:point": (d) => (d.time?.points ?? []).length > 0,
  "attr:note.color": (d) => events(d).some((e) => e.type === "swap" && e.color !== undefined),
  "head:zoom": (d) => d.time?.zoom !== undefined,
  "attr:edge.at": (d) => edges(d).some((e) => e.at !== undefined),
  "attr:edge.into": (d) => edges(d).some((e) => e.into !== undefined),
  "kind:tree": (d) => d.kind === "tree",
  "head:leaf": (d) => events(d).some((e) => e.type === "leaf"),
  "attr:leaf.hash": (d) => events(d).some((e) => e.type === "leaf" && e.hash !== undefined),
  "head:node": (d) => events(d).some((e) => e.type === "node"),
  "attr:node.hash": (d) => events(d).some((e) => e.type === "node" && e.hash !== undefined),
  "kind:lineup": (d) => d.kind === "lineup",
  "head:item": (d) => (d.lineup?.items ?? []).length > 0,
  "attr:item.color": (d) => (d.lineup?.items ?? []).some((i) => i.color !== undefined),
  "attr:item.label": (d) => (d.lineup?.items ?? []).some((i) => i.label !== undefined),
  "head:line": (d) => events(d).some((e) => e.type === "line"),
  "head:seal": (d) => events(d).some((e) => e.type === "seal"),
  "head:open": (d) => events(d).some((e) => e.type === "open"),
  "head:pick": (d) => events(d).some((e) => e.type === "pick"),
  "head:stamp": (d) => events(d).some((e) => e.type === "stamp"),
};

/** 後から読む見本が届いた後に作った、見本の名前と日本語の記法から作った図 */
let samples: { key: ExampleKey; diagram: Diagram }[] | undefined;

/** 見本の名前と、日本語の記法から作った図。読めない見本は外す。後から読む見本が届くまでは `undefined` */
function allSamples(): { key: ExampleKey; diagram: Diagram }[] | undefined {
  if (samples !== undefined) return samples;
  if (LATER_EXAMPLES.state().status !== "ready") return undefined;
  samples = EXAMPLE_KEYS.flatMap((key) => {
    const parsed = parseNotation(exampleText(key, "ja") ?? "");
    return parsed.ok ? [{ key, diagram: parsed.diagram }] : [];
  });
  return samples;
}

/**
 * その部品の語を 1 つでも使う見本と、その見本の図の種類。部品を描ける図の種類の見本だけを、見本の並び (`EXAMPLE_KEYS`) の順に返す。
 * 後から読む見本が届くまでは `undefined`
 */
export const samplesUsing = (part: Part): { key: ExampleKey; kind: Kind }[] | undefined =>
  allSamples()
    ?.filter(({ diagram }) => part.kinds.includes(diagram.kind) && part.words.some((word) => USES[word]?.(diagram) === true))
    .map(({ key, diagram }) => ({ key, kind: diagram.kind }));

/**
 * 部品が受け持つ語を、記法に書く形にする (`head:box` は `box`、`attr:edge.side` は `[side: …]`)。
 * 段より前の通らない道 (`edge:before-step`) は線の行と同じ形で書き、置く所だけが違うので `->` にする
 */
export const wordLabel = (word: string): string => {
  const [type, rest = ""] = word.split(":");
  if (type === "attr") return `[${rest.split(".")[1] ?? rest}: …]`;
  if (word === "edge:before-step") return "->";
  return rest;
};
