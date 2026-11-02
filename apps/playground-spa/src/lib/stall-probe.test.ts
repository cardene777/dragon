/**
 * 画面を開く検査が落ちた時、頁を閉じる前に頁ごとの様子と機械の様子を 1 行で残す (#3278)。
 *
 * 一式で釦を押す所が 30 秒待って落ち、同じ検査を単独や負荷 40 以上で回すと通った。
 * 落ちた時の様子が残らないと、頁の描き替えが止まった訳を調べられない。
 */
import { existsSync } from "node:fs";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import config from "../../../../vitest.config";
import { closeContextsAfter, probePages, STALL_BACK_WAIT, STALL_RECORD_EXTRA, watchCutRequests } from "./playground-support";

/** Chromium を起こして閉じるまでに許す時間 */
const SETUP = 60_000;

/** 主の処理を `ms` だけ塞ぐ頁を開く。塞ぐ処理が始まってから返す */
async function blockedPage(context: BrowserContext, ms: number): Promise<Page> {
  const page = await context.newPage();
  await page.setContent("<p>塞がる頁</p>");
  await page.evaluate((ms) => {
    setTimeout(() => {
      const end = Date.now() + ms;
      while (Date.now() < end) {
        // 主の処理を塞ぐ
      }
    }, 0);
  }, ms);
  await new Promise((done) => setTimeout(done, 100));
  return page;
}

interface SampledProcess {
  type: string;
  pid: number;
  file: string | null;
  main: string[];
  error?: string;
}

interface StallRecord {
  pages: { responds: boolean; frameMs: number | null; backMs?: number | null }[];
  processes?: SampledProcess[];
}

