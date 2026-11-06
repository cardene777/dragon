/**
 * 読み手が値を入れて動かせる図を、実際の Chromium で触る (#3337)。
 *
 * 試す図を HTML に書き出し、`http://localhost/` に置いた頁で開く。
 * 幅 390px の枠では、線の上に置いた釦も入力の帯へ移り、全ての操作が幅に収まって縦横 44px 以上の大きさを持つ。
 * 送る、作る、書き換えるを押す間、保存の道具 (`localStorage`、`sessionStorage`) を使わず、頁の外への通信をしない。
 * jsdom は配置を測れず通信も持たないので、この 2 つはここで確かめる。
 */
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "playwright-core";
import { describe, expect, it } from "vitest";
import { exporter } from "./export-support";
import { fileChromium } from "./page-needs";
import { parsedTry, SMALL_PARTS, smallTry } from "./try-support";


const PAGE = "http://localhost/";

/** 作る釦を機械の列の上に置いた小さな図 */
const onLine = (): unknown =>
  parsedTry(
    smallTry({
      parts: SMALL_PARTS.map((line) =>
        line.startsWith("press ")
          ? "press build [from: pool, into: blocks, take: 3, at: blocks]"
          : line,
      ),
    }),
  );

/** 原本を HTML に書き出した中身 */
async function htmlOf(diagram: unknown): Promise<string> {
  const exportDiagram = await exporter();
  const outDir = mkdtempSync(join(tmpdir(), "dragon-try-browser-"));
  const exported = await exportDiagram(diagram, {
    outDir,
    name: "try",
    formats: ["html"],
    lang: "ja",
  });
  expect(exported.files.html, "試す図を HTML に書き出していない").toBeDefined();
  return readFileSync(exported.files.html ?? "", "utf8");
}

/** 頁の中で数える、保存の道具と通信の道具を呼んだ回数 */
const COUNT_CALLS = `(() => {
  const calls = [];
  window.__dragonCalls = calls;
  const wrap = (owner, name, label) => {
    const original = owner[name];
    if (typeof original !== "function") return;
    owner[name] = function (...args) {
      calls.push(label);
      return original.apply(this, args);
    };
  };
  wrap(Storage.prototype, "setItem", "storage.setItem");
  wrap(Storage.prototype, "removeItem", "storage.removeItem");
  wrap(Storage.prototype, "clear", "storage.clear");
  wrap(window, "fetch", "fetch");
  wrap(XMLHttpRequest.prototype, "open", "XMLHttpRequest");
  wrap(navigator, "sendBeacon", "sendBeacon");
  const Socket = window.WebSocket;
  window.WebSocket = function (...args) {
    calls.push("WebSocket");
    return new Socket(...args);
  };
})();`;

interface Opened<T> {
  result: T;
  /** 頁の外へ出た通信の URL */
  outside: string[];
}

/** 幅 `width` の Chromium で HTML を開いて `run` を回す */
async function withPage<T>(
  html: string,
  width: number,
  run: (page: Page) => Promise<T>,
): Promise<Opened<T>> {
  // file で 1 つの Chromium に頁ごとの文脈を作る (#3424)。頁を開くたびに Chromium を起こすと、混んだ機械で 1 回ごとに 1 秒ほどかかった
  const context = await (await fileChromium()).newContext({ viewport: { width, height: 1600 }, hasTouch: true });
  try {
    const page = await context.newPage();
    const outside: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (url !== PAGE && !url.startsWith("data:") && !url.startsWith("blob:")) outside.push(url);
    });
    await page.addInitScript(COUNT_CALLS);
    await page.route("**/*", (route) =>
      route.request().url() === PAGE
        ? route.fulfill({ contentType: "text/html; charset=utf-8", body: html })
        : route.abort(),
    );
    await page.goto(PAGE);
    await page
      .locator('[data-dragon="player"] svg[data-dragon="figure"]')
      .waitFor({ state: "attached" });
    return { result: await run(page), outside };
  } finally {
    await context.close();
  }
}

