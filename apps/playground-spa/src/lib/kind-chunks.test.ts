/**
 * 図の種類の描く部品を、頁が最初に読む script から外して後から読む (#3248)。
 *
 * git、time、state、tree、lineup の部品は種類ごとの塊にし、最初の画面を描いた後に裏で読み始める。
 * 時系列図と構成図は概要の頁が待たずに描くので、最初に読む script に残す。
 * 塊が届かない間は図の場所に決まった高さの枠と「読み込み中」を出し、読めなかった時は読み直す釦を出す。編集画面は前の図を残す。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Page, Route } from "playwright";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { toHash } from "../share";
import { BASE, firstLoadFiles, root, type Site, startSite } from "./playground-support";

/** 頁を build して Chromium を起こすまでに許す時間 */
const SETUP = 300_000;
/** 画面を開いて確かめるのに許す時間 */
const SLOW = 120_000;
/** Chromium を閉じて配る場所を止めるまでに許す時間 (`playground.test.ts` と同じ理由) */
const TEARDOWN = 90_000;
/** 頁が書き換わるのを待つ長さ */
const WAIT = { timeout: 8_000, interval: 100 } as const;

/** 後から読む種類と、その種類だけの描く部品の file */
const LATER_KINDS: Readonly<Record<string, readonly string[]>> = {
  git: ["layout/git.ts", "render/git.ts"],
  lineup: ["layout/lineup.ts", "render/lineup.ts"],
  state: ["layout/state.ts"],
  time: ["layout/time.ts", "render/time.ts"],
  tree: ["layout/tree.ts", "render/tree.ts"],
};
/** 後から読む塊の小さすぎる字数。部品が最初に読む側へ漏れると、塊は入口だけの大きさになる */
const CHUNK_AT_LEAST = 2_000;

const SRC = join(root, "packages/dragon/src");

function sourcesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourcesUnder(path);
    return /\.ts$/u.test(name) ? [path] : [];
  });
}

/**
 * その種類の部品の file だけが持つ字の並び。minify しても字の並びは残るので、script の中に部品が入っているかを字の並びで見る。
 * 手で選ぶと部品を直した時に空振りするので、元の file から導く
 */
