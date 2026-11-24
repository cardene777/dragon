/**
 * 持ち主ごとのカードの図の見本と棚 (#3846)。
 *
 * 見本は日本語と英語の記法を持ち、英語版は日本語版と同じ形 (部品の数、段の数、段ごとの出来事の数) で、カタログの持ち主ごとのカードの図の頁に載る。
 * 見本の1枚は証書を送る`note-transfer`で、軽い入口の検査 (`light-entry.test.ts`) もこの見本を描く。
 * 編集画面の棚は、見本の束と記法の早見の頭の行から持ち主ごとのカードの図を書き始められる。
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { parseNotation } from "@cardenelabs/dragon";
import { beforeAll, describe, expect, it } from "vitest";

import { KINDS, type Kind, samplesOf } from "../catalog/catalog";
import { sampleGroups } from "../editor/shelf-first";
import { syntaxLines } from "../editor/shelf-items";
import { EXAMPLE_KEYS, type ExampleKey, exampleInfo, exampleText, LATER_EXAMPLES } from "../examples";
import type { Lang } from "../text";
import { root } from "./playground-support";
import { atLoad } from "../../../../packages/dragon/test/at-load";
import { whenReady } from "../site/later";

/** 図の種類の名前。種類を足す前の型にも渡せるよう、字の型で持つ */
const CARDS: string = "cards";

/** 必ず載る見本 */
const NOTE_TRANSFER = "note-transfer";

const LANGS: readonly Lang[] = ["ja", "en"];

const EXAMPLES_DIR = join(root, "packages/dragon/examples");
const registered = (key: string): boolean => (EXAMPLE_KEYS as readonly string[]).includes(key);

/** 見本の記法。一覧に無い間は空の字 */
function textOf(key: string, lang: Lang): string {
  if (!registered(key)) return "";
  return exampleText(key as ExampleKey, lang) ?? "";
}

/** 図の形。部品の種類ごとの数、段の数、段ごとの出来事の種類ごとの数 */
function shapeOf(text: string): unknown {
  const read = parseNotation(text);
  if (!read.ok) return { unreadable: read.errors };
  const d = read.diagram;
  const count = (types: readonly string[]): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const type of types) counts[type] = (counts[type] ?? 0) + 1;
    return counts;
  };
  return {
    kind: d.kind,
    blocks: Object.fromEntries(Object.entries(d.blocks as Record<string, unknown>).map(([name, list]) => [name, Array.isArray(list) ? list.length : Object.keys(list as object).length])),
    steps: d.steps.map((step) => count(step.events.map((event) => event.type))),
  };
}

/** 記法が持ち主ごとのカードの図として読めるか。読めない時は誤りを返す */
function readsAsCards(text: string, lang: Lang): true | string {
  const read = parseNotation(text, { lang });
  if (!read.ok) return JSON.stringify(read.errors);
  return String(read.diagram.kind) === CARDS ? true : `図の種類が${String(read.diagram.kind)}`;
}

// 後から読む塊はfileを読み込む段で待つ。前処理で25ミリ秒ずつ見て待つと、混んだ機械で1件10秒の上限を超えた (#3759)
const EXAMPLES_READY = await atLoad("見本帳の後から読む見本の塊を待つ", () => whenReady(LATER_EXAMPLES));

beforeAll(() => {
  EXAMPLES_READY.get();
});

describe("持ち主ごとのカードの図の見本と棚 (#3846)", () => {
  it("cards-examples-in-catalog-and-shelf", () => {
    // 証書を送る見本は日本語と英語の記法を持ち、見本の一覧に載る
    for (const file of [`${NOTE_TRANSFER}.dragon`, `${NOTE_TRANSFER}.en.dragon`]) {
      expect(existsSync(join(EXAMPLES_DIR, file)), `packages/dragon/examples/${file}が無い`).toBe(true);
    }
    expect(registered(NOTE_TRANSFER), `${NOTE_TRANSFER}が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(true);
    // カタログは持ち主ごとのカードの図の頁を持ち、頁に載る見本はどれも2つの言葉で持ち主ごとのカードの図として読める
    expect(KINDS as readonly string[], "カタログの分類に持ち主ごとのカードの図 (cards) が無い").toContain(CARDS);
    const listed: readonly string[] = samplesOf(CARDS as Kind);
    expect(listed, "カタログの持ち主ごとのカードの図の頁に載る見本").toContain(NOTE_TRANSFER);
    for (const key of listed) {
      for (const lang of LANGS) {
        const text = textOf(key, lang);
        expect(text, `${key}の${lang}の記法が届かない`).not.toBe("");
        expect(readsAsCards(text, lang), `${key}の${lang}の記法が持ち主ごとのカードの図として読めない`).toBe(true);
      }
      expect(shapeOf(textOf(key, "en")), `${key}の英語版の形が日本語版と違う`).toEqual(shapeOf(textOf(key, "ja")));
      expect(String(exampleInfo(key as ExampleKey, "en")?.kind), `${key}の英語版の図の種類`).toBe(CARDS);
    }
    // 編集画面の棚から書き始められる
    for (const lang of LANGS) {
      // 記法の早見の図の種類の行に、持ち主ごとのカードの図の頭の行が在る
      const kinds = syntaxLines(lang).find((s) => s.id === "kind")?.lines ?? [];
      expect(kinds.some((line) => /^cards <[^>]+>$/u.test(line)), `棚の記法の早見 (${lang}) にcardsの頭の行が無い: ${kinds.join(" / ")}`).toBe(true);
      // 見本の束に持ち主ごとのカードの図の束が在り、カタログの頁と同じ見本を持ち、どの雛形も持ち主ごとのカードの図として読める
      const group = sampleGroups(lang, true).find((g) => String(g.kind) === CARDS);
      expect(group, `棚の見本の束 (${lang}) に持ち主ごとのカードの図の束が無い`).toBeDefined();
      expect(group?.samples.map((s) => s.key), `棚の持ち主ごとのカードの図の束 (${lang}) の見本`).toEqual(listed);
      for (const sample of group?.samples ?? []) {
        expect(readsAsCards(textOf(sample.key, lang), lang), `棚の雛形${sample.key} (${lang}) が持ち主ごとのカードの図として読めない`).toBe(true);
      }
    }
  });
});
