/**
 * ブロックの読み方の登録簿 (#3349)。
 *
 * 読む処理 (`parser.ts`) と書き戻す処理 (`printer.ts`) と誤りの文の表 (`messages.ts`) は、ブロックの読み方をここから引く。
 * 入口は初めから持つ読み方 (コアブロックと、後から読まない図の種類の個別ブロック、`entry-readings.ts`) を読み込みの時に登録する。
 * 全部入りの入口は残りの読み方も読み込みの時に登録し (`kinds/all.ts`)、軽い入口は書いた図が使う時に読んで登録する (`light.ts`)。
 * 登録した読み方は登録した順でなく、ブロックの並び (`rank`) の順に引く。
 */
import { type Block, type BlockReading, ranked } from "./block";
import { ENTRY_READINGS } from "./entry-readings";
import { BLOCKS } from "./index";

const registered = new Map<string, BlockReading>(Object.entries(ENTRY_READINGS));
/** 登録が変わった回数。引いた表を作り直すかを、呼ぶ側がこの数で決める */
let changes = 0;

/** ブロック `name` の読み方を登録する。同じブロックを 2 度登録しても、後の登録で替わるだけ */
export function registerReading(name: string, reading: BlockReading): void {
  registered.set(name, reading);
  changes += 1;
}

/** ブロック `name` の読み方を持っているか */
export const readingLoaded = (name: string): boolean => registered.has(name);

/** ブロック `name` の読み方。持っていなければ `undefined` */
export const readingOf = (name: string): BlockReading | undefined => registered.get(name);

/** 登録が変わった回数 */
export const readingChanges = (): number => changes;

/** 持っている読み方を、ブロックの並び (`rank`) の順に、定義と組にして返す */
export function loadedReadings(): { block: Block; reading: BlockReading }[] {
  return ranked(BLOCKS as unknown as Record<string, Block>).flatMap((block) => {
    const reading = registered.get(block.name);
    return reading ? [{ block, reading }] : [];
  });
}

/**
 * `changes` が変わった時だけ `make` で作り直して返す、引いた表の入れ物。
 * 読み方を引いて作る表 (行の頭の語ごとの読む処理、書き戻す処理、誤りの文) は、登録が変わらない間は同じ表を使う
 */
export function cachedByReadings<T>(make: () => T): () => T {
  let made: { at: number; value: T } | undefined;
  return () => {
    if (!made || made.at !== changes) made = { at: changes, value: make() };
    return made.value;
  };
}
