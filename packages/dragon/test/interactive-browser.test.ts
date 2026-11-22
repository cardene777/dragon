/**
 * 読み手が値を入れて動かせる図を、実際の Chromium で触る (#3337)。
 *
 * 試す図を HTML に書き出し、`http://localhost/` に置いた頁で開く。
 * 幅 390px の枠では、線の上に置いた釦も入力の帯へ移り、全ての操作が幅に収まって縦横 44px 以上の大きさを持つ。
 * 送る、作る、書き換えるを押す間、保存の道具 (`localStorage`、`sessionStorage`) を使わず、頁の外への通信をしない。
 * jsdom は配置を測れず通信も持たないので、この 2 つはここで確かめる。
 *
 * 件の中で頁を開いて触ると、混んだ機械で 1 件 10 秒の上限を超えた (#3816)。
 * 書き出しと、頁を開いて触り測る仕事は file を読み込む段 (`at-load.ts`) で済ませ、件は測った値を元の件と同じ順で確かめる。
 */
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "playwright-core";
import { describe, expect, it } from "vitest";
import { atLoad, type Loaded } from "./at-load";
import { exporter } from "./export-support";
import { LOOK } from "../src/look/values";
import { fileChromium } from "./page-needs";
import { labeledAskTry, parsedTry, SMALL_PARTS, smallTry, WIDE_ASK_LONGEST, wideAskTry } from "./try-support";


const PAGE = "http://localhost/";

/** 頁の 1 つの操作 (開く、押す、待つ) の上限 (ms)。上限を書かない操作もこれで切る。元の件が 1 件 10 秒で切られていた幅に揃える */
const ACTION_LIMIT_MS = 10_000;
/**
 * 1 つの頁で済ませる仕事の上限 (ms) (#3816)。
 * 読み込む段には 1 件の上限が掛からず、`page.evaluate` と文脈を閉じる仕事は Playwright の上限も持たない。
 * 止まった頁が 5 分の実行の上限までほかの仕事を待たせないよう、頁ごとにここで切る
 */
const PAGE_LIMIT_MS = 60_000;

