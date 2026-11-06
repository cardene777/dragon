/**
 * 記法から読んだ図の印 (#3400)。
 *
 * `parseNotation` が返した図の object に内側で印を付け、読む時 (`readDiagram`) と描く時に原本の形の検査を省く。
 * 記法を読む処理は原本の形の外の図を作らないので (検査 `every-parsed-example-passes-validator`)、もう一度確かめなくてよい。
 * 検査を省くと、記法の図を描く頁は原本の形の検査 (`schemas/validate-diagram.js`) を 1 度も読まずに済む。
 *
 * 印は object ごとに付くので、読んだ図を写して作り直した図 (`{ ...diagram }`) は印を持たず、今までどおり検査を通す。
 * 読んだ後に書き換えた値のうち、字のまま SVG と頁に入る値は、印の付いた図でも読む時に確かめる (`version.ts` の `unsafeValues`)。
 */
const parsed = new WeakSet<object>();

/** 記法から読んだ図に印を付けて返す */
export function markParsed<T extends object>(diagram: T): T {
  parsed.add(diagram);
  return diagram;
}

/** 記法から読んで印を付けた図か */
export const isParsed = (input: unknown): boolean => typeof input === "object" && input !== null && parsed.has(input);
