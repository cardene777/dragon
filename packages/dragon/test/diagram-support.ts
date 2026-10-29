/**
 * 原本の JSON と記法の検査が共に使う道具。
 *
 * 道具の入口は `@cardenelabs/dragon` (= `dist`) から引く。
 * 入口がまだ出ていない時に呼ぶと型の誤りで止まり、何が足りないかが判定に出ないため、
 * `api()` が先に「出ているか」を判定してから渡す。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { expect } from "vitest";

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

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
export type Parsed = { ok: true; diagram: Json } | { ok: false; errors: LineError[] };

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
  printNotation(diagram: unknown): string;
  extractDiagrams(markdown: string): Fence[];
}

export function api<K extends keyof DragonApi>(name: K): DragonApi[K] {
  const value = (dragon as unknown as Partial<DragonApi>)[name];
  expect(value, `${name} が @cardenelabs/dragon から出ていない`).toBeDefined();
  return value as DragonApi[K];
}

// 例の置き場は repo の根 (vitest を回す場所) から引く。
// jsdom の環境で回す検査では `import.meta.url` が `file:` の URL にならず、そこから file を開けないため
const examples = join(process.cwd(), "packages/dragon/examples");

export function exampleText(file: string): string {
  return readFileSync(join(examples, file), "utf8");
}

export function exampleJson(file: string): Json {
  return JSON.parse(exampleText(file)) as Json;
}

/** 検査が返した誤りの場所の一覧。通った時は空。 */
export function pointers(result: Checked | Read): string[] {
  return result.ok ? [] : result.errors.map((error) => error.pointer);
}

/** `base` を写し、`path` の場所を `value` に置き換える。`value` が `undefined` なら欄を消す。 */
export function patched(base: Json, path: (string | number)[], value: Json | undefined): Json {
  const copy = structuredClone(base);
  let node = copy as Record<string | number, Json>;
  for (const key of path.slice(0, -1)) node = node[key] as Record<string | number, Json>;
  const last = path[path.length - 1] as string | number;
  if (value === undefined) delete node[last];
  else node[last] = value;
  return copy;
}

/** 欄の並び順だけを逆にした写し。中身は同じ。 */
export function reversedKeys(value: Json): Json {
  if (Array.isArray(value)) return value.map(reversedKeys);
  if (value === null || typeof value !== "object") return value;
  const out: { [key: string]: Json } = {};
  for (const key of Object.keys(value).reverse()) out[key] = reversedKeys(value[key] as Json);
  return out;
}

const edge = (from: string, to: string): Json => ({ type: "edge", from, to, carry: { kind: "envelope" } });

/** 共通の骨組みに、時系列図の種類の欄 (生存線) を足した最小の図。線を 4 本持つ。 */
export function smallSequence(): Json {
  return {
    version: 1,
    kind: "sequence",
    title: "最小の時系列図",
    boxes: [
      { id: "a", name: "送る側" },
      { id: "b", name: "受ける側" },
    ],
    strip: { title: "持つ値", fields: ["値"] },
    steps: [
      {
        title: "送る",
        body: "送る側が受ける側へ 2 往復する。",
        events: [edge("a", "b"), edge("b", "a"), edge("a", "b"), edge("b", "a")],
      },
    ],
    sequence: { lifelines: ["a", "b"] },
  };
}

/** 区画を持ち、種類の欄を持たない最小の構成図。 */
export function smallArchitecture(): Json {
  return {
    version: 1,
    kind: "architecture",
    title: "最小の構成図",
    regions: [{ id: "r", name: "区画" }],
    boxes: [
      { id: "a", name: "入口", region: "r" },
      { id: "b", name: "出口", region: "r" },
    ],
    steps: [{ title: "流す", body: "入口から出口へ流す。", events: [edge("a", "b")] }],
  };
}
