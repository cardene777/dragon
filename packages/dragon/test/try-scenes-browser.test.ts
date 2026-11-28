/**
 * 場面を選ぶとやり取りの順が替わる選べる図 (`try` の `[shape: scenes]`、#3873) を、実際の Chromium で開いて送る。
 *
 * 広い幅 (760px) は時系列図の部品で描き、物を箱にして、やり取りを番号の丸の付いた送り手の色の矢印で引く。
 * 狭い幅 (390px) は物の名前を札にし、やり取りを「送り手 → 受け手」の札にして縦に積む。
 * どちらも最後に場面の答えの一文と理由を出し、再生の帯は出さない。
 * 動きを減らす設定で開き、動きを飛ばした結果を測る。
 * 頁を開いて触り測る仕事は file を読み込む段 (`at-load.ts`) で済ませ、件は測った値を確かめる (#3816)。
 */
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "playwright-core";
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { exporter } from "./export-support";
import { fileChromium } from "./page-needs";
import { ACTION_LIMIT_MS, PAGE_LIMIT_MS, within } from "./page-wait";
import { parsedTry } from "./try-support";
import {
  SAMPLE,
  SAMPLE_ANSWERS,
  SAMPLE_LANES,
  SAMPLE_ROWS,
  SAMPLE_SCENES,
  SCENE_FIELD,
} from "./try-scenes-support";

const PAGE = "http://localhost/";
const WIDE = 760;
const NARROW = 390;

interface Box {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface Measured {
  lanes: { name: string | null; color: string | null; box: Box; shape: Box; texts: Box[] }[];
  rows: {
    id: string | null;
    from: string | null;
    to: string | null;
    color: string | null;
    text: string;
    badge: string | null;
    box: Box;
    texts: Box[];
    inSvg: boolean;
  }[];
  answer: { head: string; why: string; texts: Box[] } | null;
  bar: boolean;
  fields: (string | null)[];
  page: { scroll: number; client: number };
  player: Box | null;
}

/** 頁の中で、物とやり取りと答えの位置と字を測る */
const measure = (page: Page): Promise<Measured> =>
  page.evaluate(() => {
    const rect = (el: Element): Box => {
      const r = el.getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    };
    const texts = (el: Element): Box[] => {
      const out: Box[] = [];
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!(node.textContent ?? "").trim()) continue;
        const parent = node.parentElement;
        if (parent instanceof SVGElement) {
          out.push(rect(parent));
          continue;
        }
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const r of range.getClientRects())
          out.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
      }
      return out;
    };
    const visible = (el: Element | null | undefined): el is Element =>
      !!el &&
      getComputedStyle(el).display !== "none" &&
      getComputedStyle(el).visibility !== "hidden" &&
      el.getBoundingClientRect().height > 0;
    const player = document.querySelector('[data-dragon="player"]');
    const answer = player?.querySelector('[data-dragon="scene-answer"]');
    return {
      lanes: [...document.querySelectorAll('[data-dragon="player"] [data-scene-lane]')].map(
        (el) => ({
          name: el.getAttribute("data-scene-lane"),
          color: el.getAttribute("data-color"),
          box: rect(el),
          shape: rect(el.querySelector("rect") ?? el),
          texts: texts(el),
        }),
      ),
      rows: [...document.querySelectorAll('[data-dragon="player"] [data-scene-row]')].map((el) => ({
        id: el.getAttribute("data-scene-row"),
        from: el.getAttribute("data-from"),
        to: el.getAttribute("data-to"),
        color: el.getAttribute("data-color"),
        text: el.textContent ?? "",
        badge: el.querySelector("[data-scene-badge]")?.textContent?.trim() ?? null,
        box: rect(el),
        texts: texts(el),
        inSvg: el.closest("svg") !== null,
      })),
      answer: visible(answer)
        ? {
            head: answer.querySelector('[data-scene-answer="head"]')?.textContent?.trim() ?? "",
            why: answer.querySelector('[data-scene-answer="why"]')?.textContent?.trim() ?? "",
            texts: texts(answer),
          }
        : null,
      bar: visible(player?.querySelector(".dg-bar")),
      fields: [...document.querySelectorAll('form[data-dragon="ask"] [data-field]')].map((el) =>
        el.getAttribute("data-field"),
      ),
      page: {
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      },
      player: player ? rect(player) : null,
    };
  });

/** 場面を選ぶ (送らない) */
const pick = (page: Page, scene: string): Promise<string[]> =>
  page.selectOption(`form[data-dragon="ask"] select[data-field="${SCENE_FIELD}"]`, {
    label: scene,
  });

/** 場面を選んで送り、その場面のやり取りが全て出て答えが出るまで待つ */
async function sendScene(page: Page, scene: string): Promise<void> {
  await pick(page, scene);
  await page.locator('button[data-dragon="send"]').click();
  await page.waitForFunction(
    (count) =>
      document.querySelectorAll('[data-dragon="player"] [data-scene-row]').length === count &&
      document.querySelector(
        '[data-dragon="player"] [data-dragon="scene-answer"] [data-scene-answer="head"]',
      ) !== null,
    SAMPLE_ROWS[scene]?.length ?? 0,
    { timeout: ACTION_LIMIT_MS },
  );
}

