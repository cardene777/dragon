/**
 * 画面を開く検査が落ちた時、頁を閉じる前に頁ごとの様子と機械の様子を 1 行で残す (#3278)。
 *
 * 一式で釦を押す所が 30 秒待って落ち、同じ検査を単独や負荷 40 以上で回すと通った。
 * 落ちた時の様子が残らないと、頁の描き替えが止まった訳を調べられない。
 */
import { chromium, type Browser } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeContextsAfter, probePages } from "./playground-support";

/** Chromium を起こして閉じるまでに許す時間 */
const SETUP = 60_000;

describe("落ちた検査の頁の様子 (#3278)", () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await chromium.launch();
  }, SETUP);

  afterAll(async () => {
    await browser?.close();
  }, SETUP);

  it("stall-probe-live-page", async () => {
    // 描き替えが動いている頁は、次の描き替えまでの時間と、応えたことと、見えている扱いを返す
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.setContent("<p>動いている頁</p>");
    const [seen] = await probePages([page]);
    await context.close();
    expect(seen?.responds, "動いている頁が応えない扱いになる").toBe(true);
    expect(seen?.frameMs, "動いている頁で描き替えが返らない").not.toBeNull();
    expect(seen?.frameMs ?? Infinity, "動いている頁の描き替えまでの時間が待つ長さを超える").toBeLessThan(3_000);
    expect(seen?.visibility).toBe("visible");
    expect(seen?.width).toBe(390);
  });

  it("stall-probe-blocked-page", async () => {
    // 主の処理が 4 秒塞がった頁を 1 秒待ちで調べると、応えなかったことを返し、調べる処理は 3 秒以内に終わる
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setContent("<p>塞がる頁</p>");
    await page.evaluate(() => {
      setTimeout(() => {
        const end = Date.now() + 4_000;
        while (Date.now() < end) {
          // 主の処理を塞ぐ
        }
      }, 0);
    });
    await new Promise((done) => setTimeout(done, 100));
    const start = Date.now();
    const [seen] = await probePages([page], 1_000);
    const took = Date.now() - start;
    await context.close();
    expect(seen?.responds, "塞がった頁が応えた扱いになる").toBe(false);
    expect(seen?.frameMs).toBeNull();
    expect(seen?.visibility).toBeNull();
    expect(took, `塞がった頁を調べるのに ${took}ms 掛かる`).toBeLessThan(3_000);
  });

  it("stall-record-on-failed-test", async () => {
    // 落ちた検査で閉じる時は、開いていた頁の数だけの様子と、負荷と空きの記憶を含む 1 行を書き、context を閉じる
    const contexts = await Promise.all([browser.newContext(), browser.newContext()]);
    for (const context of contexts) await (await context.newPage()).setContent("<p>開いていた頁</p>");
    const lines: string[] = [];
    await closeContextsAfter(contexts, true, (line) => lines.push(line));
    expect(lines, "落ちた検査で 1 行を書かない").toHaveLength(1);
    const record = JSON.parse(lines[0]?.slice(lines[0].indexOf("{")) ?? "{}") as { pages: unknown[]; load: number; cores: number; freeMb: number };
    expect(record.pages, "開いていた頁の数だけの様子が無い").toHaveLength(2);
    expect(record.load, "負荷が無い").toBeGreaterThanOrEqual(0);
    expect(record.cores, "core の数が無い").toBeGreaterThan(0);
    expect(record.freeMb, "空きの記憶が無い").toBeGreaterThan(0);
    expect(contexts.flatMap((c) => c.pages()), "落ちた検査の後に頁が閉じていない").toHaveLength(0);
  });

  it("stall-record-silent-on-passed-test", async () => {
    // 通った検査で閉じる時は何も書かず、context を閉じる
    const context = await browser.newContext();
    await (await context.newPage()).setContent("<p>開いていた頁</p>");
    const lines: string[] = [];
    await closeContextsAfter([context], false, (line) => lines.push(line));
    expect(lines, "通った検査で何かを書く").toEqual([]);
    expect(context.pages(), "通った検査の後に頁が閉じていない").toHaveLength(0);
  });
});