function markersOf(kind: string): string[] {
  const own = (LATER_KINDS[kind] ?? []).map((file) => join(SRC, file));
  const others = sourcesUnder(SRC)
    .filter((path) => !own.includes(path))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  const found = own.flatMap((path) => {
    const code = readFileSync(path, "utf8")
      .replace(/\/\*[\s\S]*?\*\//gu, "")
      .split("\n")
      .filter((line) => !/^\s*(\/\/|import )/u.test(line))
      .join("\n");
    return [...code.matchAll(/["`]([^"`\\\n$]*data-[^"`\\\n$]*)["`]/gu)].map((m) => m[1] ?? "");
  });
  return [...new Set(found)].filter((text) => text.trim().length > 0 && !others.includes(text));
}

let site: Site;

const assets = (): string => join(site.built.dir, "assets");
const fileOf = (url: string): string => new URL(url).pathname.split("/").pop() ?? "";
const screenOf = (page: Page): Promise<string | null> =>
  page.evaluate(() => document.querySelector("[data-site-screen]")?.getAttribute("data-site-screen") ?? null);

/** その種類の塊の file の名前。無ければ `undefined` */
const chunkOf = (kind: string): string | undefined => {
  const first = new Set(firstLoadFiles(site.built.dir));
  return readdirSync(assets()).find((name) => name.startsWith(`${kind}-`) && name.endsWith(".js") && !first.has(name));
};

/** その種類の塊の名前。無ければ落とす */
function chunkNamed(kind: string): string {
  const name = chunkOf(kind);
  expect(name, `${kind} の部品を持つ後から読む塊が無い`).toBeDefined();
  return name ?? "";
}

const figures = (page: Page, scope: string): Promise<number> => page.locator(`${scope} svg[data-dragon="figure"]`).count();

/** 届くのを止める。返す関数を呼ぶと届く */
function holdChunk(page: Page, name: string): { release: () => void; held: () => boolean } {
  let held = false;
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  void page.route(`**/assets/${name}`, async (route: Route) => {
    held = true;
    await gate;
    await route.continue();
  });
  return { release: () => release(), held: () => held };
}

describe("図の種類の描く部品を後から読む (#3248)", () => {
  beforeAll(async () => {
    site = await startSite();
  }, SETUP);

  afterEach(async () => {
    await site?.closeContexts();
  });

  afterAll(async () => {
    await site?.close();
  }, TEARDOWN);

  it("first-load-leaves-later-kinds-out", () => {
    const first = firstLoadFiles(site.built.dir)
      .filter((name) => name.endsWith(".js"))
      .map((name) => readFileSync(join(assets(), name), "utf8"))
      .join("\n");
    for (const kind of Object.keys(LATER_KINDS)) {
      const chunk = readFileSync(join(assets(), chunkNamed(kind)), "utf8");
      expect(chunk.length, `${kind} の塊の字数`).toBeGreaterThan(CHUNK_AT_LEAST);
      const markers = markersOf(kind);
      // state の部品は置き場所の計算だけで字の並びを持たない。部品の在り処は塊の字数で見る
      if (kind === "state") continue;
      expect(markers.length, `${kind} の部品だけが持つ字の並びを導けない (走査の空振り)`).toBeGreaterThan(0);
      expect(
        markers.filter((text) => first.includes(text)),
        `最初に読む script に在る ${kind} の部品の字の並び`,
      ).toEqual([]);
      expect(
        markers.filter((text) => chunk.includes(text)).length,
        `${kind} の塊に在る ${kind} の部品の字の並びの数`,
      ).toBeGreaterThan(0);
    }
  });

  it(
    "site-prefetches-later-kinds",
    async () => {
      const names = Object.keys(LATER_KINDS).map(chunkNamed);
      const asked = new Set<string>();
      const { page } = await site.open({
        path: BASE,
        prepare: (p) => {
          p.on("request", (request) => asked.add(fileOf(request.url())));
        },
      });
      await expect.poll(() => screenOf(page), { ...WAIT, message: "概要の頁が出ない" }).toBe("home");
      await expect.poll(() => names.filter((name) => !asked.has(name)), { ...WAIT, message: "裏で読みに行かない種類の塊" }).toEqual([]);
    },
    SLOW,
  );

  it(
    "figure-waits-for-later-kind",
    async () => {
      const name = chunkNamed("lineup");
      let gate: ReturnType<typeof holdChunk> | undefined;
      const { page } = await site.open({
        path: `${BASE}catalog/lineup`,
        viewport: { width: 1440, height: 900 },
        reducedMotion: "reduce",
        prepare: (p) => {
          gate = holdChunk(p, name);
        },
      });
      await expect.poll(() => screenOf(page), { ...WAIT, message: "列の図の頁が出ない" }).toBe("category");
      await expect.poll(() => gate?.held() ?? false, { ...WAIT, message: "列の図の塊を読みに行かない" }).toBe(true);
      const waiting = page.locator('[data-catalog="stage"] [data-figure="waiting"]');
      await expect.poll(() => waiting.count(), { ...WAIT, message: "塊が届く前に図の場所に待つ枠が出ない" }).toBe(1);
      expect((await waiting.textContent())?.trim(), "待つ枠の字").toBe("読み込み中");
      expect((await waiting.evaluate((el) => el.getBoundingClientRect().height)) > 0, "待つ枠の高さが 0").toBe(true);
      expect(await figures(page, '[data-catalog="stage"]'), "塊が届く前に図を描いた").toBe(0);
      gate?.release();
      await expect.poll(() => figures(page, '[data-catalog="stage"]'), { ...WAIT, message: "塊が届いても図を描かない" }).toBeGreaterThan(0);
      expect(await waiting.count(), "図を描いた後に待つ枠が残る").toBe(0);
    },
    SLOW,
  );

  it(
    "figure-offers-reload-when-kind-fails",
    async () => {
      const name = chunkNamed("tree");
      const { page } = await site.open({
        path: `${BASE}catalog/tree`,
        viewport: { width: 1440, height: 900 },
        reducedMotion: "reduce",
        prepare: async (p) => {
          await p.route(`**/assets/${name}`, (route) => route.abort());
        },
      });
      await expect.poll(() => screenOf(page), { ...WAIT, message: "木の図の頁が出ない" }).toBe("category");
      const reload = page.locator('[data-catalog="stage"] button[data-catalog="reload"]');
      await expect.poll(() => reload.count(), { ...WAIT, message: "塊を読めない時に図の場所に読み直す button が出ない" }).toBe(1);
      expect((await reload.textContent())?.trim(), "読み直す button の字").toBe("読み直す");
    },
    SLOW,
  );

  it(
    "stage-waiting-in-first-view",
    async () => {
      const name = chunkNamed("lineup");
      const stage = '[data-catalog="stage"]';
      /** 枠は図の高さを取って画面より伸びるので、枠ではなく字そのものの下端を測る */
      const textBottom = (page: Page): Promise<number> =>
        page.locator(`${stage} [data-figure="waiting"]`).evaluate((el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          return range.getBoundingClientRect().bottom;
        });
      const waitingOn = async (viewport: { width: number; height: number }): Promise<Page> => {
        const { page } = await site.open({
          path: `${BASE}catalog/lineup`,
          viewport,
          reducedMotion: "reduce",
          prepare: (p) => {
            holdChunk(p, name);
          },
        });
        await expect.poll(() => page.locator(`${stage} [data-figure="waiting"]`).count(), { ...WAIT, message: "待つ枠が出ない" }).toBe(1);
        return page;
      };

      const pc = await waitingOn({ width: 1366, height: 720 });
      expect(await textBottom(pc), "読み込み中の字が最初の画面の外に出る").toBeLessThanOrEqual(720);

      const phone = await waitingOn({ width: 390, height: 844 });
      const stageTop = await phone.locator(stage).evaluate((el) => el.getBoundingClientRect().top);
      expect((await textBottom(phone)) - stageTop, "幅 390 で読み込み中の字が枠の上端から遠い").toBeLessThanOrEqual(120);

      const failed = await site.open({
        path: `${BASE}catalog/lineup`,
        viewport: { width: 1366, height: 720 },
        reducedMotion: "reduce",
        prepare: async (p) => {
          await p.route(`**/assets/${name}`, (route) => route.abort());
        },
      });
      const reload = failed.page.locator(`${stage} button[data-catalog="reload"]`);
      await expect.poll(() => reload.count(), { ...WAIT, message: "読み直す button が出ない" }).toBe(1);
      expect(await reload.evaluate((el) => el.getBoundingClientRect().bottom), "読み直す button が最初の画面の外に出る").toBeLessThanOrEqual(720);
    },
    SLOW,
  );

  it(
    "editor-keeps-figure-while-kind-loads",
    async () => {
      const name = chunkNamed("git");
      let gate: ReturnType<typeof holdChunk> | undefined;
      const { page } = await site.open({
        path: `${BASE}editor`,
        prepare: (p) => {
          gate = holdChunk(p, name);
        },
      });
      await expect.poll(() => screenOf(page), { ...WAIT, message: "編集画面が出ない" }).toBe("editor");
      const scope = '[data-playground="figure"]';
      await expect.poll(() => figures(page, scope), { ...WAIT, message: "最初の見本の図が描かれない" }).toBeGreaterThan(0);
      const before = await page.locator(`${scope} svg[data-dragon="figure"]`).first().innerHTML();
      const git = ["git 枝の図", "", "branch main", "", "step 積む", "  say 枝に積む。", "  commit A on main"].join("\n");
      await page.locator('[data-playground="editor"]').fill(git);
      await page.waitForTimeout(1_500);
      expect(await page.locator(`${scope} svg[data-dragon="figure"]`).first().innerHTML(), "塊を待つ間に前の図が残らない").toBe(before);
      expect(await page.locator('[data-playground="status"]').getAttribute("data-state"), "塊を待つ間に誤りを出した").not.toBe("error");
      gate?.release();
      await expect
        .poll(async () => (await page.locator(`${scope} svg[data-dragon="figure"]`).first().innerHTML()) !== before, { ...WAIT, message: "塊が届いても新しい図に替わらない" })
        .toBe(true);
    },
    SLOW,
  );

  it(
    "editor-status-waits-for-kind",
    async () => {
      const git = ["git 枝の図", "", "branch main", "", "step 積む", "  say 枝に積む。", "  commit A on main"].join("\n");
      const name = chunkNamed("git");
      const status = (page: Page) => page.locator('[data-playground="status"]');

      // 開いた見本から書き替えた時
      let gate: ReturnType<typeof holdChunk> | undefined;
      const { page } = await site.open({
        path: `${BASE}editor`,
        prepare: (p) => {
          gate = holdChunk(p, name);
        },
      });
      await expect.poll(() => figures(page, '[data-playground="figure"]'), { ...WAIT, message: "最初の見本の図が描かれない" }).toBeGreaterThan(0);
      const shown = (await status(page).innerText()).trim();
      await page.locator('[data-playground="editor"]').fill(git);
      await expect.poll(() => status(page).getAttribute("data-state"), { ...WAIT, message: "塊を待つ間の状態にならない" }).toBe("waiting");
      const waiting = await status(page).innerText();
      expect(waiting, "塊を待つ間に読み込み中と出ない").toContain("読み込み中");
      expect(waiting, "塊を待つ間に前の図の数が残る").not.toContain(shown);
      gate?.release();
      await expect.poll(() => status(page).getAttribute("data-state"), { ...WAIT, message: "塊が届いても待つ間の状態のまま" }).toBe("ok");
      expect(await status(page).innerText(), "塊が届いた後に新しい図の数が出ない").toContain("枝 1 本、段 1");

      // 待つ種類の記法を載せた URL で開いた時。別の種類の塊が届くと読み直して待つ状態に入るので、開いた時の状態だけを見るよう全ての塊を止める
      const held: ReturnType<typeof holdChunk>[] = [];
      const shared = await site.open({
        path: `${BASE}editor${toHash(git)}`,
        prepare: (p) => {
          for (const kind of Object.keys(LATER_KINDS)) held.push(holdChunk(p, chunkNamed(kind)));
        },
      });
      await expect.poll(() => screenOf(shared.page), { ...WAIT, message: "編集画面が出ない" }).toBe("editor");
      expect(await status(shared.page).getAttribute("data-state"), "URL で開いた時に待つ間の状態にならない").toBe("waiting");
      expect(await status(shared.page).innerText(), "URL で開いた時に読み込み中と出ない").toContain("読み込み中");
      for (const gate of held) gate.release();
    },
    SLOW,
  );

  it(
    "home-draws-without-later-kinds",
    async () => {
      const later = Object.keys(LATER_KINDS)
        .map(chunkOf)
        .filter((name): name is string => name !== undefined);
      const { page } = await site.open({
        path: BASE,
        prepare: async (p) => {
          for (const name of later) await p.route(`**/assets/${name}`, (route) => route.abort());
        },
      });
      await expect.poll(() => screenOf(page), { ...WAIT, message: "種類の塊を止めると概要の頁が出ない" }).toBe("home");
      await expect.poll(() => figures(page, '[data-home="use"]'), { ...WAIT, message: "種類の塊を止めると概要の頁の用例の図が 3 つ描かれない" }).toBe(3);
    },
    SLOW,
  );
});
