// @vitest-environment jsdom
/**
 * jsDelivr の入口が、配管の図を描いた後の空いた時間に、畳んだ箱を 1 つだけ開いた形を先に組む (#3753)。
 *
 * 並べ方の覚えは module の中に在るので、頁を描く前に module を読み直し (`vi.resetModules`)、覚えの無い状態から入口を読む。
 * 空いた時間に回す仕事 (`requestIdleCallback`) は検査が預かり、最初の図を描いた後に預かった順に回す。
 * 道を探した回数は、読み直した module の `Router` の `route` を数える。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ONE_FOLD, REPO, TWO_FOLDS } from "./pipe-stored-layout-support";
// 入口の軽い読み込み (`light.ts`) が読む、組み立てが埋める共有のブロックの値を置く
import "./built-globals";

const AGGREGATOR = readFileSync(join(REPO, "packages/dragon/examples/aggregator.dragon"), "utf8");
/** 箱の名前を替えた小さな見本。同じ頁に置いた ONE_FOLD と記法だけが違う */
const RENAMED = ONE_FOLD.replaceAll("Aggregator", "Vault");

const escape = (text: string): string => text.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;");
const block = (text: string): string => `<pre class="dragon">${escape(text)}</pre>`;
const pause = (ms: number): Promise<void> => new Promise((done) => setTimeout(done, ms));

interface Page {
  routeCalls: () => number;
  /** 預かった空いた時間の仕事のうち、まだ回していない物 */
  queued: (() => void)[];
  /** 入口が空いた時間に預けた仕事の数 */
  scheduled: () => number;
}

/** module を読み直し、記法の塊を `body` に置いた頁で入口 `entry` を読み、塊が図に置き換わるまで待つ */
async function openPage(body: string, entry: "script" | "script-offline"): Promise<Page> {
  vi.resetModules();
  const queued: (() => void)[] = [];
  let scheduled = 0;
  vi.stubGlobal("requestIdleCallback", (run: () => void) => {
    scheduled++;
    queued.push(run);
    return scheduled;
  });
  // build が入れる図の字の版。字の CSS は読まないので空にする
  vi.stubGlobal("__DRAGON_FONT_VERSIONS__", {});
  document.documentElement.lang = "ja";
  document.body.innerHTML = body;
  const { Router } = await import("../src/pipe-route");
  // 読み直すたびに別の Router を読むので、前の件に数えた回数を引き継がない
  const route = vi.spyOn(Router.prototype, "route");
  await (entry === "script" ? import("../src/script") : import("../src/script-offline"));
  const wanted = document.querySelectorAll("pre.dragon").length;
  for (let i = 0; i < 500 && (document.querySelector("pre.dragon") || document.querySelectorAll(".dragon-figure svg").length < wanted); i++) await pause(10);
  expect(document.querySelector("pre.dragon-error")?.textContent ?? "", "入口が記法の塊を誤りの文に置き換えた").toBe("");
  expect(document.querySelector("pre.dragon"), "入口が記法の塊を図に置き換えない").toBeNull();
  return { routeCalls: () => route.mock.calls.length, queued, scheduled: () => scheduled };
}

/** 入口が空いた時間の仕事を預けるまで待ち、預けた仕事が尽きるまで回す。預けない入口は `wait` ms 待って戻る */
async function runIdle(page: Page, wait = 1000): Promise<void> {
  for (let waited = 0; page.queued.length === 0 && waited < wait; waited += 10) await pause(10);
  for (let round = 0; round < 20 && page.queued.length > 0; round++) {
    while (page.queued.length > 0) page.queued.shift()?.();
    await pause(10);
  }
}

/** 図の中の、呼び出し `call` の畳んだ箱を押す */
function press(figure: Element, call: string): void {
  const box = figure.querySelector(`[data-pipe-fold="${call}"]`);
  expect(box, `呼び出し ${call} の畳んだ箱が無い`).not.toBeNull();
  box?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
}

const foldCalls = (figure: Element): string[] => [...new Set([...figure.querySelectorAll("[data-pipe-fold]")].map((box) => box.getAttribute("data-pipe-fold") ?? ""))];
const stepCount = (figure: Element): number => figure.querySelectorAll('[data-dragon="steps"] > li').length;

// 入口と描く部品の module を件の外で 1 度読み、件の中で読み直す時に変換を待たない。入口は空の頁を描くだけで終わる
beforeAll(async () => {
  vi.stubGlobal("__DRAGON_FONT_VERSIONS__", {});
  await Promise.all([import("../src/script"), import("../src/kinds/pipe"), import("../src/kind-use/pipe"), import("../src/core"), import("../src/parser")]);
});
beforeAll(async () => {
  await import("../src/script-offline");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = "";
  document.documentElement.lang = "";
});

