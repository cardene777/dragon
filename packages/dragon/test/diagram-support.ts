/**
 * 原本の JSON と記法の検査が共に使う道具。
 *
 * 道具の入口は `@cardenelabs/dragon` (= `dist`) から引く。
 * 入口がまだ出ていない時に呼ぶと型の誤りで止まり、何が足りないかが判定に出ないため、
 * `api()` が先に「出ているか」を判定してから渡す。
 */
import * as dragon from "@cardenelabs/dragon";
import { expect } from "vitest";
import { exampleJson, type Json } from "./diagram-data";

// 見本を読む道具と最小の図は、1 回の実行の準備の段も使うので vitest を読まない file に置く (#3734)
export { exampleJson, exampleText, type Json, patched, smallArchitecture, smallSequence } from "./diagram-data";

export interface FieldError {
  pointer: string;
  message: string;
}

export interface LineError {
  line: number;
  column: number;
  message: string;
}

export type Checked = { ok: true } | { ok: false; errors: FieldError[] };
export type Read = { ok: true; diagram: Json; warnings: string[] } | { ok: false; errors: FieldError[] };
/** 読めた図は、図を描いたまま書き手に知らせる事 (`notices`) を持つことがある。知らせが無い時は欄を持たない (#3438) */
export type Parsed = { ok: true; diagram: Json; notices?: LineError[] } | { ok: false; errors: LineError[] };

/** 誤りの文と図の中の字の言葉。dragon記法の語は英語だけで、file から言葉は決まらない (#3137) */
export type NotationLang = "ja" | "en";

export interface Fence {
  source: string;
  line: number;
}

interface DragonApi {
  FORMAT_VERSION: number;
  validateDiagram(input: unknown, options?: { lang?: NotationLang }): Checked;
  readDiagram(input: unknown, options?: { lang?: NotationLang }): Read;
  parseNotation(text: string, options?: { lang?: NotationLang }): Parsed;
  /** `short: false` を渡すと、短い記法で省ける物も省かずに書く (#3438) */
  printNotation(diagram: unknown, options?: { short?: boolean }): string;
  extractDiagrams(markdown: string): Fence[];
  /** ブロックを使える図の種類。付け方から導く (#3348) */
  blockKinds(name: string): readonly string[];
}

export function api<K extends keyof DragonApi>(name: K): DragonApi[K] {
  const value = (dragon as unknown as Partial<DragonApi>)[name];
  expect(value, `${name} が @cardenelabs/dragon から出ていない`).toBeDefined();
  return value as DragonApi[K];
}

/** 見本の名前の末尾に付けると、値の表と表を変える事を外した原本になる印 */
export const BARE = "#bare";

/**
 * 見本の原本。名前の末尾が `BARE` の時は、値の表 (`strip`) と、段の中の表を変える事を外す。
 * 表を持つ図は狭い枠で全体図を出さない (#3274) ので、表を持たない形を同じ見本で測る検査が使う
 */
export function exampleSource(file: string): Json {
  if (!file.endsWith(BARE)) return exampleJson(file);
  const source = structuredClone(exampleJson(file.slice(0, -BARE.length))) as { blocks: { strip?: Json }; steps: { events: { type: string }[] }[] };
  delete source.blocks.strip;
  for (const step of source.steps) step.events = step.events.filter((event) => event.type !== "strip");
  return source;
}

/** 検査が返した誤りの場所の一覧。通った時は空。 */
export function pointers(result: Checked | Read): string[] {
  return result.ok ? [] : result.errors.map((error) => error.pointer);
}

/** 欄の並び順だけを逆にした写し。中身は同じ。 */
export function reversedKeys(value: Json): Json {
  if (Array.isArray(value)) return value.map(reversedKeys);
  if (value === null || typeof value !== "object") return value;
  const out: { [key: string]: Json } = {};
  for (const key of Object.keys(value).reverse()) out[key] = reversedKeys(value[key] as Json);
  return out;
}