/** 幅 `width` の Chromium で、動きを減らす設定で HTML を開いて `run` を回す */
async function withPage<T>(
  html: string,
  width: number,
  run: (page: Page) => Promise<T>,
): Promise<T> {
  const context = await within(
    (await fileChromium()).newContext({
      viewport: { width, height: 1400 },
      reducedMotion: "reduce",
    }),
    ACTION_LIMIT_MS,
    "頁の文脈を作る",
  );
  context.setDefaultTimeout(ACTION_LIMIT_MS);
  const openAndRun = async (): Promise<T> => {
    const page = await context.newPage();
    await page.route("**/*", (route) =>
      route.request().url() === PAGE
        ? route.fulfill({ contentType: "text/html; charset=utf-8", body: html })
        : route.abort(),
    );
    await page.goto(PAGE);
    await page
      .locator('[data-dragon="player"]')
      .waitFor({ state: "attached", timeout: ACTION_LIMIT_MS });
    return run(page);
  };
  try {
    return await within(openAndRun(), PAGE_LIMIT_MS, "場面の図の頁の仕事");
  } finally {
    await within(context.close(), ACTION_LIMIT_MS, "頁の文脈を閉じる").catch(() => undefined);
  }
}

const HTML = await atLoad("bitsumi の見本を場面の見た目で HTML に書き出す", async () => {
  const exportDiagram = await exporter();
  const outDir = mkdtempSync(join(tmpdir(), "dragon-try-scenes-browser-"));
  const exported = await exportDiagram(parsedTry(SAMPLE), {
    outDir,
    name: "scenes",
    formats: ["html"],
    lang: "ja",
  });
  expect(exported.files.html, "場面の図を HTML に書き出していない").toBeDefined();
  return readFileSync(exported.files.html ?? "", "utf8");
});

/** 幅ごとに、送る前と、場面を 1 つずつ送った後を測る */
const sendAll = (width: number) =>
  atLoad(`幅 ${width}px の頁で場面を 1 つずつ送って測る`, () =>
    withPage(HTML.get(), width, async (page) => {
      const before = await measure(page);
      const byScene: Record<string, Measured> = {};
      for (const scene of SAMPLE_SCENES) {
        await sendScene(page, scene);
        byScene[scene] = await measure(page);
      }
      return { before, byScene };
    }),
  );

const SENT_WIDE = await sendAll(WIDE);
const SENT_NARROW = await sendAll(NARROW);

const REPICKED = await atLoad("幅 760px の頁で送った後に場面を選び直して測る", () =>
  withPage(HTML.get(), WIDE, async (page) => {
    await sendScene(page, "後で知らせる");
    await pick(page, "その場で返す");
    await page.waitForFunction(
      () => document.querySelectorAll('[data-dragon="player"] [data-scene-row]').length === 0,
      null,
      {
        timeout: ACTION_LIMIT_MS,
      },
    );
    const repicked = await measure(page);
    await sendScene(page, "その場で返す");
    return { repicked, sent: await measure(page) };
  }),
);

const inside = (inner: Box, outer: Box | null): boolean =>
  !!outer &&
  inner.left >= outer.left - 1 &&
  inner.right <= outer.right + 1 &&
  inner.top >= outer.top - 1 &&
  inner.bottom <= outer.bottom + 1;

