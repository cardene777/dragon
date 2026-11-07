/**
 * 書いた図が使うブロック (#3349)。
 *
 * 軽い入口は、後から読む図の種類の個別ブロックの読み方を、書いた図が使う時だけ読む。読む前に、記法か原本から使うブロックの名前を引くのがこの file。
 * 行が使うブロックは、ブロックの定義 (`block.ts`) の宣言から引く。読む処理 (`parser.ts`) も同じ関数で行が使うブロックを引き、読んでいなければ止めるので、
 * 読む前に引いたブロックと、読む時に要るブロックが食い違わない。
 *
 * 1 つの行が使うブロックは次の 2 つ。
 * - 行の頭の語を持つブロック。ブロックを使える図の種類 (`usable.ts` の `fits`) の図に書いた時だけ数え、ほかの種類の図に書いた行は読み方を読まずに断る
 * - 定義の `lines` が行の形に当たるブロック (時間軸の図の針を進める行、状態遷移図の最初の段より前の線、試す図の `item` と `line` の行)
 *
 * 加えて、図の種類の決まりを持つブロック (定義の `always`) は、行が無くてもその種類の図なら使う。
 * 原本からは、`blocks` の欄の鍵 (ブロックの名前か、定義の `fields`) と、段の欄の鍵 (定義の `stepFields`) と、試す図の部品の種類と、
 * 段の中で起きることを書き戻すブロック (`eventOwners`) を引く。
 */
import { KIND_FOLDERS } from "../kinds/index";
import type { Kind } from "../kinds/kind";
import { isBlankOrComment, tokenize } from "../tokenize";
import type { Block, KindName, LineMatch, LineView } from "./block";
import { EDGE } from "./edge/block";
import { EVENT_OWNERS } from "./event-owners";
import { BLOCKS } from "./index";
import { fits } from "./usable";

const ALL = BLOCKS as unknown as Readonly<Record<string, Block>>;
const KINDS = KIND_FOLDERS as unknown as Readonly<Record<string, Kind>>;

/** 原本の `blocks` の欄の鍵ごとの、その欄を持つブロック。鍵はブロックの名前か、定義の `fields` に書いた名前 */
const FIELD_OWNERS: ReadonlyMap<string, Block> = new Map(Object.values(ALL).flatMap((block) => [block.name, ...(block.fields ?? [])].map((key) => [key, block] as const)));

/** 原本の段の欄の鍵ごとの、その欄を持つブロック (定義の `stepFields`、#3464) */
const STEP_FIELD_OWNERS: ReadonlyMap<string, Block> = new Map(Object.values(ALL).flatMap((block) => (block.stepFields ?? []).map((key) => [key, block] as const)));

/** 行の頭の語ごとの、その語を持つブロック */
const HEAD_OWNERS: ReadonlyMap<string, Block> = new Map(Object.values(ALL).flatMap((block) => (block.words.heads ?? []).map((head) => [head, block] as const)));

/** 行の形。行の頭の語と 2 つ目の語と、線の行なら送る側の名札と、最初の `step` より後の行か */
export function lineView(text: string, inSteps: boolean): LineView {
  const edge = EDGE.exec(text);
  const [word = "", second] = text.split(/\s+/u);
  return { word, ...(second !== undefined ? { second } : {}), ...(edge?.[1] !== undefined ? { edgeFrom: edge[1] } : {}), inSteps };
}

/** 行の形が宣言に当たるか。書いた欄が全て合う時に当たる。行の頭の語の宣言は線の行に当てない (名札が語と同じ綴りの線がある) */
export function matches(match: LineMatch, view: LineView): boolean {
  const isEdge = view.edgeFrom !== undefined;
  if (match.heads !== undefined && (isEdge || !match.heads.includes(view.word))) return false;
  if (match.edges !== undefined && (!isEdge || (match.edges === "before-steps" && view.inSteps))) return false;
  if (match.from !== undefined && view.edgeFrom !== match.from) return false;
  if (match.exceptFrom !== undefined && view.edgeFrom === match.exceptFrom) return false;
  if (match.second !== undefined && (isEdge || view.second !== match.second)) return false;
  return true;
}

/** 図の種類 `kind` の図で使えるブロック。ブロックの並び (`rank`) の順で、知らない種類は空 */
function kindBlocks(kind: string): Block[] {
  const found = KINDS[kind];
  return found === undefined ? [] : Object.values(ALL).filter((block) => fits(block, found)).sort((a, b) => a.rank - b.rank);
}

