/**
 * 頁を読む待ちに上限を付ける部品と、上限の値 (#3843)。
 *
 * 頁を開いて押して待つ仕事は、検査のfileを読み込む段 (`at-load.ts`) で済ませる (#3815、#3816)。
 * 読み込む段には1件10秒の上限が掛からず、`page.evaluate`と文脈を閉じる仕事はPlaywrightの上限も持たないので、待ちごとにここの部品で切る。
 * 部品と上限の値はこのfileだけが持ち、検査のfileは写さずにここから読む。写しは`page-wait.test.ts`の検査が形で探して断る。
 */
import { isDeepStrictEqual } from "node:util";

import { atLoad, type Loaded } from "./at-load";

/** 頁の1つの操作 (開く、押す、待つ) の上限 (ms)。上限を書かない操作もこれで切る。元の件が1件10秒で切られていた幅に揃える */
export const ACTION_LIMIT_MS = 10_000;

/**
 * 1つの頁で済ませる仕事の上限 (ms) (#3816)。
 * 止まった頁が5分の実行の上限までほかの仕事を待たせないよう、頁ごとにここで切る
 */
export const PAGE_LIMIT_MS = 60_000;

/** `work`を`ms`ミリ秒で切る。切った時は`what`を挙げて落ちる */
export async function within<T>(work: Promise<T>, ms: number, what: string): Promise<T> {
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

/**
 * `read`を、`done`が通るか`timeout`ミリ秒が過ぎるまで50msごとに読み直し、最後に読んだ値を返す。
 * `expect.poll`は件の外で使えないので、読み込む段では`expect.poll`と同じ間と上限で待つだけにし、判定は件が持つ (#3816)。
 * 上限の前に落ちた読みは読み直し、上限を過ぎた後の読みが落ちた時は、`expect.poll`と同じくその理由で落ちる。`read`は値をそのまま返してもよい
 */
export async function readUntil<T>(read: () => T | Promise<T>, done: (value: T) => boolean, timeout: number): Promise<T> {
  const end = Date.now() + timeout;
  for (;;) {
    const last = Date.now() >= end;
    try {
      const value = await read();
      if (last || done(value)) return value;
    } catch (error) {
      if (last) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/** `read`を、`want`と同じ値になるか`timeout`ミリ秒が過ぎるまで読み直す。件は同じ値を`toEqual`で確かめる */
export const readUntilEqual = <T>(read: () => T | Promise<T>, want: unknown, timeout: number): Promise<T> => readUntil(read, (value) => isDeepStrictEqual(value, want), timeout);

/**
 * 頁で順に回す仕事を、1つずつ読み込む段の仕事 (`atLoad`) にする道具を作る。
 * 落ちた仕事より後の仕事は回さず、読んだ件は落ちた仕事の名前と理由で落ちる。
 * 件は前の仕事の結果を確かめてから次の仕事の結果を読むので、途中で落ちる件も落ちる前の様子を元の件と同じ順に確かめる
 */
export function inOrder(): <T>(name: string, work: () => T | Promise<T>) => Promise<Loaded<T>> {
  let failed: Loaded<never> | undefined;
  return async <T>(name: string, work: () => T | Promise<T>): Promise<Loaded<T>> => {
    if (failed) return failed;
    const loaded = await atLoad(name, work);
    try {
      loaded.get();
    } catch {
      failed = loaded as Loaded<never>;
    }
    return loaded;
  };
}
