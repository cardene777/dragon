/**
 * 左の棚のうち、最初に読む script に置く物 (#3031、#3646)。見本を束ねる処理と、棚の雛形を後から読む塊。
 *
 * 見本の一覧は編集画面を開いた時から出すので、ここで束ねる。
 * 部品の行と記法の早見の行の雛形 (`shelf-items.ts`) は後から読む塊にし、棚を出した時に読み始める。
 * 棚は雛形の塊が届くまで部品と記法の行を並べず、読み込み中を出す。
 */
import { type Diagram, type NotationLang, parseNotation } from "@cardenelabs/dragon/light";

import { EXAMPLE_KEYS, type ExampleKey, exampleText, FIRST_SCREEN_EXAMPLES } from "../examples";
import { laterChunk } from "../site/later";

export interface Sample {
  key: ExampleKey;
  title: string;
}

export interface SampleGroup {
  kind: Diagram["kind"];
  samples: Sample[];
}

/**
 * 見本を図の種類ごとに束ねる。題と種類は見本の記法から読む。
 * `arrived` は後から読む見本が届いたか。届く前は最初に読む見本だけを束ねる (#3246)
 */
export function sampleGroups(lang: NotationLang, arrived: boolean): SampleGroup[] {
  const groups: SampleGroup[] = [];
  for (const key of EXAMPLE_KEYS) {
    const text = arrived || (FIRST_SCREEN_EXAMPLES as readonly ExampleKey[]).includes(key) ? exampleText(key, lang) : undefined;
    if (text === undefined) continue;
    const parsed = parseNotation(text, { lang });
    if (!parsed.ok) continue;
    const { kind, title } = parsed.diagram;
    const group = groups.find((g) => g.kind === kind);
    if (group) group.samples.push({ key, title });
    else groups.push({ kind, samples: [{ key, title }] });
  }
  return groups;
}

/** 棚の雛形 (部品の行と記法の早見の行) の塊。棚が部品と記法の行を並べる時と、編集画面が部品の行を書く欄に足す時に使う */
export const LATER_SHELF = laterChunk(() => import("./shelf-items"));
