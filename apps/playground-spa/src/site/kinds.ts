/**
 * 図の種類の描く部品を後から読む塊 (#3248)。
 *
 * git、lineup、state、time、tree の部品は種類ごとの塊にし、最初の画面を描いた後に裏で読み始める (`main.tsx`)。
 * 読み込みの状態は見本の塊と同じ形で持ち (`later.ts`)、読めなかった時は失敗のまま持つ。
 * 時系列図と構成図の部品は最初に読む script に在るので、待たずに描ける。
 */
import { LATER_KINDS, loadKind } from "@cardenelabs/dragon/light";

import { type Later, type LaterChunk, laterChunk, useLater } from "./later";

const CHUNKS = new Map(LATER_KINDS.map((kind): [string, LaterChunk<void>] => [kind, laterChunk(() => loadKind(kind))]));

/** 裏で読む塊の全部 */
export const KIND_CHUNKS: readonly LaterChunk<void>[] = [...CHUNKS.values()];

const READY: Later<void> = { status: "ready", value: undefined };
/** 初めから持つ種類の状態。読むものが無いので状態は替わらない */
const KEPT: LaterChunk<void> = { start: () => undefined, state: () => READY, subscribe: () => () => undefined };

/** 種類の部品の今の状態。読み始めていなければ読み始める */
export const useKind = (kind: string | undefined): Later<void> => useLater((kind !== undefined && CHUNKS.get(kind)) || KEPT);

/** 種類の塊を読めなかったか */
export const kindFailed = (kind: string | undefined): boolean => kind !== undefined && CHUNKS.get(kind)?.state().status === "failed";

/** どれかの塊が届くか読めなかった時に呼ぶ。編集画面は書いてある中身を読み直す。返す関数で外す */
export function onKindSettled(listener: () => void): () => void {
  const leave = KIND_CHUNKS.map((chunk) => chunk.subscribe(listener));
  return () => {
    for (const off of leave) off();
  };
}
