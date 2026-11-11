// @vitest-environment jsdom
/**
 * 部品の頁の書き方の違い (#3616)。
 *
 * 設定 (属性の鍵) を受け持つ部品の頁に「書き方の違い」の節を置き、設定ごとに 1 行を並べる。
 * 行は左にその設定を書いた記法の行、右に描いた図を持つ。記法の行と図は、今ある部品の図の記法 (`gallery/<名前>.<図の種類>.dragon`) から引く。
 * 図はその設定を初めて書いた段で止めて描く。設定の一覧は部品の語 (`gallery/uses.ts` の鍵) から作り、全ての部品で集めると記法の読み取りの属性の一覧と一致する。
 *
 * 設定ごとの行を引く関数 (`catalog/parts.ts` の `settingsOf`) が無い間も file を読み込めるよう、名前を値にして読む。
 */
import { checkLayoutText } from "@cardenelabs/dragon";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { beforeAll, describe, expect, it } from "vitest";

import * as WORDS from "../../../../packages/dragon/src/words";
import type { Kind } from "../catalog/catalog";
import * as parts from "../catalog/parts";
import { type Part, PARTS } from "../catalog/parts";
import { PartPage } from "../catalog/PartPage";
import type { Lang } from "../text";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/** jsdom は大きさを測らないので、大きさの見張りは何も知らせない物で置き換える */
class QuietObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}
globalThis.ResizeObserver ??= QuietObserver as unknown as typeof ResizeObserver;

interface SettingRow {
  word: string;
  kind: Kind;
  lines: readonly string[];
  notation: string;
  step: number;
}

const LANGS: readonly Lang[] = ["ja", "en"];
const attrWords = (part: Part): string[] => part.words.filter((word) => word.startsWith("attr:"));
/** 設定を受け持つ部品 */
const SETTING_PARTS = PARTS.filter((part) => attrWords(part).length > 0);
/** 行の頭の語だけを受け持つ部品 */
const PLAIN_PART = PARTS.find((part) => attrWords(part).length === 0);

/** 部品の設定ごとの行。関数が無い時は落とす */
function settingsOf(part: Part, lang: Lang): SettingRow[] {
  const make = (parts as { settingsOf?: (p: Part, l: Lang) => SettingRow[] | undefined }).settingsOf;
  expect(make, "設定ごとの行を引く関数 (`catalog/parts.ts` の `settingsOf`) が無い").toBeTypeOf("function");
  const rows = make?.(part, lang);
  expect(rows, `${part.id} の設定ごとの行が引けない (部品の図の記法が届いていない)`).toBeDefined();
  return rows ?? [];
}

/** 設定の鍵 (`attr:edge.carry` の `carry`) */
const keyOf = (word: string): string => word.split(".")[1] ?? "";

beforeAll(async () => {
  parts.LATER_SNIPPETS.start();
  for (let i = 0; i < 200 && parts.LATER_SNIPPETS.state().status === "loading"; i += 1) await new Promise((resolve) => setTimeout(resolve, 25));
  expect(parts.LATER_SNIPPETS.state().status, "部品の図の記法の塊が届かない").toBe("ready");
});

/** 部品の頁を描き、描いた頁の要素を渡して読む */
async function withPartPage(part: Part, read: (host: HTMLElement) => void): Promise<void> {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(<PartPage part={part} lang="ja" theme="light" palette="paper" />));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  try {
    read(host);
  } finally {
    act(() => root.unmount());
    host.remove();
  }
}

