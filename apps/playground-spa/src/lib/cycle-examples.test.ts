/**
 * 回り続ける図の見本と棚 (#3623)。
 *
 * 見本は 6 枚 (`eth-slot`、`sprint`、`pdca`、`restake`、時計の文字盤の見た目の `focus-clock`、輪を開いた帯の見た目の `farm-year`) で、どれも日本語と英語の記法を持ち、英語版は日本語版と同じ形 (部品の数、段の数、段ごとの出来事の数) で、どちらも崩れを出さない。
 * 題材は一般 (`sprint`、`pdca`、`focus-clock`、`farm-year`) と Web3 (`eth-slot`、`restake`) を持つ。題材の分野は記法から読めないので、この file の表が持つ。表は #3623 の「決まっていること」に #3638 と #3639 の見本を足した物。
 * 編集画面の棚は、見本の束と記法の早見の頭の行から回り続ける図を書き始められる。
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

/** 回り続ける図の見本。名前と題材の分野と段の数 */
const CYCLE: Readonly<Record<string, { field: Field; steps?: number }>> = {
  "eth-slot": { field: "web3", steps: 5 },
  sprint: { field: "general" },
  pdca: { field: "general" },
  restake: { field: "web3" },
  "focus-clock": { field: "general" },
  "farm-year": { field: "general" },
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

beforeAll(async () => {
  LATER_EXAMPLES.start();
  for (let i = 0; i < 400 && LATER_EXAMPLES.state().status === "loading"; i += 1) await new Promise((resolve) => setTimeout(resolve, 25));
  expect(LATER_EXAMPLES.state().status, "後から読む見本の塊が届かない").toBe("ready");
});

describe("回り続ける図の見本 (#3623)", () => {
  it("cycle-has-six-examples-in-both-langs", () => {
    for (const [key, info] of Object.entries(CYCLE)) {
      for (const file of [`${key}.dragon`, `${key}.en.dragon`]) {
        expect(existsSync(join(EXAMPLES_DIR, file)), `packages/dragon/examples/${file} が無い`).toBe(true);
      }
      expect(registered(key), `${key} が見本の一覧 (EXAMPLE_KEYS) に無い`).toBe(true);
      const ja = textOf(key, "ja");
      const en = textOf(key, "en");
      expect(ja, `${key} の日本語の記法が届かない`).not.toBe("");
      expect(en, `${key} の英語の記法が届かない`).not.toBe("");
      expect(shapeOf(en), `${key} の英語版の形が日本語版と違う`).toEqual(shapeOf(ja));
      expect(exampleInfo(key as ExampleKey, "ja")?.kind, `${key} の図の種類`).toBe("cycle");
      if (info.steps !== undefined) {
        const read = parseNotation(ja);
        expect(read.ok ? read.diagram.steps.length : -1, `${key} の段の数`).toBe(info.steps);
      }
    }
    // カタログの回り続ける図の頁に 6 枚とも載る
    const listed: readonly string[] = samplesOf("cycle");
    expect(listed, "カタログの回り続ける図の頁に載る見本").toEqual(Object.keys(CYCLE));
  });

  it("cycle-examples-cover-general-and-web3", () => {
    const listed = Object.entries(CYCLE).filter(([key]) => registered(key) && exampleInfo(key as ExampleKey, "ja")?.kind === "cycle");
    expect(listed.map(([key]) => key), "見本の一覧に載った回り続ける図の見本").toEqual(Object.keys(CYCLE));
    const general = listed.filter(([, info]) => info.field === "general").map(([key]) => key);
    const web3 = listed.filter(([, info]) => info.field === "web3").map(([key]) => key);
    expect(general, "一般の題の見本").toEqual(["sprint", "pdca", "focus-clock", "farm-year"]);
    expect(web3, "Web3 の題の見本").toEqual(["eth-slot", "restake"]);
  });

  it("cycle-examples-have-no-breaks", () => {
    for (const key of Object.keys(CYCLE)) {
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

describe("回り続ける図の棚 (#3623)", () => {
  it("cycle-shelf-template-reads", () => {
    for (const lang of LANGS) {
      // 記法の早見の図の種類の行に、回り続ける図の頭の行が在る
      const kinds = syntaxLines(lang).find((s) => s.id === "kind")?.lines ?? [];
      expect(kinds.some((line) => /^cycle <[^>]+>$/u.test(line)), `棚の記法の早見 (${lang}) に cycle の頭の行が無い: ${kinds.join(" / ")}`).toBe(true);
      // 見本の束に回り続ける図の束が在り、どの雛形も誤り無く回り続ける図として読める
      const group = sampleGroups(lang, true).find((g) => g.kind === ("cycle" as typeof g.kind));
      expect(group, `棚の見本の束 (${lang}) に回り続ける図の束が無い`).toBeDefined();
      expect(group?.samples.map((s) => s.key), `棚の回り続ける図の束 (${lang}) の見本`).toEqual(Object.keys(CYCLE));
      for (const sample of group?.samples ?? []) {
        const read = parseNotation(textOf(sample.key, lang), { lang });
        expect(read.ok, `棚の雛形 ${sample.key} (${lang}) が読めない: ${read.ok ? "" : JSON.stringify(read.errors)}`).toBe(true);
        expect(read.ok ? read.diagram.kind : "", `棚の雛形 ${sample.key} (${lang}) の図の種類`).toBe("cycle");
      }
    }
  });
});