/** 落ちた検査の記録の 1 行から、`{` から後の JSON を読む */
const recordOf = (line: string | undefined): StallRecord => JSON.parse(line?.slice(line.indexOf("{")) ?? "{}") as StallRecord;

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

  it("stall-record-names-cut-requests", async () => {
    // 通信が切れた頁は切れた file と訳を、頁の塊を待つ頁と読めなかった頁はその状態を記録に書く (#3288)
    const context = await browser.newContext();
    const openWith = async (inside: string): Promise<void> => {
      const page = await context.newPage();
      watchCutRequests(page);
      await page.route("http://dragon.test/page", (route) =>
        route.fulfill({ contentType: "text/html", body: `<main data-site-screen="docs">${inside}</main><script src="/cut.js"></script>` }),
      );
      await page.route("http://dragon.test/cut.js", (route) => route.abort("connectionreset"));
      await page.goto("http://dragon.test/page");
    };
    await openWith('<p data-figure="waiting">読み込み中</p>');
    await openWith('<div data-catalog="later-failed">読めなかった</div>');
    await openWith("<p>本文</p>");
    const lines: string[] = [];
    await closeContextsAfter([context], true, (line) => lines.push(line));
    const record = JSON.parse(lines[0]?.slice(lines[0].indexOf("{")) ?? "{}") as { pages: { cut?: string[]; later?: string | null }[] };
    expect(record.pages.map((p) => p.cut), "切れた通信が記録に無い").toEqual(Array.from({ length: 3 }, () => ["cut.js net::ERR_CONNECTION_RESET"]));
    expect(record.pages.map((p) => p.later), "頁の塊の状態が記録に無い").toEqual(["waiting", "failed", null]);
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

  // `sample` は macOS の命令なので、取れた中身を見る 2 つは macOS でだけ回す。他の機械は訳だけを残す (#3300 の対象外)
  it.runIf(process.platform === "darwin")("stall-record-samples-processes", async () => {
    // 主の処理が塞がった頁を残して閉じると、描画の process と GPU の process ごとに pid と sample の全文の file を持つ (#3300)
    const context = await browser.newContext();
    await blockedPage(context, 9_000);
    const lines: string[] = [];
    await closeContextsAfter([context], true, (line) => lines.push(line), { backWait: 1_000 });
    const processes = recordOf(lines[0]).processes ?? [];
    expect(processes.map((p) => p.type).filter((t) => t === "renderer" || t === "GPU").sort(), "描画の process と GPU の process が記録に無い").toEqual(
      expect.arrayContaining(["GPU", "renderer"]),
    );
    for (const p of processes) {
      expect(p.pid, `${p.type} の pid が無い`).toBeGreaterThan(0);
      expect(p.error, `${p.type} (${p.pid}) の sample が取れない`).toBeUndefined();
      expect(p.file !== null && existsSync(p.file), `${p.type} (${p.pid}) の sample の file が無い: ${p.file}`).toBe(true);
    }
  });

  it.runIf(process.platform === "darwin")("stall-record-names-main-thread", async () => {
    // process ごとに、主の thread が一番長く居た所を呼び出しの末端から 5 段持つ。
    // GPU の process は塞いでいないので、主の thread の末端は機械の待ち (libsystem_kernel) になる
    const context = await browser.newContext();
    await blockedPage(context, 9_000);
    const lines: string[] = [];
    await closeContextsAfter([context], true, (line) => lines.push(line), { backWait: 1_000 });
    const processes = recordOf(lines[0]).processes ?? [];
    expect(processes.length, "process の欄が無い").toBeGreaterThan(0);
    for (const p of processes) {
      expect(p.main, `${p.type} (${p.pid}) の主の thread の段が 5 つでない`).toHaveLength(5);
      for (const frame of p.main) expect(frame, `${p.type} (${p.pid}) の段が「名前 (置き場)」の形でない`).toMatch(/^\S.* \(\S+\)$/u);
    }
    const gpu = processes.find((p) => p.type === "GPU");
    expect(gpu?.main[0], "GPU の process の主の thread の末端が機械の待ちでない").toMatch(/\(libsystem_kernel\.dylib\)$/u);
  });

  it("stall-record-times-recovery", async () => {
    // 塞がりが待つ間に解けた頁は、また描き替えるまでの時間 (ms) を持つ
    const context = await browser.newContext();
    await blockedPage(context, 6_000);
    const lines: string[] = [];
    await closeContextsAfter([context], true, (line) => lines.push(line), { backWait: 12_000, sampler: "/nonexistent/sample" });
    const [page] = recordOf(lines[0]).pages;
    expect(page?.responds, "塞がった頁が初めに調べた時に応えた").toBe(false);
    expect(typeof page?.backMs, `塞がりが解けた頁にまた描き替えるまでの時間が無い: ${String(page?.backMs)}`).toBe("number");
    expect(page?.backMs ?? Infinity, "また描き替えるまでの時間が待つ長さを超える").toBeLessThan(12_000);
  });

  it("stall-record-recovery-null-when-stuck", async () => {
    // 待つ間に塞がりが解けなかった頁は、また描き替えるまでの時間が null になる
    const context = await browser.newContext();
    await blockedPage(context, 10_000);
    const lines: string[] = [];
    await closeContextsAfter([context], true, (line) => lines.push(line), { backWait: 1_000, sampler: "/nonexistent/sample" });
    const [page] = recordOf(lines[0]).pages;
    expect(page?.responds, "塞がった頁が初めに調べた時に応えた").toBe(false);
    expect(page?.backMs, "解けなかった頁のまた描き替えるまでの時間が null でない").toBeNull();
  });

  it("stall-record-sample-failure-named", async () => {
    // sample を起こせない時は、process ごとに起こせなかった訳を書き、記録の 1 行は書く
    const context = await browser.newContext();
    await blockedPage(context, 6_000);
    const lines: string[] = [];
    await closeContextsAfter([context], true, (line) => lines.push(line), { backWait: 500, sampler: "/nonexistent/sample" });
    expect(lines, "sample を起こせない時に記録の 1 行が無い").toHaveLength(1);
    const processes = recordOf(lines[0]).processes ?? [];
    expect(processes.length, "sample を起こせない時に process の欄が無い").toBeGreaterThan(0);
    for (const p of processes) {
      expect(p.error ?? "", `${p.type} (${p.pid}) に起こせなかった訳が無い`).toMatch(/\S/u);
      expect(p.file, `${p.type} (${p.pid}) が起こせなかったのに file を持つ`).toBeNull();
    }
  });

  it("stall-record-fits-hook-timeout", () => {
    // 既定では固まった頁を 60 秒待ち、一式の後始末の上限は、待つ長さに記録を取る他の手間を足した時間より長い
    expect(STALL_BACK_WAIT, "既定の待つ長さが 60 秒でない").toBe(60_000);
    const hookTimeout = config.test?.hookTimeout ?? 0;
    expect(hookTimeout, `後始末の上限 ${hookTimeout}ms が、待つ長さと記録を取る手間の和より短い`).toBeGreaterThan(STALL_BACK_WAIT + STALL_RECORD_EXTRA);
  });

  it("stall-record-skips-sample-when-live", async () => {
    // 全ての頁が描き替えている落ち方では sample を取らず、記録は process の欄を持たない
    const contexts = await Promise.all([browser.newContext(), browser.newContext()]);
    for (const context of contexts) await (await context.newPage()).setContent("<p>動いている頁</p>");
    const lines: string[] = [];
    await closeContextsAfter(contexts, true, (line) => lines.push(line), { backWait: 1_000 });
    const record = recordOf(lines[0]);
    expect("processes" in record, "動いている頁しか無いのに process の欄がある").toBe(false);
    expect(
      record.pages.map((p) => p.responds),
      "動いている頁が応えない扱いになる",
    ).toEqual([true, true]);
  });

  it("stall-record-stuck-page-ends-in-time", async () => {
    // 頁が塞がったままでも、落ちた検査を閉じる処理は、待つ長さに 15 秒を足した時間の中で終わる
    const context = await browser.newContext();
    await blockedPage(context, 40_000);
    const wait = 2_000;
    const start = Date.now();
    await closeContextsAfter([context], true, () => undefined, { backWait: wait });
    const took = Date.now() - start;
    expect(took, `塞がった頁を残して閉じるのに ${took}ms 掛かる`).toBeLessThan(wait + 15_000);
    expect(context.pages(), "塞がった頁が閉じていない").toHaveLength(0);
  });
});