describe("部品の頁の書き方の違い (#3616)", () => {
  it("part-settings-rows-per-attr", async () => {
    expect(SETTING_PARTS.length).toBeGreaterThan(20);
    // 頁を描くのは、線の属性 (運ぶ物)、箱と区画の属性 (色)、値の無い印 (確かめの fail) を受け持つ 3 つの部品にする。
    // 全ての部品の行が設定と 1 対 1 かは part-settings-lines-from-snippets が見る。頁は行を settingsOf からそのまま並べる
    const shown = SETTING_PARTS.filter((part) => ["carry", "color", "check"].includes(part.id));
    expect(shown.map((part) => part.id).sort()).toEqual(["carry", "check", "color"]);
    for (const part of shown) {
      await withPartPage(part, (host) => {
        const section = host.querySelector('[data-catalog="part-settings"]');
        expect(section, `${part.id} の頁に書き方の違いの節が無い`).not.toBeNull();
        const rows = [...(section?.querySelectorAll<HTMLElement>('[data-catalog="part-setting"]') ?? [])];
        expect(
          rows.map((row) => row.dataset.word),
          `${part.id} の頁の行が設定と 1 対 1 でない`,
        ).toEqual(attrWords(part));
        for (const row of rows) {
          expect(row.querySelector("code")?.textContent ?? "", `${part.id} の ${row.dataset.word} の行に記法が無い`).toContain(keyOf(row.dataset.word ?? ""));
          expect(row.querySelector('[data-catalog="part-setting-figure"]'), `${part.id} の ${row.dataset.word} の行に図が無い`).not.toBeNull();
        }
      });
    }
    if (PLAIN_PART) {
      await withPartPage(PLAIN_PART, (host) => {
        expect(host.querySelector('[data-catalog="part-settings"]'), `設定を持たない ${PLAIN_PART.id} の頁に書き方の違いの節が在る`).toBeNull();
      });
    }
  });

  it("part-settings-lines-from-snippets", () => {
    for (const part of SETTING_PARTS) {
      for (const lang of LANGS) {
        const rows = settingsOf(part, lang);
        expect(
          rows.map((row) => row.word),
          `${part.id} ${lang} の行が設定と 1 対 1 でない`,
        ).toEqual(attrWords(part));
        for (const row of rows) {
          expect(row.lines.length, `${part.id} ${lang} の ${row.word} を書いた行が部品の図の記法に無い`).toBeGreaterThan(0);
          for (const line of row.lines) expect(line, `${part.id} ${lang} の ${row.word} の行がその設定を書いていない`).toMatch(new RegExp(`\\b${keyOf(row.word)}\\s*[:,\\]]`, "u"));
          expect(row.notation, `${part.id} ${lang} の ${row.word} の記法が部品の図の記法でない`).toBe(parts.snippetOf(part.id, row.kind, lang));
        }
      }
    }
  });

  it("part-settings-cover-reader-attrs", () => {
    const shown = new Set(SETTING_PARTS.flatMap((part) => settingsOf(part, "ja").map((row) => row.word.slice("attr:".length))));
    const reader = new Set(Object.entries(WORDS.ATTRS).flatMap(([line, keys]) => keys.map((key) => `${line}.${key}`)));
    expect([...reader].filter((pair) => !shown.has(pair)), "記法の読み取りの属性のうち、どの部品の頁にも行が無い").toEqual([]);
    expect([...shown].filter((pair) => !reader.has(pair)), "部品の頁の行のうち、記法の読み取りの属性に無い").toEqual([]);
  });

  it("part-settings-figure-stops-at-use", () => {
    for (const part of SETTING_PARTS) {
      for (const lang of LANGS) {
        for (const row of settingsOf(part, lang)) {
          const lines = row.notation.split("\n");
          const at = lines.findIndex((line) => line.trim() === row.lines[0]);
          expect(at, `${part.id} ${lang} の ${row.word} の行が記法の中に無い`).toBeGreaterThanOrEqual(0);
          const steps = lines.slice(0, at).filter((line) => /^step\s/u.test(line.trim())).length;
          expect(row.step, `${part.id} ${lang} の ${row.word} の図を止める段`).toBe(Math.max(0, steps - 1));
        }
      }
    }
  });

  it("part-settings-figures-have-no-breaks", () => {
    const seen = new Set<string>();
    for (const part of SETTING_PARTS) {
      for (const lang of LANGS) {
        for (const row of settingsOf(part, lang)) {
          if (seen.has(row.notation)) continue;
          seen.add(row.notation);
          const breaks = checkLayoutText(row.notation, { lang });
          expect(
            breaks.map((b) => b.kind),
            `${part.id} ${lang} ${row.kind} の図の崩れ`,
          ).toEqual([]);
        }
      }
    }
    expect(seen.size).toBeGreaterThan(20);
  });

  it("part-page-keeps-kind-figures", async () => {
    const box = PARTS.find((part) => part.id === "box");
    expect(box).toBeDefined();
    if (!box) return;
    await withPartPage(box, (host) => {
      expect(host.querySelectorAll('[data-catalog="part-figure"]').length, "図の種類ごとの部品の図の数").toBe(box.kinds.length);
    });
  });
});
