/**
 * カタログの分類と、分類ごとの見本 (#3033)。
 *
 * 分類は図の種類で、並びは図の種類の名前の表 (`TEXT.ja.shelf.kinds`) の順。
 * 見本は `examples.ts` の見本を、記法を読んだ図の種類で束ねる。件数は束ねた数で、手で書かない。
 */
import type { Diagram } from "@cardenelabs/dragon/light";

import { EXAMPLE_KEYS, type ExampleKey, exampleInfo } from "../examples";
import { TEXT } from "../text";

export type Kind = Diagram["kind"];

export const KINDS = Object.keys(TEXT.ja.shelf.kinds) as Kind[];

/** 経路の分類の名前が、カタログの分類か */
export const isKind = (name: string | undefined): name is Kind => KINDS.some((kind) => kind === name);

/** 分類に載る見本。見本の並び (`EXAMPLE_KEYS`) の順 */
export const samplesOf = (kind: Kind): ExampleKey[] => EXAMPLE_KEYS.filter((key) => exampleInfo(key, "ja")?.kind === kind);
