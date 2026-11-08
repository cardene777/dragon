/**
 * カタログの部品の表 (#3166、#3350)。
 *
 * package の描く部品は図の種類の間で共通で、図の種類ごとに違うのは並べ方だけなので、
 * カタログは「コアブロック」「個別ブロック」「図 (ブロックを組み合わせた物と見本)」の 3 段に並べる。
 *
 * 部品はブロックで、表はブロックの置き場の見本帳の分 (`packages/dragon/src/blocks/<名前>/gallery/`) から作り、ブロックの名前を手で並べない。
 * どのブロックも見本帳の名前と説明 (`gallery/text.ts`) を持ち、ブロックの並び (`block.ts` の `rank`) の順に並べる (`BLOCK_ORDER`)。
 * 部品の語は、見本を探す関数 (`gallery/uses.ts`) の鍵を、書いた順に並べた物。
 * その部品を描ける図の種類は、ブロックの付け方と図の種類が受け付ける付け方から導く (`blockKinds`、#3348)。
 * 図の種類を 2 つ以上持つ部品がコアブロックで、付け方に `only` を書いた個別ブロックは図の種類を 1 つだけ持つ。
 * 列の図 (#3239) は線を持たないので、線と線の名前と運ぶ物の部品 (つなぐと線に乗るの付け方) を受け付けず、
 * 絵と飛び先と箱の中の処理のブロックは、付け方に列の図を使わない図の種類 (`except`) として書く。
 * 試す図 (#3337) は箱と線を持たないので、置くと図に付くの付け方だけを受け付け、箱と段と出典と中身の帯のブロックは試す図を `except` に書く。
 * 段と出典は書けるが、読み手が段を足していく図で、置いた時は書き手の最初の段だけを描いて待つので、段を送って見せる部品に数えない。
 * package の記法の語の表 (`words.ts`) の語を、どれかの部品が必ず受け持つ (`catalog-parts.test.ts` が数える)。
 * 区画は時系列図に描かれないので、区画の属性 (`attr:group.*`) は区画の部品が受け持つ。
 * 色の役と絵と小さな字の部品は、構成図の図で同じ属性を区画にも付けて見せる。
 *
 * 部品の図は `gallery/<名前>.<図の種類>.dragon` と英語の `.en.dragon` の記法の file で、file の名前から引く。
 * 部品の図の記法は最初に読む script に入れず、1 つの塊にして後から読む (#3246)。
 *
 * 部品の頁は、その部品の語を 1 つでも使う見本を並べる (#3167)。見本が語を使うかは、見本の記法から作った原本の JSON を
 * 見本帳が引いた値 (`SampleView`) にして、ブロックの見本を探す関数に渡して決める。
 */
import { blockKinds, type Diagram, type DiagramEvent, type LineupItem, parseNotation, type TryItem, type TryPart } from "@cardenelabs/dragon/light";

// 見本帳の分の型は npm に出す入口から出さず、ブロックの置き場の型の file から読む
import type { BlockUses, SampleView } from "../../../../packages/dragon/src/blocks/gallery";

import { EXAMPLE_KEYS, type ExampleKey, exampleText, LATER_EXAMPLES } from "../examples";
import { laterChunk } from "../site/later";
import type { Lang } from "../text";
import { BLOCK_ORDER, BLOCK_TEXT } from "./blocks.gen";
import { BLOCK_USES } from "./blocks-uses.gen";
import { KINDS, type Kind } from "./catalog";

/** 部品の名札。ブロックの置き場の dir の名前で、名前は `TEXT.<言葉>.site.catalog.parts` が、説明は部品の頁だけが読む `BLOCK_DESC` が持つ (#3531) */
export type PartId = keyof typeof BLOCK_TEXT;

export interface Part {
  readonly id: PartId;
  readonly kinds: readonly Kind[];
  readonly words: readonly string[];
}

/** 見本を探す関数の表。鍵はブロックの名前 */
const USES: Readonly<Record<string, BlockUses>> = BLOCK_USES;

/** ブロックを部品の表の行にする。図の種類は見本帳の図の種類の並びで足す */
const partOfBlock = (id: PartId): Part => {
  const usable: readonly string[] = blockKinds(id);
  return { id, kinds: KINDS.filter((kind) => usable.includes(kind)), words: Object.keys(USES[id] ?? {}) };
};

/** 部品の表。ブロックの並びの順で、一覧の札と図の頁の使う部品の並び */
export const PARTS: readonly Part[] = BLOCK_ORDER.map(partOfBlock);

/** コアブロックか。図の種類を 2 つ以上持つ。個別ブロックは付け方の `only` で図の種類を 1 つだけ持つ */
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
/** 列の図のチップ。チップの欄は列の図と試す図が使い、試す図のチップは欄の値 (`values`) を持つ */
function lineupItems(d: Diagram): LineupItem[] {
  const items: readonly (LineupItem | TryItem)[] = d.blocks.item ?? [];
  return items.flatMap((i) => ("values" in i ? [] : [i]));
}

/** 見本の図から、ブロックの見本を探す関数に渡す値を引く */
function viewOf(diagram: Diagram): SampleView {
  const all = events(diagram);
  const parts: readonly TryPart[] = diagram.blocks.part ?? [];
  return {
    diagram,
    events: all,
    edges: all.flatMap((e) => (e.type === "edge" ? [e] : [])),
    commits: all.flatMap((e) => (e.type === "commit" ? [e] : [])),
    spans: all.flatMap((e) => (e.type === "span" ? [e] : [])),
    lineupItems: lineupItems(diagram),
    tryParts: <T extends TryPart["type"]>(type: T) => parts.filter((p): p is Extract<TryPart, { type: T }> => p.type === type),
  };
}

/** 後から読む見本が届いた後に作った、見本の名前と日本語の記法から作った図から引いた値 */
let samples: { key: ExampleKey; view: SampleView }[] | undefined;

/** 見本の名前と、日本語の記法から作った図から引いた値。読めない見本は外す。後から読む見本が届くまでは `undefined` */
function allSamples(): { key: ExampleKey; view: SampleView }[] | undefined {
  if (samples !== undefined) return samples;
  if (LATER_EXAMPLES.state().status !== "ready") return undefined;
  samples = EXAMPLE_KEYS.flatMap((key) => {
    const parsed = parseNotation(exampleText(key, "ja") ?? "");
    return parsed.ok ? [{ key, view: viewOf(parsed.diagram) }] : [];
  });
  return samples;
}

/**
 * その部品の語を 1 つでも使う見本と、その見本の図の種類。部品を描ける図の種類の見本だけを、見本の並び (`EXAMPLE_KEYS`) の順に返す。
 * 後から読む見本が届くまでは `undefined`
 */
export const samplesUsing = (part: Part): { key: ExampleKey; kind: Kind }[] | undefined =>
  allSamples()
    ?.filter(({ view }) => part.kinds.includes(view.diagram.kind) && part.words.some((word) => USES[part.id]?.[word]?.(view) === true))
    .map(({ key, view }) => ({ key, kind: view.diagram.kind }));

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
