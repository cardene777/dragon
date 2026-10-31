/**
 * dragon の軽い入口 (`@cardenelabs/dragon/light`、#3248)。
 *
 * 既定の入口と同じ部品を出すが、git、lineup、state、time、tree の描く部品を持たず、`loadKind` を待った時に読む。
 * 読んだ後は既定の入口と同じ関数で、待たずに同じ図を描く。読んでいない種類を描くと、その種類の名前を含む誤りで止まる。
 * 最初に読む量を抑えたい頁を束ねる時に使い、この入口と既定の入口を 1 つの頁で混ぜない (混ぜると全ての部品が頁に入る)。
 */
import { kindLoaded, LATER_KINDS, type LaterKind, type LaterKinds, registerKind } from "./kinds/registry";

export * from "./api";
export { kindLoaded, LATER_KINDS, type LaterKind };

const LOADERS: { [K in LaterKind]: () => Promise<LaterKinds[K]> } = {
  git: () => import("./kinds/git"),
  lineup: () => import("./kinds/lineup"),
  state: () => import("./kinds/state"),
  time: () => import("./kinds/time"),
  tree: () => import("./kinds/tree"),
};

const isLater = (kind: string | undefined): kind is LaterKind => (LATER_KINDS as readonly (string | undefined)[]).includes(kind);

/** 種類の描く部品を読む。時系列図と構成図は初めから持つので何もしない。読み込みが落ちると拒否され、次に呼ぶと読み直す */
export async function loadKind(kind: string | undefined): Promise<void> {
  if (!isLater(kind) || kindLoaded(kind)) return;
  await register(kind);
}

async function register<K extends LaterKind>(kind: K): Promise<void> {
  registerKind(kind, await LOADERS[kind]());
}
