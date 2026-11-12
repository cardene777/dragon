/**
 * 集合の重なりの図の見本と棚 (#3620)。
 *
 * 見本は 4 枚 (`wallet-usage`、`l2-chains`、`hobbies`、`skills`) で、どれも日本語と英語の記法を持ち、英語版は日本語版と同じ形 (部品の数、段の数、段ごとの出来事の数) で、どちらも崩れを出さない。
 * 題材は一般 (`hobbies`、`skills`) と Web3 (`wallet-usage`、`l2-chains`) を 2 枚ずつ持ち、2 つの集まりの図と 3 つの集まりの図を 2 枚ずつ持つ。
 * 題材の分野と集まりの数は記法から読めないので、この file の表が持つ。表は #3620 の「決まっていること」の写し。
 * 編集画面の棚は、見本の束と記法の早見の頭の行から集合の重なりの図を書き始められる。
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { checkLayoutText, parseNotation } from "@cardenelabs/dragon";
import { beforeAll, describe, expect, it } from "vitest";

import { samplesOf } from "../catalog/catalog";
import { sampleGroups } from "../editor/shelf-first";
import { syntaxLines } from "../editor/shelf-items";
import { EXAMPLE_KEYS, type ExampleKey, exampleInfo, exampleText, LATER_EXAMPLES } from "../examples";
import type { Lang } from "../text";
import { root } from "./playground-support";

type Field = "general" | "web3";

/** 集合の重なりの図の見本。名前と題材の分野と集まりの数 */
const VENN: Readonly<Record<string, { field: Field; sets: number }>> = {
  "wallet-usage": { field: "web3", sets: 3 },
  "l2-chains": { field: "web3", sets: 2 },
  hobbies: { field: "general", sets: 3 },
  skills: { field: "general", sets: 2 },
  // 点で数える見た目の見本 (#3635)
  "wallet-dots": { field: "web3", sets: 3 },
};

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

/** 見本の日本語の記法で宣言した集まりの数。読めない記法は -1 */
function setsOf(key: string): number {
  const read = parseNotation(textOf(key, "ja"));
  if (!read.ok) return -1;
  const circles = (read.diagram.blocks as { circle?: unknown[] }).circle;
  return Array.isArray(circles) ? circles.length : 0;
}

beforeAll(async () => {
  LATER_EXAMPLES.start();
  for (let i = 0; i < 400 && LATER_EXAMPLES.state().status === "loading"; i += 1) await new Promise((resolve) => setTimeout(resolve, 25));
  expect(LATER_EXAMPLES.state().status, "後から読む見本の塊が届かない").toBe("ready");
});

describe("集合の重なりの図の見本 (#3620)", () => {
  it("venn-has-four-examples-in-both-langs", () => {
    for (const key of Object.keys(VENN)) {
      for (const file of [`${key}.dragon`, `${key}.en.dragon`]) {
        expect(existsSync(join(EXAMPLES_DIR, file)), `packages/dragon/examples/${file} が無い`).toBe(true);
      }
      expect(registered(key), `${key} が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(true);
      const ja = textOf(key, "ja");
      const en = textOf(key, "en");
      expect(ja, `${key} の日本語の記法が届かない`).not.toBe("");
      expect(en, `${key} の英語の記法が届かない`).not.toBe("");
      expect(shapeOf(en), `${key} の英語版の形が日本語版と違う`).toEqual(shapeOf(ja));
      expect(exampleInfo(key as ExampleKey, "ja")?.kind, `${key} の図の種類`).toBe("venn");
    }
    // カタログの集合の重なりの図の頁に 5 枚とも載る
    const listed: readonly string[] = samplesOf("venn");
    expect(listed, "カタログの集合の重なりの図の頁に載る見本").toEqual(Object.keys(VENN));
  });

  it("venn-examples-cover-general-and-web3", () => {
    const listed = Object.entries(VENN).filter(([key]) => registered(key) && exampleInfo(key as ExampleKey, "ja")?.kind === "venn");
    expect(listed.map(([key]) => key), "見本の一覧に載った集合の重なりの図の見本").toEqual(Object.keys(VENN));
    const general = listed.filter(([, info]) => info.field === "general").map(([key]) => key);
    const web3 = listed.filter(([, info]) => info.field === "web3").map(([key]) => key);
    expect(general, "一般の題の見本").toEqual(["hobbies", "skills"]);
    expect(web3, "Web3 の題の見本").toEqual(["wallet-usage", "l2-chains", "wallet-dots"]);
  });

  it("venn-examples-cover-two-and-three-sets", () => {
    const counted = Object.fromEntries(Object.keys(VENN).map((key) => [key, setsOf(key)]));
    expect(counted, "見本ごとの集まりの数").toEqual(Object.fromEntries(Object.entries(VENN).map(([key, info]) => [key, info.sets])));
    const kinds = new Set(Object.values(counted));
    expect(kinds.has(2) && kinds.has(3), `2 つの集まりの図と 3 つの集まりの図の両方が無い: ${JSON.stringify(counted)}`).toBe(true);
  });

  it("venn-examples-have-no-breaks", () => {
    for (const key of Object.keys(VENN)) {
      for (const lang of LANGS) {
        const text = textOf(key, lang);
        expect(text, `${key} ${lang} の記法が届かない`).not.toBe("");
        if (text === "") continue;
        const breaks = checkLayoutText(text, { lang });
        expect(
          breaks.map((b) => JSON.stringify(b)),
          `${key} ${lang} の崩れ`,
        ).toEqual([]);
      }
    }
  });
});

describe("集合の重なりの図の棚 (#3620)", () => {
  it("venn-shelf-template-reads", () => {
    for (const lang of LANGS) {
      // 記法の早見の図の種類の行に、集合の重なりの図の頭の行が在る
      const kinds = syntaxLines(lang).find((s) => s.id === "kind")?.lines ?? [];
      expect(kinds.some((line) => /^venn <[^>]+>$/u.test(line)), `棚の記法の早見 (${lang}) に venn の頭の行が無い: ${kinds.join(" / ")}`).toBe(true);
      // 見本の束に集合の重なりの図の束が在り、どの雛形も誤り無く集合の重なりの図として読める
      const group = sampleGroups(lang, true).find((g) => g.kind === ("venn" as typeof g.kind));
      expect(group, `棚の見本の束 (${lang}) に集合の重なりの図の束が無い`).toBeDefined();
      expect(group?.samples.map((s) => s.key), `棚の集合の重なりの図の束 (${lang}) の見本`).toEqual(Object.keys(VENN));
      for (const sample of group?.samples ?? []) {
        const read = parseNotation(textOf(sample.key, lang), { lang });
        expect(read.ok, `棚の雛形 ${sample.key} (${lang}) が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
        expect(read.ok ? read.diagram.kind : "", `棚の雛形 ${sample.key} (${lang}) の図の種類`).toBe("venn");
      }
    }
  });
});