describe("jsDelivr の入口が配管の図の箱を開いた形を先に組む (#3753)", () => {
  it("script-entry-box-click-draws-without-route", async () => {
    const page = await openPage(block(AGGREGATOR), "script");
    const figure = document.querySelector(".dragon-figure") as Element;
    expect(foldCalls(figure), "aggregator の畳んだ箱").toEqual(["2"]);
    const atFigure = page.routeCalls();
    await runIdle(page);
    expect(page.routeCalls(), "最初の図を描いた後の空いた時間に、箱2を開いた形を先に組んだ時に道を探した回数").toBeGreaterThan(atFigure);
    const before = stepCount(figure);
    const routes = page.routeCalls();
    press(figure, "2");
    expect(stepCount(figure), "箱2を押しても開かない").toBeGreaterThan(before);
    expect(page.routeCalls() - routes, "先に組んだ後に箱2を押して開いた時に道を探した回数").toBe(0);
  });

  it("script-entry-draws-first-figure-before-ahead", async () => {
    const page = await openPage(block(AGGREGATOR), "script");
    const atFigure = page.routeCalls();
    // 入口が先に組む部品を読み終えて空いた時間に仕事を預けるまで待ち、預けた仕事は回さない
    for (let waited = 0; page.queued.length === 0 && waited < 1000; waited += 10) await pause(10);
    expect(page.routeCalls(), "空いた時間を待たずに、箱を開いた形を組んだ").toBe(atFigure);
    // 畳んだ形だけを組む回数を、覚えの無い module で数える
    vi.resetModules();
    await import("../src/kind-use/pipe");
    const { Router } = await import("../src/pipe-route");
    const route = vi.spyOn(Router.prototype, "route");
    const { renderDiagram } = await import("../src/core");
    const { parseNotation } = await import("../src/parser");
    const parsed = parseNotation(AGGREGATOR, { lang: "ja" });
    expect(parsed.ok, "aggregator の記法を読めない").toBe(true);
    renderDiagram((parsed as unknown as { diagram: unknown }).diagram, { lang: "ja" });
    expect(atFigure, "最初の図を描いた時に道を探した回数が、畳んだ形を組む回数と違う").toBe(route.mock.calls.length);
  });

  it("ahead-skips-multi-open-forms", async () => {
    const page = await openPage(block(TWO_FOLDS), "script");
    const figure = document.querySelector(".dragon-figure") as Element;
    const calls = foldCalls(figure);
    expect(calls, "見本の畳んだ箱の数").toHaveLength(2);
    await runIdle(page);
    const [first, second] = calls as [string, string];
    let routes = page.routeCalls();
    press(figure, first);
    expect(page.routeCalls() - routes, "先に組んだ後に1つ目の箱を押して開いた時に道を探した回数").toBe(0);
    routes = page.routeCalls();
    press(figure, second);
    expect(page.routeCalls() - routes, "2つの箱を開いた組を先に組んでいた (2つ目の箱を押した時に道を探さない)").toBeGreaterThan(0);
  });

  it("ahead-keeps-each-notation-layout", async () => {
    const page = await openPage(`${block(ONE_FOLD)}${block(RENAMED)}`, "script");
    await runIdle(page);
    const [original, renamed] = [...document.querySelectorAll(".dragon-figure")] as [Element, Element];
    const [call] = foldCalls(renamed) as [string];
    press(renamed, call);
    const renamedSvg = renamed.querySelector("svg")?.outerHTML ?? "";
    expect(renamedSvg, "名前を替えた図の箱を開いた図に、替えた名前が無い").toContain("Vault");
    expect(renamedSvg, "名前を替えた図の箱を開いた図を、もう片方の図の並べ方で描いた").not.toContain("Aggregator");
    press(original, call);
    const originalSvg = original.querySelector("svg")?.outerHTML ?? "";
    expect(originalSvg, "元の図の箱を開いた図に、元の名前が無い").toContain("Aggregator");
    expect(originalSvg, "元の図の箱を開いた図を、名前を替えた図の並べ方で描いた").not.toContain("Vault");
  });

  it("embed-page-does-not-compose-ahead", async () => {
    const page = await openPage(block(ONE_FOLD), "script-offline");
    await runIdle(page);
    expect(page.scheduled(), "埋めた頁の入口が空いた時間に仕事を預けた").toBe(0);
    const figure = document.querySelector(".dragon-figure") as Element;
    const [call] = foldCalls(figure) as [string];
    const routes = page.routeCalls();
    press(figure, call);
    expect(page.routeCalls() - routes, "埋めた頁で箱を押した時に、その場で組まずに先に組んだ並べ方で描いた").toBeGreaterThan(0);
  });
});