describe("場面の図を頁で送る (#3873)", () => {
  it("try-scenes-browser-send-760", () => {
    const { before, byScene } = SENT_WIDE.get();
    expect(before.fields, "入力の帯の欄が場面の欄だけでない").toEqual([SCENE_FIELD]);
    for (const scene of SAMPLE_SCENES) {
      const got = byScene[scene];
      expect(got, `場面 ${scene} を送った後を測れていない`).toBeDefined();
      if (!got) continue;
      expect(
        got.lanes.map((lane) => lane.name),
        "物の箱を道の順に描かない",
      ).toEqual(SAMPLE_LANES);
      expect(
        got.rows.map((row) => row.id),
        `場面 ${scene} のやり取りだけを書いた順に描かない`,
      ).toEqual(SAMPLE_ROWS[scene]);
      expect(
        got.rows.every((row) => row.inSvg),
        "広い幅のやり取りを図 (SVG) の矢印で描かない",
      ).toBe(true);
      expect(
        got.rows.map((row) => row.badge),
        "やり取りに 1 から順の番号の丸が無い",
      ).toEqual(got.rows.map((_, i) => String(i + 1)));
      for (const row of got.rows) {
        const sender = got.lanes.find((lane) => lane.name === row.from);
        expect(row.color, `${row.id} の矢印の色が送り手 ${row.from} の箱の色と違う`).toBe(
          sender?.color ?? "-",
        );
      }
      for (let i = 1; i < got.rows.length; i++)
        expect(
          got.rows[i]?.box.top ?? 0,
          `${got.rows[i]?.id} が前のやり取りより上に在る`,
        ).toBeGreaterThan(got.rows[i - 1]?.box.top ?? 0);
      expect(
        got.answer && { head: got.answer.head, why: got.answer.why },
        `場面 ${scene} の答えの一文と理由が出ない`,
      ).toEqual(SAMPLE_ANSWERS[scene]);
      expect(got.bar, "場面の図に再生の帯を出す").toBe(false);
    }
  });

  it("try-scenes-browser-send-390", () => {
    const { byScene } = SENT_NARROW.get();
    for (const scene of SAMPLE_SCENES) {
      const got = byScene[scene];
      expect(got, `場面 ${scene} を送った後を測れていない`).toBeDefined();
      if (!got) continue;
      expect(
        got.lanes.map((lane) => lane.name),
        "物の名前の札を道の順に並べない",
      ).toEqual(SAMPLE_LANES);
      expect(
        got.rows.map((row) => row.id),
        `場面 ${scene} のやり取りだけを書いた順に積まない`,
      ).toEqual(SAMPLE_ROWS[scene]);
      const firstTop = got.rows[0]?.box.top ?? 0;
      for (const lane of got.lanes)
        expect(lane.box.bottom, `物の札 ${lane.name} がやり取りの札の下に在る`).toBeLessThanOrEqual(
          firstTop + 1,
        );
      for (const row of got.rows) {
        const route = row.from === row.to ? (row.from ?? "-") : `${row.from} → ${row.to}`;
        expect(row.text, `${row.id} の札に ${route} が無い`).toContain(route);
      }
      for (let i = 1; i < got.rows.length; i++)
        expect(
          got.rows[i]?.box.top ?? 0,
          `${got.rows[i]?.id} の札が前の札と重なるか上に在る`,
        ).toBeGreaterThanOrEqual((got.rows[i - 1]?.box.bottom ?? 0) - 1);
      expect(
        got.answer && { head: got.answer.head, why: got.answer.why },
        `場面 ${scene} の答えの一文と理由が出ない`,
      ).toEqual(SAMPLE_ANSWERS[scene]);
      expect(got.bar, "場面の図に再生の帯を出す").toBe(false);
    }
  });

  it("try-scenes-browser-repick-resets", () => {
    const { before } = SENT_WIDE.get();
    expect(before.rows, "送る前にやり取りを描く").toEqual([]);
    expect(before.answer, "送る前に答えを出す").toBeNull();
    expect(
      before.lanes.map((lane) => lane.name),
      "送る前に物の箱を描かない",
    ).toEqual(SAMPLE_LANES);
    const { repicked, sent } = REPICKED.get();
    expect(repicked.rows, "選び直した後に前の場面のやり取りが残る").toEqual([]);
    expect(repicked.answer, "選び直した後に前の場面の答えが残る").toBeNull();
    expect(
      repicked.lanes.map((lane) => lane.name),
      "選び直した後に物の箱が消える",
    ).toEqual(SAMPLE_LANES);
    expect(
      sent.rows.map((row) => row.id),
      "選び直して送った場面のやり取りを書いた順に描かない",
    ).toEqual(SAMPLE_ROWS["その場で返す"]);
  });

  it("try-scenes-browser-fits", () => {
    for (const [width, sent] of [
      [WIDE, SENT_WIDE],
      [NARROW, SENT_NARROW],
    ] as const) {
      const { byScene } = sent.get();
      for (const scene of SAMPLE_SCENES) {
        const got = byScene[scene];
        expect(got, `幅 ${width}px で場面 ${scene} を送った後を測れていない`).toBeDefined();
        if (!got) continue;
        expect(
          got.page.scroll,
          `幅 ${width}px で場面 ${scene} の頁が横にはみ出す`,
        ).toBeLessThanOrEqual(got.page.client);
        for (const lane of got.lanes)
          for (const text of lane.texts)
            expect(
              inside(text, lane.shape),
              `幅 ${width}px の物 ${lane.name} の名前が箱の外へはみ出す`,
            ).toBe(true);
        for (const row of got.rows)
          for (const text of row.texts) {
            expect(
              inside(text, got.player),
              `幅 ${width}px の場面 ${scene} の ${row.id} の字が図の外へはみ出す`,
            ).toBe(true);
            if (width === NARROW)
              expect(
                inside(text, row.box),
                `幅 ${width}px の ${row.id} の字が札の外へはみ出す`,
              ).toBe(true);
          }
        for (const text of got.answer?.texts ?? [])
          expect(
            inside(text, got.player),
            `幅 ${width}px の場面 ${scene} の答えの字が図の外へはみ出す`,
          ).toBe(true);
      }
    }
  });
});