/** `work` を `ms` ミリ秒で切る。切った時は `what` を挙げて落ちる */
async function within<T>(work: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${what}が ${ms}ms で終わらない`)), ms);
  });
  try {
    return await Promise.race([work, limit]);
  } finally {
    clearTimeout(timer);
  }
}

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
  const context = await within((await fileChromium()).newContext({ viewport: { width, height: 1600 }, hasTouch: true }), ACTION_LIMIT_MS, "頁の文脈を作る");
  // 上限を書かない押す、待つ、開く操作も、Playwright の既定の 30 秒ではなく 1 つの操作の上限で切る
  context.setDefaultTimeout(ACTION_LIMIT_MS);
  const openAndRun = async (): Promise<Opened<T>> => {
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
      .waitFor({ state: "attached", timeout: ACTION_LIMIT_MS });
    const result = await run(page);
    // 読んだ時の URL を残す。後から届く通信は元の件も数えなかった
    return { result, outside: [...outside] };
  };
  try {
    return await within(openAndRun(), PAGE_LIMIT_MS, "試す図の頁の仕事");
  } finally {
    // 測った値は手元に在るので、閉じるのが上限で終わらなくても落とさない。閉じ損ねた頁は file の process の終わりに Playwright が Chromium ごと止める
    await within(context.close(), ACTION_LIMIT_MS, "頁の文脈を閉じる").catch(() => undefined);
  }
}

/** 入力の帯の欄に打ち込んで送る */
async function sendOn(page: Page, values: Record<string, string>): Promise<void> {
  for (const [field, value] of Object.entries(values))
    await page.locator(`form[data-dragon="ask"] input[data-field="${field}"]`).fill(value);
  await page.locator('button[data-dragon="send"]').click();
}

// 書き出しと頁で触るのを 1 件で済ませると、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。書き出しは file を読み込む段で済ませる。
// 頁を開いて触る仕事も件の中で 1 件の上限を超えた (#3816)。頁の仕事も読み込む段で件ごと (同じ頁を測る件は組ごと) に済ませ、落ちた仕事はそれを読む件だけを落とす
const ON_LINE_HTML = await atLoad("作る釦を機械の列の上に置いた図を HTML に書き出す", () => htmlOf(onLine()));
const SMALL_HTML = await atLoad("小さな試す図を HTML に書き出す", () => htmlOf(parsedTry(smallTry())));
const WIDE_HTML = await atLoad("欄が 6 つで長い候補を持つ試す図を HTML に書き出す", () => htmlOf(parsedTry(wideAskTry())));
const LABELED_HTML = await atLoad("名前の長い 7 つの欄を持つ試す図を HTML に書き出す", () => htmlOf(parsedTry(labeledAskTry())));

const FIT_390 = await atLoad("幅 390px の頁で、作る釦を線の上に置いた図の操作の大きさと位置を測る", () =>
  withPage(ON_LINE_HTML.get(), 390, (page) =>
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
  ),
);

/** 図の枠と段の説明の帯と入力の帯の上下 */
interface CaptionBoxes {
  frame: { top: number; bottom: number } | undefined;
  bar: { top: number; bottom: number } | undefined;
  tools: { top: number; bottom: number } | undefined;
}

/** 段の説明と入力の帯の上下を測る枠の幅 */
const CAPTION_WIDTHS = [390, 1280] as const;

// 幅ごとに頁を開き、1 つの幅の頁が落ちても、件はほかの幅の値を元の件と同じ順に確かめる
const CAPTIONS = await atLoad("幅 390px と 1280px の頁で、段の説明の帯と入力の帯の上下を測る", async () => {
  const html = ON_LINE_HTML.get();
  const byWidth: Partial<Record<number, Loaded<Opened<CaptionBoxes>>>> = {};
  for (const width of CAPTION_WIDTHS)
    byWidth[width] = await atLoad(`幅 ${width}px の頁で段の説明の帯と入力の帯の上下を測る`, () =>
      withPage(html, width, (page) =>
        page.evaluate(() => {
          const box = (selector: string): { top: number; bottom: number } | undefined => {
            const el = document.querySelector<HTMLElement>(`[data-dragon="player"] > ${selector}`);
            if (!el) return undefined;
            const rect = el.getBoundingClientRect();
            return { top: rect.top, bottom: rect.bottom };
          };
          return { frame: box(".dg-frame"), bar: box(".dg-bar"), tools: box(".dg-try") };
        }),
      ),
    );
  return byWidth;
});

const NO_STORAGE = await atLoad("送る、作る、書き換えるを押し、保存の道具と通信の道具を呼んだ回数を数える", () =>
  withPage(SMALL_HTML.get(), 1024, async (page) => {
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
  }),
);

describe("試す図を Chromium で触る (#3337)", () => {
  it(
    "interactive-controls-fit-390-at-44px",
    () => {
      const { result } = FIT_390.get();
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

  // 段の説明は読み手が押した後に図で何が変わったかを書くため、図の枠のすぐ下に置き、入力の帯はその下に置く (#3437)。
  // 狭い枠では帯が縦に組み替わり、広い枠では横に並ぶので、両方の幅で上下の順と重なりを測る
  it(
    "interactive-caption-above-controls",
    () => {
      const captions = CAPTIONS.get();
      for (const width of CAPTION_WIDTHS) {
        const { result } = captions[width]!.get();
        const { frame, bar, tools } = result;
        expect(frame && bar && tools, `幅 ${width}px で図の枠か段の説明の帯か入力の帯が無い`).toBeTruthy();
        if (!frame || !bar || !tools) continue;
        expect(bar.bottom - bar.top, `幅 ${width}px で段の説明の帯の高さが無い`).toBeGreaterThan(0);
        expect(bar.top, `幅 ${width}px で段の説明の帯が図の枠と重なるか、図の枠より上に在る`).toBeGreaterThanOrEqual(frame.bottom);
        expect(tools.top, `幅 ${width}px で入力の帯が段の説明の帯と重なるか、段の説明の帯より上に在る`).toBeGreaterThanOrEqual(bar.bottom);
      }
    },
  );

  it(
    "interactive-uses-no-storage-or-network",
    () => {
      const { result, outside } = NO_STORAGE.get();
      expect(result.linked, "書き換えまで押せていない (食い違いの印が出ない)").toBe(true);
      expect(result.calls, "保存の道具か通信の道具を呼んだ").toEqual([]);
      expect(result.local, "localStorage に値が残る").toBe(0);
      expect(result.session, "sessionStorage に値が残る").toBe(0);
      expect(outside, "頁の外へ通信した").toEqual([]);
    },
  );
});

/** 入力の帯の欄と釦の並び。欄ごとの名前と下端と右端と幅と、選ぶ欄なら幅を縮めない時の幅 (`need`) を持つ。帯は欄と釦の下端を揃えて並べるので、同じ行の欄と釦は下端が同じ */
interface StripBox {
  row: { left: number; right: number };
  fields: { name: string; bottom: number; right: number; width: number; need?: number; least: string }[];
  send: { bottom: number; right: number } | undefined;
}

/**
 * 次に描く時まで待つ。枠の幅を変えると、入力の帯は行の大きさを見張る `ResizeObserver` で次の行へ送った欄に印を付ける (#3492)。
 * ブラウザは見張りの知らせを描く前に届けるので、読者は印を付ける前の欄を見ない。幅を変えた直後に測ると知らせより先に測る回があり、
 * 2 回目の `requestAnimationFrame` まで待てば、1 回目の後に届く知らせを済ませた、読者が見る形を測れる
 */
async function nextPaint(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
}

/** 試す図を書き出した HTML `html` を幅 740 の枠で開き、入力の帯の欄と釦の並びを測る。`pick` の欄と値を先に選ぶ */
async function stripAt740(html: string, pick: Record<string, string> = {}): Promise<StripBox> {
  const { result } = await withPage(html, 1280, async (page) => {
    // bitsumi の広い頁と同じく、図の枠の幅を 740 にする
    await page.addStyleTag({ content: '[data-dragon="player"]{width:740px;max-width:740px}' });
    for (const [field, value] of Object.entries(pick))
      await page.locator(`form[data-dragon="ask"] select[data-field="${field}"]`).selectOption(value);
    await nextPaint(page);
    return page.evaluate(() => {
      const form = document.querySelector<HTMLFormElement>('form[data-dragon="ask"]');
      const row = form?.querySelector<HTMLElement>(".dg-ask-row")?.getBoundingClientRect();
      const fields = [...(form?.querySelectorAll<HTMLElement>(".dg-field") ?? [])].map((field) => {
        const input = field.querySelector<HTMLElement>("[data-field]");
        const box = field.getBoundingClientRect();
        let need: number | undefined;
        if (input instanceof HTMLSelectElement) {
          // 同じ選ぶ欄を幅を決めずに置くと、Chromium は一番長い候補の字と余白と矢印が収まる幅で描く
          const holder = document.createElement("div");
          holder.style.cssText = "position:absolute;left:0;top:0;width:max-content;visibility:hidden";
          const copy = input.cloneNode(true) as HTMLSelectElement;
          copy.style.width = "auto";
          holder.append(copy);
          form?.append(holder);
          need = copy.getBoundingClientRect().width;
          holder.remove();
        }
        return {
          name: input?.dataset.field ?? "",
          bottom: Math.round(box.bottom),
          right: box.right,
          width: box.width,
          need,
          least: field.style.getPropertyValue("--dg-field-min"),
        };
      });
      const send = form?.querySelector<HTMLElement>('button[data-dragon="send"]')?.getBoundingClientRect();
      return {
        row: { left: row?.left ?? 0, right: row?.right ?? 0 },
        fields,
        send: send ? { bottom: Math.round(send.bottom), right: send.right } : undefined,
      };
    });
  });
  return result;
}

/** 選ぶ欄の矢印の位置。矢印の右端から縁までと、字の左端から縁までと、字を置ける所の右端 */
interface CaretInset {
  name: string;
  appearance: string;
  textGap: number;
  caretGap: number;
  caretLeft: number;
  textEnd: number;
}

/** 頁が svg に幅と高さを当てた時の、選ぶ欄の矢印の大きさと位置 */
interface CaretSize {
  name: string;
  width: number;
  height: number;
  textGap: number;
  caretGap: number;
}

// 同じ図を同じ形で置いて測る件の組は 1 つの頁を分け合う。欄の幅を選んだ値で測る 2 件と、選ばずに測る 2 件
const PICKED_STRIP = await atLoad("欄が 6 つの図を幅 740 の枠に置き、一番長い候補を選んで入力の帯を測る", () =>
  stripAt740(WIDE_HTML.get(), { 期限: WIDE_ASK_LONGEST }),
);
const WIDE_STRIP = await atLoad("欄が 6 つの図を幅 740 の枠に置き、入力の帯を測る", () => stripAt740(WIDE_HTML.get()));
const SHORT_STRIP = await atLoad("候補の短い 4 つの欄の図を幅 740 の枠に置き、入力の帯を測る", () => stripAt740(SMALL_HTML.get()));

const CARET_INSET = await atLoad("欄が 6 つの図を幅 740 の枠に置き、選ぶ欄の矢印の位置を測る", async () => {
  const { result } = await withPage(WIDE_HTML.get(), 1280, async (page) => {
    await page.addStyleTag({ content: '[data-dragon="player"]{width:740px;max-width:740px}' });
    await nextPaint(page);
    return page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('form[data-dragon="ask"] .dg-field')].flatMap((field): CaretInset[] => {
        const select = field.querySelector("select");
        if (!select) return [];
        const box = select.getBoundingClientRect();
        const style = getComputedStyle(select);
        const caret = field.querySelector(".dg-caret")?.getBoundingClientRect();
        return [
          {
            name: select.dataset.field ?? "",
            appearance: style.appearance,
            textGap: Number.parseFloat(style.borderLeftWidth) + Number.parseFloat(style.paddingLeft),
            caretGap: caret ? box.right - caret.right : Number.NaN,
            caretLeft: caret ? caret.left : Number.NaN,
            textEnd: box.right - Number.parseFloat(style.borderRightWidth) - Number.parseFloat(style.paddingRight),
          },
        ];
      }),
    );
  });
  return result;
});

const CARET_HOST_RULE = await atLoad("図の中の svg に幅と高さを当てる頁で、選ぶ欄の矢印の大きさを測る", async () => {
  const { result } = await withPage(WIDE_HTML.get(), 1280, async (page) => {
    await page.addStyleTag({
      content: [
        '[data-dragon="player"]{width:740px;max-width:740px}',
        'html body [data-dragon="player"] svg{display:block;width:auto;max-width:100%;height:auto;margin-inline:auto}',
      ].join("\n"),
    });
    await nextPaint(page);
    return page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('form[data-dragon="ask"] .dg-field')].flatMap((field): CaretSize[] => {
        const select = field.querySelector("select");
        if (!select) return [];
        const box = select.getBoundingClientRect();
        const style = getComputedStyle(select);
        const caret = field.querySelector(".dg-caret")?.getBoundingClientRect();
        return [
          {
            name: select.dataset.field ?? "",
            width: caret?.width ?? Number.NaN,
            height: caret?.height ?? Number.NaN,
            textGap: Number.parseFloat(style.borderLeftWidth) + Number.parseFloat(style.paddingLeft),
            caretGap: caret ? box.right - caret.right : Number.NaN,
          },
        ];
      }),
    );
  });
  return result;
});

const LABELS = await atLoad("名前の長い 7 つの欄の図を幅 740 の枠に置き、欄の名前の幅を測る", async () => {
  const { result } = await withPage(LABELED_HTML.get(), 1280, async (page) => {
    await page.addStyleTag({ content: '[data-dragon="player"]{width:740px;max-width:740px}' });
    await nextPaint(page);
    return page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('form[data-dragon="ask"] .dg-field')].map((field) => {
        const label = field.querySelector<HTMLElement>(".dg-fl");
        return {
          name: label?.textContent ?? "",
          bottom: Math.round(field.getBoundingClientRect().bottom),
          shown: label?.clientWidth ?? 0,
          full: label?.scrollWidth ?? 0,
        };
      }),
    );
  });
  return result;
});

// 入力の帯は欄を 1 行に並べて同じ基準の幅で縮めるので、欄が 6 つで長い候補を持つ図を広い枠に置くと、選んだ値の字が欄の幅で切れていた (#3485)。
// 選ぶ欄は一番長い候補が収まる幅より縮めず、1 行に入らない欄は次の行へ送る
describe("入力の帯の欄の幅 (#3485)", () => {
  it(
    "try-ask-choice-not-clipped",
    () => {
      const { fields } = PICKED_STRIP.get();
      const selects = fields.filter((field) => field.need !== undefined);
      expect(selects.map((field) => field.name), "選ぶ欄の数").toHaveLength(5);
      for (const field of selects)
        expect(
          field.width,
          `幅 740 の枠で、選ぶ欄 ${field.name} の幅 ${field.width} が、一番長い候補の字と余白と矢印が収まる幅 ${field.need} より狭く、選んだ値の字が切れる`,
        ).toBeGreaterThanOrEqual((field.need ?? 0) - 0.5);
    },
  );

  it(
    "try-ask-fields-wrap-in-strip",
    () => {
      const { row, fields, send } = WIDE_STRIP.get();
      expect(fields, "入力の帯の欄の数").toHaveLength(6);
      for (const field of fields)
        expect(field.right, `幅 740 の枠で、欄 ${field.name} の右端 ${field.right} が帯の右端 ${row.right} を超える`).toBeLessThanOrEqual(row.right + 0.5);
      expect(send && send.right <= row.right + 0.5, "幅 740 の枠で、送る釦が無いか帯の右端を超える").toBe(true);
      const rows = new Set(fields.map((field) => field.bottom));
      expect(rows.size, "幅 740 の枠で、1 行に入らない 6 つの欄を次の行へ送らず、縮めて 1 行に並べた").toBeGreaterThanOrEqual(2);
    },
  );

  // 次の行へ送った選ぶ欄は、その行に欄が少なくても伸ばさず、一番長い候補が収まる幅 (基準の幅より狭ければ基準の幅) に留める (#3485、#3492)
  it(
    "try-ask-wrapped-choice-not-stretched",
    () => {
      const { fields } = PICKED_STRIP.get();
      const first = Math.min(...fields.map((field) => field.bottom));
      const wrapped = fields.filter((field) => field.need !== undefined && field.bottom > first);
      expect(wrapped.map((field) => field.name), "幅 740 の枠で、次の行へ送った選ぶ欄が無い").not.toEqual([]);
      const base = LOOK.player.ask.field;
      for (const field of wrapped) {
        const least = Number.parseFloat(field.least);
        expect(Number.isFinite(least), `次の行へ送った選ぶ欄 ${field.name} が幅の下限 (--dg-field-min) を持たない`).toBe(true);
        // 次の行へ送った欄は伸ばさず、一番長い候補が収まる幅 (基準の幅より狭ければ基準の幅) に留める (#3492)
        const kept = Math.max(least, base);
        expect(Math.abs(field.width - kept), `幅 740 の枠で、次の行へ送った選ぶ欄 ${field.name} の幅 ${field.width} が、一番長い候補が収まる幅 ${kept} と違い、伸びている`).toBeLessThanOrEqual(0.5);
      }
    },
  );

  // 1 行目の欄は今どおり伸びて行を埋める。伸ばさないのは次の行へ送った欄だけ (#3492)
  it(
    "try-ask-first-row-fills",
    () => {
      const { row, fields } = WIDE_STRIP.get();
      const first = Math.min(...fields.map((field) => field.bottom));
      const right = Math.max(...fields.filter((field) => field.bottom === first).map((field) => field.right));
      expect(row.right - right, `幅 740 の枠で、1 行目の右端の欄の右端 ${right} が帯の右端 ${row.right} から 1px より離れ、1 行目の欄が行を埋めない`).toBeLessThanOrEqual(1);
    },
  );

  // 選ぶ欄の矢印はブラウザに描かせず、dragon が欄の中に描く。矢印の右端から欄の右の縁までを、字の左端から欄の左の縁までと揃え、矢印を字と重ねない (#3492)
  it(
    "try-ask-arrow-matches-inset",
    () => {
      const result = CARET_INSET.get();
      expect(result.map((field) => field.name), "選ぶ欄の数").toHaveLength(5);
      for (const field of result) {
        expect(field.appearance, `選ぶ欄 ${field.name} がブラウザの矢印を描く (appearance が none でない)`).toBe("none");
        expect(Number.isFinite(field.caretGap), `選ぶ欄 ${field.name} に dragon が描いた矢印 (.dg-caret) が無い`).toBe(true);
        expect(Math.abs(field.caretGap - field.textGap), `選ぶ欄 ${field.name} の矢印の右端から縁まで ${field.caretGap} が、字の左端から縁まで ${field.textGap} と揃わない`).toBeLessThanOrEqual(0.5);
        expect(field.caretLeft, `選ぶ欄 ${field.name} の矢印の左端 ${field.caretLeft} が、字を置ける所の右端 ${field.textEnd} より左に在り、字と重なる`).toBeGreaterThanOrEqual(field.textEnd - 0.5);
      }
    },
  );

  // 図を置いた頁が図の中の svg に幅と高さを当てても、選ぶ欄の矢印は膨らまず、字の左の余白と同じ間で右の縁から離れる (#3499)。
  // bitsumi の頁は `.article-body :is(.dragon-canvas, .dragon-step-still) svg` に同じ値を当て、0.66.1 の svg の矢印が幅 121、高さ 73 に膨らんだ
  it(
    "try-ask-caret-ignores-host-svg-rule",
    () => {
      const result = CARET_HOST_RULE.get();
      expect(result.map((field) => field.name), "選ぶ欄の数").toHaveLength(5);
      for (const field of result) {
        expect(field.width, `頁が svg に幅を当てた時、選ぶ欄 ${field.name} の矢印の幅 ${field.width} が 12px を超える`).toBeLessThanOrEqual(12);
        expect(field.height, `頁が svg に高さを当てた時、選ぶ欄 ${field.name} の矢印の高さ ${field.height} が 12px を超える`).toBeLessThanOrEqual(12);
        expect(Math.abs(field.caretGap - field.textGap), `頁が svg に幅を当てた時、選ぶ欄 ${field.name} の矢印の右端から縁まで ${field.caretGap} が、字の左端から縁まで ${field.textGap} と揃わない`).toBeLessThanOrEqual(0.5);
      }
    },
  );

  // 名前の長い欄を次の行へ送っても、欄の名前を「…」で切らない (#3492)
  it(
    "try-ask-label-not-clipped",
    () => {
      const result = LABELS.get();
      expect(result, "入力の帯の欄の数").toHaveLength(7);
      const first = Math.min(...result.map((field) => field.bottom));
      expect(result.some((field) => field.bottom > first), "幅 740 の枠で、名前の長い 7 つの欄が次の行へ送られていない").toBe(true);
      for (const field of result)
        expect(field.full, `幅 740 の枠で、欄の名前「${field.name}」の字の幅 ${field.full} が見える幅 ${field.shown} を超えて切れる`).toBeLessThanOrEqual(field.shown);
    },
  );

  it(
    "try-ask-short-fields-one-row",
    () => {
      const { fields, send } = SHORT_STRIP.get();
      expect(fields, "入力の帯の欄の数").toHaveLength(4);
      const rows = new Set([...fields.map((field) => field.bottom), send?.bottom]);
      expect(rows.size, "幅 740 の枠で、候補の短い 4 つの欄と送る釦が 1 行に並ばない").toBe(1);
    },
  );
});