/** 入力の帯の欄に打ち込んで送る */
async function sendOn(page: Page, values: Record<string, string>): Promise<void> {
  for (const [field, value] of Object.entries(values))
    await page.locator(`form[data-dragon="ask"] input[data-field="${field}"]`).fill(value);
  await page.locator('button[data-dragon="send"]').click();
}

describe("試す図を Chromium で触る (#3337)", () => {
  it(
    "interactive-controls-fit-390-at-44px",
    async () => {
      const html = await htmlOf(onLine());
      const { result } = await withPage(html, 390, (page) =>
        page.evaluate(() => {
          const controls = [
            ...document.querySelectorAll<HTMLElement>(
              '[data-dragon="player"] input, [data-dragon="player"] button, [data-dragon="player"] select, [data-dragon="player"] textarea',
            ),
          ];
          return {
            width: document.documentElement.clientWidth,
            controls: controls.map((control) => {
              const box = control.getBoundingClientRect();
              return {
                name:
                  control.dataset.field ??
                  control.dataset.press ??
                  control.dataset.dragon ??
                  control.tagName,
                left: box.left,
                right: box.right,
                width: box.width,
                height: box.height,
                inStrip: control.closest('[data-dragon="ask"]') !== null,
              };
            }),
          };
        }),
      );
      const names = result.controls.map((control) => control.name);
      for (const field of ["sender", "to", "amount", "fee"])
        expect(names, `幅 390px に ${field} の欄が無い`).toContain(field);
      expect(names, "幅 390px に送る釦が無い").toContain("send");
      expect(names, "幅 390px に作る釦が無い").toContain("build");
      const build = result.controls.find((control) => control.name === "build");
      expect(build?.inStrip, "幅 390px で、線の上に置いた作る釦が入力の帯へ移らない").toBe(true);
      for (const control of result.controls) {
        expect(control.left, `幅 390px で ${control.name} が左にはみ出す`).toBeGreaterThanOrEqual(
          0,
        );
        expect(control.right, `幅 390px で ${control.name} が右にはみ出す`).toBeLessThanOrEqual(
          result.width,
        );
        expect(
          control.width,
          `幅 390px で ${control.name} の幅が 44px より狭い`,
        ).toBeGreaterThanOrEqual(44);
        expect(
          control.height,
          `幅 390px で ${control.name} の高さが 44px より低い`,
        ).toBeGreaterThanOrEqual(44);
      }
    },
  );

  it(
    "interactive-uses-no-storage-or-network",
    async () => {
      const html = await htmlOf(parsedTry(smallTry()));
      const { result, outside } = await withPage(html, 1024, async (page) => {
        await sendOn(page, { sender: "me", to: "bob", amount: "2", fee: "6" });
        await page.locator('button[data-dragon="press"][data-press="build"]').click();
        await page
          .locator('svg[data-dragon="figure"] [data-chip="o1"]')
          .first()
          .click({ force: true });
        await page.locator('form[data-dragon="edit"] input[data-field="amount"]').fill("30");
        await page.locator('form[data-dragon="edit"] button[type="submit"]').click();
        return page.evaluate(() => ({
          calls: (window as unknown as { __dragonCalls?: string[] }).__dragonCalls ?? [
            "(数える道具が入らない)",
          ],
          local: window.localStorage.length,
          session: window.sessionStorage.length,
          linked:
            document.querySelector('svg[data-dragon="figure"]')?.textContent?.includes("≠") ??
            false,
        }));
      });
      expect(result.linked, "書き換えまで押せていない (食い違いの印が出ない)").toBe(true);
      expect(result.calls, "保存の道具か通信の道具を呼んだ").toEqual([]);
      expect(result.local, "localStorage に値が残る").toBe(0);
      expect(result.session, "sessionStorage に値が残る").toBe(0);
      expect(outside, "頁の外へ通信した").toEqual([]);
    },
  );
});
