/**
 * 頁を読む待ちに上限を付ける部品 (`page-wait.ts`) と、部品の写しを断る検査 (#3843)。
 *
 * #3815と#3816で頁を開いて待つ仕事を読み込む段へ移した時、待ちに上限を付ける部品と上限の値を検査のfileごとに写した。
 * 上限の値を直す時に直すfileを1つにするため、部品と上限の値は`page-wait.ts`だけが持ち、検査のfileはそこから読む。
 * 写しを断る検査は、件を持つ全てのfileを読み、`Promise.race`と`setTimeout`で切る関数と、期限まで50msごとに読み直す関数を名前に依らず形で探す。
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
/** 部品の置き場。まだ無い時もこのfileのほかの件を回すため、置き場を変数で渡して読めない時は無いと判定する */
const PAGE_WAIT = "./page-wait";
/** 件を持つfileを集める道具と、写しを探す道具の置き場 */
const CASE_WORK = "./case-work";

interface Loaded<T> {
  get: () => T;
}
interface PageWait {
  ACTION_LIMIT_MS: number;
  PAGE_LIMIT_MS: number;
  within: <T>(work: Promise<T>, ms: number, what: string) => Promise<T>;
  readUntil: <T>(read: () => T | Promise<T>, done: (value: T) => boolean, timeout: number) => Promise<T>;
  readUntilEqual: <T>(read: () => T | Promise<T>, want: unknown, timeout: number) => Promise<T>;
  inOrder: () => <T>(name: string, work: () => T | Promise<T>) => Promise<Loaded<T>>;
}
interface CaseWork {
  caseFiles: (root: string) => string[];
  /** fileの字から、待ちに上限を付ける部品の写しを`file > 関数の名前: 形`の形で全て返す (#3843) */
  waitCopiesIn?: (source: string, fileName: string) => string[];
}

const load = async <T>(path: string): Promise<T | undefined> => (await import(/* @vite-ignore */ path).catch(() => undefined)) as T | undefined;
const WAIT = await load<PageWait>(PAGE_WAIT);
const WORK = await load<CaseWork>(CASE_WORK);

/** 部品を読む。無い時は件を判定の文で落とす */
function pageWait(): PageWait {
  expect(WAIT?.within, "頁を読む待ちの部品 (packages/dragon/test/page-wait.ts) が無い").toBeTypeOf("function");
  return WAIT as PageWait;
}

/** 写しを探す道具を読む。無い時は件を判定の文で落とす */
function copiesIn(): (source: string, fileName: string) => string[] {
  expect(WORK?.waitCopiesIn, "待ちの部品の写しを探す道具 (packages/dragon/test/case-work.ts の waitCopiesIn) が無い").toBeTypeOf("function");
  return WORK?.waitCopiesIn ?? (() => []);
}

/**
 * repoの件を持つ全てのfileに在る、待ちの部品の写し。字を構文で読むのは重いので、読む段で1度だけ読む。
 * `setTimeout`を書かないfileは写しを持てないので、構文で読まない。道具が無い時はundefined
 */
const ANY_COPY = (() => {
  const find = WORK?.waitCopiesIn;
  if (WORK === undefined || find === undefined) return undefined;
  try {
    const files = WORK.caseFiles(ROOT);
    const found = files.flatMap((file) => {
      const source = readFileSync(join(ROOT, file), "utf8");
      return source.includes("setTimeout") ? find(source, file) : [];
    });
    return { files, found, error: undefined };
  } catch (error) {
    return { files: [], found: [], error: error instanceof Error ? error.message : String(error) };
  }
})();

