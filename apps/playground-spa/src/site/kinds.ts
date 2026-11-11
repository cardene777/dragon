/**
 * 図の種類の描く部品を後から読む塊 (#3248、#3349)。
 *
 * chart、cycle、er、flow、git、lineup、matrix、mind、pipe、state、time、tree、try の部品は種類ごとの塊にし、最初の画面を描いた後に裏で読み始める (`main.tsx`)。
 * 塊は種類の描く部品と、その種類の個別ブロックの読み方を全て読む (`loadKind`)。図を描く所と書く所は、記法を読む前に種類の塊を待つ。
 * 読み込みの状態は見本の塊と同じ形で持ち (`later.ts`)、読めなかった時は失敗のまま持つ。
 * 時系列図と構成図の部品は最初に読む script に在るので、待たずに描ける。
 */
import { definesBlocks, LATER_KINDS, loadKind, loadReadings, loadValidator } from "@cardenelabs/dragon/light";

import { useSyncExternalStore } from "react";

import { type Later, type LaterChunk, laterChunk, useLater } from "./later";

const CHUNKS = new Map(LATER_KINDS.map((kind): [string, LaterChunk<void>] => [kind, laterChunk(() => loadKind(kind))]));

/** 裏で読む塊の全部 */
export const KIND_CHUNKS: readonly LaterChunk<void>[] = [...CHUNKS.values()];

const READY: Later<void> = { status: "ready", value: undefined };
/** 初めから持つ種類の状態。読むものが無いので状態は替わらない */
const KEPT: LaterChunk<void> = { start: () => undefined, state: () => READY, subscribe: () => () => undefined };

/** 原本の形の検査の塊 (#3400)。記法から読んだ図は検査を要らないので、原本の JSON を読む所だけが待つ */
const VALIDATOR = laterChunk(() => loadValidator());

/**
 * 足したブロックの定義を読む処理の塊 (#3399、#3407)。読む処理は 1 つで、どの記法にも同じ物を使う。
 * 定義の版の行だけの記法を `loadReadings` に渡し、定義を読む処理を読む。
 * 見本帳の橋の見本の定義は絵柄集 Tabler の絵柄を持つ (#3489) ので、定義の `icon tabler:` の行も渡して絵柄集の表も一緒に読む。
 * 定義を持たない記法は待たないので、最初の画面は表を待たない
 */
const DEFINITIONS = laterChunk(() => loadReadings("blocks 1\n  icon tabler:\n"));

/** 記法 `text` を読むのに要る、足したブロックの定義を読む処理の塊の状態。定義の行を持たない記法は待たずに届いた扱いにし、塊を読み始めない */
export const useDefinitions = (text: string): Later<void> => useLater(definesBlocks(text) ? DEFINITIONS : KEPT);

/** 記法 `text` を読むのに要る、足したブロックの定義を読む処理が届いたか。定義の行を持たない記法は届いている */
export const definitionsReady = (text: string): boolean => !definesBlocks(text) || DEFINITIONS.state().status === "ready";

/** 記法 `text` が定義の行を持ち、定義を読む処理を読めなかったか */
export const definitionsFailed = (text: string): boolean => definesBlocks(text) && DEFINITIONS.state().status === "failed";

/** 定義を読む処理の塊が届くか読めなかった時に `listener` を呼ぶ。呼ぶと塊を読み始める。返した関数で外す */
export const onDefinitionsSettled = (listener: () => void): (() => void) => DEFINITIONS.subscribe(listener);

/** 原本の形の検査の塊の状態。`want` が偽の時は待たずに届いた扱いにし、塊を読み始めない */
export const useValidator = (want: boolean): Later<void> => useLater(want ? VALIDATOR : KEPT);

/** 原本の形の検査の塊が届いたか */
export const validatorReady = (): boolean => VALIDATOR.state().status === "ready";

/** 原本の形の検査の塊を読めなかったか */
export const validatorFailed = (): boolean => VALIDATOR.state().status === "failed";

/** 原本の形の検査の塊が届くか読めなかった時に `listener` を呼ぶ。呼ぶと塊を読み始める。返した関数で外す */
export const onValidatorSettled = (listener: () => void): (() => void) => VALIDATOR.subscribe(listener);

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
