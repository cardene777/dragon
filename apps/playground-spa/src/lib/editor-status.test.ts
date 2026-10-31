/**
 * 編集画面の状態の欄は、図の種類の主な部品を部品の頁と同じ呼び名で数えて出す (#3261)。
 *
 * 数は欄の実装と別に見本の JSON から数える。同じ関数で数えると、数え方を誤っても検査が通る。
 */
import type { Page } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { toHash } from "../share";
import { BASE, example, type Site, startSite } from "./playground-support";

/** 頁を build して Chromium を起こすまでに許す時間 */
const SETUP = 300_000;
/** 画面を開いて確かめるのに許す時間 */
const SLOW = 120_000;
/** Chromium を閉じて配る場所を止めるまでに許す時間 (`playground.test.ts` と同じ理由) */
const TEARDOWN = 90_000;
/** 頁が書き換わるのを待つ長さ */
const WAIT = { timeout: 8_000, interval: 100 } as const;

interface Example {
  boxes: unknown[];
  steps: { events: { type: string }[] }[];
  git?: { branches: unknown[] };
  time?: { rows: unknown[] };
}

const boxes = (d: Example): number => d.boxes.length;
const JA_BOXES = (n: number): string => `箱 ${n} つ`;
const EN_BOXES = (n: number): string => `${n} boxes`;

/** 7 種類の見本と、その種類で数える物と呼び名 */
const CASES: { name: string; count: (d: Example) => number; ja: (n: number) => string; en: (n: number) => string }[] = [
  { name: "oauth", count: boxes, ja: JA_BOXES, en: EN_BOXES },
  { name: "ccip", count: boxes, ja: JA_BOXES, en: EN_BOXES },
  { name: "order", count: boxes, ja: JA_BOXES, en: EN_BOXES },
  { name: "merge", count: (d) => d.git?.branches.length ?? -1, ja: (n) => `枝 ${n} 本`, en: (n) => `${n} branches` },
  { name: "finality", count: (d) => d.time?.rows.length ?? -1, ja: (n) => `印の列 ${n} 本`, en: (n) => `${n} rows` },
  {
    name: "merkle",
    count: (d) => d.steps.flatMap((s) => s.events).filter((e) => e.type === "leaf" || e.type === "node").length,
    ja: JA_BOXES,
    en: EN_BOXES,
  },
  { name: "auction", count: boxes, ja: (n) => `列 ${n} 本`, en: (n) => `${n} lanes` },
];

/** 部品が 1 つの記法。英語の頁で単数形を確かめる */
const SINGULAR: { notation: string; said: string }[] = [
  { notation: ["sequence One box", "", "box a", "", "step Start", "  say Only one box."].join("\n"), said: "1 box, 1 step" },
  { notation: ["git One branch", "", "branch main", "", "step Start", "  say Only one branch.", "  commit A on main"].join("\n"), said: "1 branch, 1 step" },
  { notation: ["lineup One lane", "", "box a", "", "item t1", "", "step Start", "  say Only one lane.", "  line a: t1"].join("\n"), said: "1 lane, 1 step" },
];

function read(file: string): string {
  const text = example(file);
  if (text === undefined) throw new Error(`見本が無い: ${file}`);
  return text;
}

describe("編集画面の状態の欄の数 (#3261)", () => {
  let site: Site | undefined;

  beforeAll(async () => {
    site = await startSite();
  }, SETUP);

  afterEach(async () => {
    await site?.closeContexts();
  });

  afterAll(async () => {
    await site?.close();
  }, TEARDOWN);

  const opened = async (notation: string, locale: string): Promise<Page> => {
    if (!site) throw new Error("頁が起きていない");
    const { page } = await site.open({ path: `${BASE}editor${toHash(notation)}`, locale });
    return page;
  };
  const shown = async (page: Page, said: string): Promise<void> => {
    await expect.poll(() => page.locator(".pg-ok").textContent(), { ...WAIT, message: `状態の欄に「${said}」が出ない` }).toContain(said);
  };

  it(
    "editor-status-counts-by-kind",
    async () => {
      for (const { name, count, ja, en } of CASES) {
        const jaDiagram = JSON.parse(read(`${name}.json`)) as Example;
        await shown(await opened(read(`${name}.dragon`), "ja-JP"), `読めています — ${ja(count(jaDiagram))}、段 ${jaDiagram.steps.length}`);
        const enDiagram = JSON.parse(read(`${name}.en.json`)) as Example;
        await shown(await opened(read(`${name}.en.dragon`), "en-US"), `Reads fine — ${en(count(enDiagram))}, ${enDiagram.steps.length} steps`);
      }
      for (const { notation, said } of SINGULAR) await shown(await opened(notation, "en-US"), `Reads fine — ${said}`);
      const withdraw = JSON.parse(read("withdraw.en.json")) as Example;
      expect(withdraw.time?.rows.length, "単数形を確かめる見本の印の列が 1 本でない").toBe(1);
      await shown(await opened(read("withdraw.en.dragon"), "en-US"), `Reads fine — 1 row, ${withdraw.steps.length} steps`);
    },
    SLOW,
  );
});
