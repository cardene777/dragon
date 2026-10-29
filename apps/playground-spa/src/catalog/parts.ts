/**
 * カタログの部品の表 (#3166)。
 *
 * package の描く部品 (`render/parts.ts`) は図の種類の間で共通で、図の種類ごとに違うのは並べ方だけなので、
 * カタログは「どの図でも使える部品」「図の種類だけの部品」「図 (部品を組み合わせた物と見本)」の 3 段に並べる。
 *
 * 1 行は部品の名札と、その部品を描ける図の種類と、その部品が受け持つ記法の語を持つ。図の種類を全部持つ部品が、どの図でも使える部品。
 * 語は `kind:<図の種類>`、`head:<行の頭の語>`、`attr:<行>.<鍵>`、線の行の `edge:->`、枝分かれの図の行の中の語の `git:<語>` の形で書き、
 * package の記法の語の表 (`words.ts`) の語を、どれかの部品が必ず受け持つ (`catalog-parts.test.ts` が数える)。
 * 区画は時系列図に描かれないので、区画の属性 (`attr:group.*`) は区画の部品が受け持つ。
 * 色の役と絵と小さな字の部品は、構成図の図で同じ属性を区画にも付けて見せる。
 *
 * 部品の図は `parts/<名札>.<図の種類>.dragon` と英語の `.en.dragon` の記法の file で、file の名前から引く。
 *
 * 部品の頁は、その部品の語を 1 つでも使う見本を並べる (#3167)。見本が語を使うかは、見本の記法から作った原本の JSON の形で決める。
 */
import { type Diagram, type DiagramEvent, parseNotation } from "@cardenelabs/dragon";

import { EXAMPLE_KEYS, type ExampleKey, exampleText } from "../examples";
import { type Lang, TEXT } from "../text";
import { KINDS, type Kind } from "./catalog";

/** 部品の名札。名前と説明は `TEXT.<言葉>.site.catalog.parts` が持つ */
export type PartId = keyof typeof TEXT.ja.site.catalog.parts;

export interface Part {
  readonly id: PartId;
  readonly kinds: readonly Kind[];
  readonly words: readonly string[];
}

/** 部品の表。並びは一覧の札と図の頁の使う部品の並び */
export const PARTS: readonly Part[] = [
  { id: "box", kinds: KINDS, words: ["head:box"] },
  { id: "edge", kinds: KINDS, words: ["edge:->"] },
  { id: "edge-label", kinds: KINDS, words: ["attr:edge.side"] },
  { id: "carry", kinds: KINDS, words: ["attr:edge.carry", "attr:edge.tag"] },
  { id: "color", kinds: KINDS, words: ["attr:box.color"] },
  { id: "icon", kinds: KINDS, words: ["attr:box.icon"] },
  { id: "link", kinds: KINDS, words: ["attr:box.link"] },
  { id: "note", kinds: KINDS, words: ["attr:box.note", "head:note"] },
  { id: "act", kinds: KINDS, words: ["head:act"] },
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
];

/** どの図でも使える部品か。図の種類を全部持つ */
export const isCommon = (part: Part): boolean => KINDS.every((kind) => part.kinds.includes(kind));

/** 名札の部品。表に無ければ `undefined` */
export const partOf = (id: string | undefined): Part | undefined => PARTS.find((part) => part.id === id);

/** その図の種類で使える部品。部品の表の並び */
export const partsOf = (kind: Kind): Part[] => PARTS.filter((part) => part.kinds.includes(kind));

const SNIPPETS = import.meta.glob<string>("./parts/*.dragon", { query: "?raw", import: "default", eager: true });

/** 部品をその図の種類で描いた図の記法 */
export const snippetOf = (id: PartId, kind: Kind, lang: Lang): string =>
  (SNIPPETS[`./parts/${id}.${kind}${lang === "en" ? ".en" : ""}.dragon`] ?? "").trimEnd();

const events = (d: Diagram): DiagramEvent[] => d.steps.flatMap((step) => step.events);
const edges = (d: Diagram) => events(d).flatMap((e) => (e.type === "edge" ? [e] : []));
const commits = (d: Diagram) => events(d).flatMap((e) => (e.type === "commit" ? [e] : []));
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
};

/** 見本の名前と、日本語の記法から作った図。読めない見本は外す */
const SAMPLES = EXAMPLE_KEYS.flatMap((key) => {
  const parsed = parseNotation(exampleText(key, "ja"));
  return parsed.ok ? [{ key, diagram: parsed.diagram }] : [];
});

/** その部品の語を 1 つでも使う見本と、その見本の図の種類。部品を描ける図の種類の見本だけを、見本の並び (`EXAMPLE_KEYS`) の順に返す */
export const samplesUsing = (part: Part): { key: ExampleKey; kind: Kind }[] =>
  SAMPLES.filter(({ diagram }) => part.kinds.includes(diagram.kind) && part.words.some((word) => USES[word]?.(diagram) === true)).map(({ key, diagram }) => ({
    key,
    kind: diagram.kind,
  }));

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
