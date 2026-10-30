/**
 * 頁が動いてから読む塊 (#3246)。
 *
 * 見本と部品の図の記法は最初に読む script に入れず、塊ごとに 1 つの script にして後から読む。
 * 塊は最初の画面を描いた後に裏で読み始め (`startWhenIdle`)、まだ読み始めていない塊は描く部品が使う時に読み始める。
 * 読み込みは塊ごとに 1 度だけで、届いた中身は頁を移っても持ち続ける。
 * 読めなかった時は失敗のまま持ち、勝手に読み直さない。編集画面は書いた記法を残さないので、頁を読み直すのは人が釦を押した時だけにする。
 */
import { useSyncExternalStore } from "react";

export type Later<T> = { status: "loading" } | { status: "ready"; value: T } | { status: "failed" };

export interface LaterChunk<T> {
  /** 読み込みを始める。2 度目からは何もしない */
  start: () => void;
  /** 今の状態。同じ状態の間は同じ物を返す */
  state: () => Later<T>;
  /** 状態が替わった時に呼ぶ。登録すると読み込みを始める */
  subscribe: (listener: () => void) => () => void;
}

export function laterChunk<T>(load: () => Promise<T>): LaterChunk<T> {
  let state: Later<T> = { status: "loading" };
  let started = false;
  const listeners = new Set<() => void>();
  const settle = (next: Later<T>): void => {
    state = next;
    for (const listener of listeners) listener();
  };
  const start = (): void => {
    if (started) return;
    started = true;
    load().then(
      (value) => settle({ status: "ready", value }),
      () => settle({ status: "failed" }),
    );
  };
  return {
    start,
    state: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      start();
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** 塊の今の状態。読んだ部品は、塊が届くか読めなかった時に描き直す */
export function useLater<T>(chunk: LaterChunk<T>): Later<T> {
  return useSyncExternalStore(chunk.subscribe, chunk.state);
}

/** 最初の画面を描いた後、手が空いた時に塊を読み始める。手が空いたかを知らせない browser では少し待ってから始める */
export function startWhenIdle(chunks: readonly Pick<LaterChunk<unknown>, "start">[]): void {
  const run = (): void => {
    for (const chunk of chunks) chunk.start();
  };
  if (typeof requestIdleCallback === "function") requestIdleCallback(run, { timeout: 2_000 });
  else setTimeout(run, 200);
}
