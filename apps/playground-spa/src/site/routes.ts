/**
 * サイトの経路 (#3030)。
 *
 * 0.35.0 より前のサイトと同じ経路で 7 画面を出し分ける。帯の行き先は `history.pushState` で移り、頁を読み直さない。
 * GitHub Pages は表に無い path に `404.html` (この頁の写し、`scripts/copy-404.mjs`) を返すので、
 * どの経路で直に開いても同じ script が経路を読む。
 */
import { type MouseEvent, useSyncExternalStore } from "react";

import { fromHash } from "../share";

export type Screen = "home" | "catalog" | "category" | "editor" | "docs" | "release-notes" | "not-found";

export interface Route {
  screen: Screen;
  /** カタログの分類の頁が出す分類の名前 */
  category?: string;
}

/** 頁の置き場。build では `/dragon/`、開発 server では `/` */
const BASE = import.meta.env.BASE_URL;

/** 帯の行き先になる画面と、その経路 */
export const PATHS = {
  home: BASE,
  catalog: `${BASE}catalog`,
  editor: `${BASE}editor`,
  docs: `${BASE}docs`,
  "release-notes": `${BASE}release-notes`,
} as const;

/** 帯と概要の最後の呼びかけが外へ向ける行き先 */
export const REPO = "https://github.com/cardene777/dragon";

/** 1 段の経路で開く画面 */
const SINGLE: Readonly<Record<string, Screen>> = { catalog: "catalog", editor: "editor", docs: "docs", "release-notes": "release-notes" };

/** path を画面にする。末尾の `/` は読まず、表に無い path は見つからない頁にする */
export function routeOf(pathname: string): Route {
  if (`${pathname}/` === BASE) return { screen: "home" };
  if (!pathname.startsWith(BASE)) return { screen: "not-found" };
  const parts = pathname.slice(BASE.length).split("/").filter(Boolean);
  const [head, second] = parts;
  if (head === undefined) return { screen: "home" };
  if (head === "catalog" && second !== undefined && parts.length === 2) return { screen: "category", category: decodeURIComponent(second) };
  const screen = SINGLE[head];
  return screen !== undefined && parts.length === 1 ? { screen } : { screen: "not-found" };
}

/**
 * 前に共有した URL (`/dragon/#n=...`) を編集画面へ寄せる。
 *
 * 0.35.1 までの見本帳は書く欄と図の 1 頁で、書いた記法を頁の置き場の `#` の後ろに入れて共有していた (#2995)。
 * 今は頁の置き場が概要なので、`#` の後ろに記法がある時だけ編集画面の経路に書き換える。
 */
export function redirectSharedLink(): void {
  if (routeOf(location.pathname).screen === "home" && fromHash(location.hash) !== undefined) {
    history.replaceState(null, "", `${PATHS.editor}${location.search}${location.hash}`);
  }
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  addEventListener("popstate", listener);
  return () => {
    listeners.delete(listener);
    removeEventListener("popstate", listener);
  };
}

/** 今の path。帯で移った時と、browser の戻る操作で替わる */
export function usePath(): string {
  return useSyncExternalStore(subscribe, () => location.pathname);
}

/**
 * 頁を読み直さずに `to` へ移り、頁の上へ戻す。
 *
 * `#` の後ろも運ぶ (#3033)。カタログの「編集画面で開く」は記法を `#` の後ろに載せ、編集画面は開いた時にそれを読む。
 * 今の画面と同じ path で `#` の後ろを持たない行き先は移らない。編集画面で帯の編集画面を押しても、書いた記法の共有の URL を消さない。
 */
export function navigate(to: string): void {
  const url = new URL(to, location.href);
  if (url.pathname !== location.pathname || (url.hash !== "" && url.hash !== location.hash)) {
    history.pushState(null, "", `${url.pathname}${url.hash}`);
    for (const listener of listeners) listener();
  }
  scrollTo(0, 0);
}

/**
 * 頁の中の行き先へ移る link の押し方。
 *
 * 新しいタブで開く押し方 (修飾キーと中の釦) は browser に任せ、それ以外は頁を読み直さずに移る。
 */
export function follow(event: MouseEvent<HTMLAnchorElement>, then?: () => void): void {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  navigate(event.currentTarget.href);
  then?.();
}
