/**
 * カタログの部品の表 (#3166)。
 *
 * package の描く部品 (`render/parts.ts`) は図の種類の間で共通で、図の種類ごとに違うのは並べ方だけなので、
 * カタログは「どの図でも使える部品」「図の種類だけの部品」「図 (部品を組み合わせた物と見本)」の 3 段に並べる。
 *
 * 1 行は部品の名札と、その部品を描ける図の種類と、その部品が受け持つ記法の語を持つ。図の種類を全部持つ部品が、どの図でも使える部品。
 * 語は `kind:<図の種類>`、`head:<行の頭の語>`、`attr:<行>.<鍵>`、線の行の `edge:->` の形で書き、
 * package の記法の語の表 (`words.ts`) の語を、どれかの部品が必ず受け持つ (`catalog-parts.test.ts` が数える)。
 * 区画は時系列図に描かれないので、区画の属性 (`attr:group.*`) は区画の部品が受け持つ。
 * 色の役と絵と小さな字の部品は、構成図の図で同じ属性を区画にも付けて見せる。
 *
 * 部品の図は `parts/<名札>.<図の種類>.dragon` と英語の `.en.dragon` の記法の file で、file の名前から引く。
 */
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
  { id: "note", kinds: KINDS, words: ["attr:box.note", "head:note"] },
  { id: "act", kinds: KINDS, words: ["head:act"] },
  { id: "strip", kinds: KINDS, words: ["head:strip", "head:set", "attr:set.tag"] },
  { id: "step", kinds: KINDS, words: ["head:step", "head:say", "head:code", "attr:diagram.view"] },
  { id: "lifeline", kinds: ["sequence"], words: ["kind:sequence"] },
  { id: "group", kinds: ["architecture"], words: ["kind:architecture", "head:group", "head:end", "attr:group.note", "attr:group.color", "attr:group.icon"] },
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

/** 部品が受け持つ語を、記法に書く形にする (`head:box` は `box`、`attr:edge.side` は `[side: …]`) */
export const wordLabel = (word: string): string => {
  const [type, rest = ""] = word.split(":");
  if (type === "attr") return `[${rest.split(".")[1] ?? rest}: …]`;
  return rest;
};