/** 図の種類 `kind` の図の、形が `view` の行が使うブロックの名前 */
export function lineNeeds(view: LineView, kind: KindName): string[] {
  const found = KINDS[kind];
  if (found === undefined) return [];
  const out = new Set<string>();
  const owner = view.edgeFrom === undefined ? HEAD_OWNERS.get(view.word) : undefined;
  if (owner && fits(owner, found)) out.add(owner.name);
  for (const block of kindBlocks(kind)) if (block.lines?.some((match) => matches(match, view))) out.add(block.name);
  return [...out];
}

/** 図の種類 `kind` の図なら、行が無くても使うブロック (図の種類の決まりを持つ) */
export const kindNeeds = (kind: string): string[] => kindBlocks(kind).filter((block) => block.always === true).map((block) => block.name);

/**
 * 図の種類 `kind` の図で、段の中で起きることの種類 `type` を書き戻すブロック。
 * その形の枝を持つブロック (`event-owners.ts`) が使える種類ならそのブロック、ほかに `type` の行を行の形で読むブロック (試す図の `line` は待ち行列のブロック)
 */
export function eventOwners(type: string, kind: string): string[] {
  const found = KINDS[kind];
  if (found === undefined) return [];
  const owner = ALL[EVENT_OWNERS[type] ?? ""];
  const readers = kindBlocks(kind).filter((block) => block.lines?.some((match) => match.heads?.includes(type)));
  return [...(owner && fits(owner, found) ? [owner.name] : []), ...readers.map((block) => block.name)];
}

/** 記法の図の種類。最初の空でない行の頭の語 */
export const kindOf = (text: string): string => tokenize(text).find((source) => !isBlankOrComment(source))?.text.split(/\s/u)[0] ?? "";

/** 記法から、書いた図が使うブロックの名前。最初の行が図の種類でなければ空 */
function notationNeeds(text: string): string[] {
  const lines = tokenize(text).filter((source) => !isBlankOrComment(source));
  const kind = kindOf(text);
  if (KINDS[kind] === undefined) return [];
  const out = new Set(kindNeeds(kind));
  let inSteps = false;
  for (const source of lines.slice(1)) {
    const view = lineView(source.text, inSteps);
    for (const name of lineNeeds(view, kind as KindName)) out.add(name);
    if (view.edgeFrom === undefined && view.word === "step") inSteps = true;
  }
  return [...out];
}

/** 原本 (版2) の形のうち、使うブロックを引くのに読む欄 */
interface SourceShape {
  kind?: unknown;
  blocks?: Record<string, unknown>;
  steps?: (Record<string, unknown> & { events?: { type?: unknown }[] })[];
}

/** 原本 (版2) から、書いた図が使うブロックの名前 */
function sourceNeeds(source: SourceShape): string[] {
  const kind = typeof source.kind === "string" ? source.kind : "";
  const found = KINDS[kind];
  if (found === undefined) return [];
  const out = new Set(kindNeeds(kind));
  const add = (block: Block | undefined): void => {
    if (block) out.add(block.name);
  };
  // `blocks` の欄の鍵はブロックの名前か、定義の `fields` に書いた名前。使えない種類のブロックの欄は数えない (試す図のチップの欄 `item` は列の図のブロックの名前と同じ綴り)
  for (const key of Object.keys(source.blocks ?? {})) {
    const block = FIELD_OWNERS.get(key);
    if (block && fits(block, found)) add(block);
  }
  // 試す図の部品は、部品の種類と同じ名前のブロックが持つ
  const parts = source.blocks?.["part"];
  if (Array.isArray(parts)) for (const part of parts as { type?: unknown }[]) add(typeof part.type === "string" ? ALL[part.type] : undefined);
  for (const step of source.steps ?? []) {
    // 段の欄 (配管の図の段の要点) は、その欄を持つブロックが書き戻す。使えない種類のブロックの欄は数えない
    for (const key of Object.keys(step)) {
      const block = STEP_FIELD_OWNERS.get(key);
      if (block && fits(block, found)) add(block);
    }
    // 段の中で起きることは、その図の種類で書き戻すブロックが要る
    for (const event of step.events ?? []) if (typeof event.type === "string") for (const name of eventOwners(event.type, kind)) out.add(name);
  }
  return [...out];
}

/**
 * 記法か原本 (版2) から、書いた図が使うブロックの名前。ブロックの並び (`rank`) の順で返す。
 * 版1の原本は呼ぶ側が版2へ移してから渡す
 */
export function blocksUsedBy(source: string | object): string[] {
  const names = new Set(typeof source === "string" ? notationNeeds(source) : sourceNeeds(source));
  return Object.values(ALL)
    .filter((block) => names.has(block.name))
    .sort((a, b) => a.rank - b.rank)
    .map((block) => block.name);
}