describe("頁を読む待ちの部品 (#3843)", () => {
  it("page-wait-no-copy-in-any-case-file", () => {
    // 件を持つ全てのfileは、待ちに上限を付ける部品を写さずにpage-wait.tsから読む
    copiesIn();
    if (ANY_COPY === undefined) return;
    expect(ANY_COPY.error, "件を持つfileを読む途中で落ちた").toBeUndefined();
    expect(ANY_COPY.files.length, "件を持つfileを1つも読んでいない").toBeGreaterThan(0);
    expect(ANY_COPY.found, "page-wait.tsの外に在る待ちの部品の写し").toEqual([]);
  });

  it("page-wait-copy-check-refuses-timeout-copy", () => {
    // Promise.raceとsetTimeoutで切る関数は、名前を替えても写しと挙げる
    const find = copiesIn();
    const planted = [
      'import { it } from "vitest";',
      "async function bounded<T>(work: Promise<T>, timeout: number, what: string): Promise<T> {",
      "  let timer: ReturnType<typeof setTimeout> | undefined;",
      "  try {",
      "    return await Promise.race([work, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(what)), timeout); })]);",
      "  } finally {",
      "    clearTimeout(timer);",
      "  }",
      "}",
      "const cut = <T>(work: Promise<T>, ms: number): Promise<T> => Promise.race([work, new Promise<T>((_, no) => setTimeout(no, ms))]);",
      'it("planted", async () => { await bounded(cut(Promise.resolve(1), 10), 10, "見本"); });',
    ].join("\n");
    expect(find(planted, "planted.test.ts"), "Promise.raceとsetTimeoutで切る関数の挙げ方").toEqual([
      "planted.test.ts > bounded: Promise.raceとsetTimeoutで切る",
      "planted.test.ts > cut: Promise.raceとsetTimeoutで切る",
    ]);
  });

  it("page-wait-copy-check-refuses-poll-copy", () => {
    // 期限まで50msごとに読み直す関数は、名前を替えても写しと挙げる
    const find = copiesIn();
    const planted = [
      'import { it } from "vitest";',
      "async function pollFor<T>(read: () => T | Promise<T>, done: (value: T) => boolean, timeout: number): Promise<T> {",
      "  const end = Date.now() + timeout;",
      "  for (;;) {",
      "    const value = await read();",
      "    if (done(value) || Date.now() >= end) return value;",
      "    await new Promise((resolve) => setTimeout(resolve, 50));",
      "  }",
      "}",
      "const polled = async <T>(read: () => Promise<T>, timeout: number): Promise<T | undefined> => {",
      "  const end = Date.now() + timeout;",
      "  let last: T | undefined;",
      "  while (Date.now() < end) {",
      "    last = await read();",
      "    await new Promise((wake) => setTimeout(wake, 50));",
      "  }",
      "  return last;",
      "};",
      'it("planted", async () => { await pollFor(() => 1, (v) => v === 1, 100); await polled(async () => 1, 100); });',
    ].join("\n");
    expect(find(planted, "planted.test.ts"), "期限まで50msごとに読み直す関数の挙げ方").toEqual([
      "planted.test.ts > pollFor: 期限まで50msごとに読み直す",
      "planted.test.ts > polled: 期限まで50msごとに読み直す",
    ]);
  });

  it("page-wait-copy-check-allows-other-shapes", () => {
    // page-wait.tsから読んだ部品の呼び出しと、名前が同じで形の違う関数は写しと挙げない
    const find = copiesIn();
    const planted = [
      'import { it, expect } from "vitest";',
      'import { ACTION_LIMIT_MS, readUntil, within } from "./page-wait";',
      "interface Rect { x: number; w: number }",
      "const inside = (inner: Rect, outer: Rect): boolean => inner.x >= outer.x && inner.x + inner.w <= outer.x + outer.w;",
      "const polled = <T>(value: T, message: string) => expect(value, message);",
      "const first = <T>(a: Promise<T>, b: Promise<T>): Promise<T> => Promise.race([a, b]);",
      "async function settle(): Promise<void> {",
      "  for (let i = 0; i < 10; i++) await new Promise((done) => setTimeout(done, 10));",
      "}",
      "async function pause(): Promise<void> {",
      "  await new Promise((resolve) => setTimeout(resolve, 50));",
      "}",
      'it("planted", async () => {',
      '  await within(Promise.resolve(1), ACTION_LIMIT_MS, "見本");',
      "  await readUntil(() => 1, (v) => v === 1, 100);",
      "  polled(inside({ x: 1, w: 1 }, { x: 0, w: 3 }), \"内に在る\").toBe(true);",
      "  await first(Promise.resolve(1), Promise.resolve(2));",
      "  await settle();",
      "  await pause();",
      "});",
    ].join("\n");
    expect(find(planted, "planted.test.ts"), "写しでない呼び出しと関数を写しと挙げた").toEqual([]);
  });

  it("page-wait-within-returns-value", async () => {
    const { within } = pageWait();
    expect(await within(Promise.resolve(7), 1000, "済んだ仕事"), "上限までに済んだ仕事の値").toBe(7);
    const later = new Promise<string>((resolve) => setTimeout(() => resolve("後で済んだ"), 20));
    expect(await within(later, 1000, "後で済む仕事"), "上限の前に後から済んだ仕事の値").toBe("後で済んだ");
  });

  it("page-wait-within-refuses-late-work", async () => {
    const { within } = pageWait();
    const never = new Promise<never>(() => undefined);
    await expect(within(never, 30, "遅い仕事"), "上限までに済まない仕事の落ち方").rejects.toThrow("遅い仕事が 30ms で終わらない");
  });

  it("page-wait-read-until-returns-done-or-last", async () => {
    const { readUntil } = pageWait();
    let n = 0;
    // 読む関数は値をそのまま返してもよく、上限の前に落ちた読みは読み直す
    const read = (): number => {
      n += 1;
      if (n === 1) throw new Error("まだ読めない");
      return n;
    };
    expect(await readUntil(read, (value) => value >= 3, 1000), "doneが通った値").toBe(3);
    let m = 0;
    const started = Date.now();
    const last = await readUntil(() => Promise.resolve((m += 1)), () => false, 120);
    expect(last, "上限を過ぎた後に最後に読んだ値").toBe(m);
    expect(Date.now() - started, "上限まで読み直した").toBeGreaterThanOrEqual(120);
  });

  it("page-wait-read-until-throws-last-error", async () => {
    const { readUntil } = pageWait();
    const read = (): Promise<number> => Promise.reject(new Error("読めない"));
    await expect(readUntil(read, () => true, 80), "上限を過ぎた後の読みが落ちた時の落ち方").rejects.toThrow("読めない");
  });

  it("page-wait-read-until-equal-returns-same-value", async () => {
    const { readUntilEqual } = pageWait();
    let n = 0;
    const read = (): Promise<{ step: number }> => Promise.resolve({ step: (n += 1) });
    expect(await readUntilEqual(read, { step: 3 }, 1000), "求める値と同じになった値").toEqual({ step: 3 });
  });

  it("page-wait-in-order-stops-after-failure", async () => {
    const { inOrder } = pageWait();
    const step = inOrder();
    let ranAfter = false;
    const one = await step("一つ目", () => 1);
    const two = await step("二つ目", (): number => {
      throw new Error("壊れた");
    });
    const three = await step("三つ目", () => {
      ranAfter = true;
      return 3;
    });
    expect(one.get(), "落ちる前の仕事の結果").toBe(1);
    expect(() => two.get(), "落ちた仕事の落ち方").toThrow("二つ目");
    expect(() => three.get(), "落ちた仕事より後の仕事の落ち方").toThrow("壊れた");
    expect(() => three.get(), "落ちた仕事より後の仕事は落ちた仕事の名前で落ちる").toThrow("二つ目");
    expect(ranAfter, "落ちた仕事より後の仕事を回した").toBe(false);
  });

  it("page-wait-limits-keep-values", () => {
    const { ACTION_LIMIT_MS, PAGE_LIMIT_MS } = pageWait();
    expect(ACTION_LIMIT_MS, "頁の1つの操作の上限 (ms)").toBe(10_000);
    expect(PAGE_LIMIT_MS, "1つの頁の仕事の上限 (ms)").toBe(60_000);
  });
});
