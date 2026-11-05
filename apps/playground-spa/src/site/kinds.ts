/**
 * 図の種類の描く部品を後から読む塊 (#3248、#3349)。
 *
 * git、lineup、pipe、state、time、tree、try の部品は種類ごとの塊にし、最初の画面を描いた後に裏で読み始める (`main.tsx`)。
 * 塊は種類の描く部品と、その種類の個別ブロックの読み方を全て読む (`loadKind`)。図を描く所と書く所は、記法を読む前に種類の塊を待つ。
 * 読み込みの状態は見本の塊と同じ形で持ち (`later.ts`)、読めなかった時は失敗のまま持つ。
 * 時系列図と構成図の部品は最初に読む script に在るので、待たずに描ける。
 */
import { LATER_KINDS, loadKind } from "@cardenelabs/dragon/light";

import { useSyncExternalStore } from "react";

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

/** 種類の塊が届いたか。初めから持つ種類 (時系列図と構成図) と、種類の読めない図は届いている */
export function kindReady(kind: string | undefined): boolean {
  const chunk = kind === undefined ? undefined : CHUNKS.get(kind);
  return chunk === undefined || chunk.state().status === "ready";
}

const LOADING: Later<void> = { status: "loading" };
const FAILED: Later<void> = { status: "failed" };
/** 全ての種類の塊の状態。どれかが読めなければ失敗、全てが届けば届いた、ほかは読み込み中 */
const allKinds = (): Later<void> => {
  const states = KIND_CHUNKS.map((chunk) => chunk.state().status);
  return states.includes("failed") ? FAILED : states.every((status) => status === "ready") ? READY : LOADING;
};

/** どれかの塊が届くか読めなかった時に呼ぶ。編集画面は書いてある中身を読み直す。返す関数で外す */
export function onKindSettled(listener: () => void): () => void {
  const leave = KIND_CHUNKS.map((chunk) => chunk.subscribe(listener));
  return () => {
    for (const off of leave) off();
  };
}

/** 全ての種類の塊の今の状態。読み始めていなければ読み始める。全ての種類の図を書き戻す棚の早見が待つ (#3349) */
export const useAllKinds = (): Later<void> => useSyncExternalStore(onKindSettled, allKinds);
