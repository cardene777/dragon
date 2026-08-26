import type { CdlDiagram } from "@cardenelabs/cdl";

/**
 * 2 段目以降の描き方 (#1359)。
 *
 * 見本の図は 1 段目で起点から描かれ、2 段目以降は値が動くだけになる。 折れ線なら 1 段目で
 * 左から線が引かれ、2 段目は点の高さが移るだけで線は引き直さない。
 *
 * どちらが見やすいかは図と見る人による。 値の移り方を見たい時は動かすだけがよく、
 * 「別のデータで描き直した」 ことを示したい時は引き直した方が伝わる。
 *
 * 描画側の仕組みは既にある = 段に `draw` があればその段は起点から描かれる。 **1 段目の
 * `draw` を 2 段目以降へ写す** ことで引き直しになり、描く相手も記法の語も新しく決めずに済む。
 *
 * 速度の切替 (`playback-speed.ts`) と同じく、図とコードタブの両方に同じ変換を掛ける。
 */

export const 描き方の選択肢 = ["動かすだけ", "描き直す"] as const;

export type 描き方 = (typeof 描き方の選択肢)[number];

/** 既定。 見本の source に書いたとおり (1 段目だけ描く) */
export const 既定の描き方: 描き方 = "動かすだけ";

/**
 * その図で切替えられるか。
 *
 * 1 段目が起点から描く図に限る。 起点から描けない図 (順序図 等) では 2 段目に `draw` を
 * 足しても何も変わらないため、切替を出さない = 押しても何も起きない操作を置かない。
 *
 * 段が 1 つしか無い図も対象外。 写す先が無い。
 */
export function 描き方を選べる(diagram: CdlDiagram): boolean {
  return (diagram.phases[0]?.draw ?? []).length > 0 && diagram.phases.length > 1;
}

/**
 * 図の 2 段目以降に、1 段目と同じ描く指定を写す。
 *
 * **「動かすだけ」 では元の object をそのまま返す**。 新しい object を返すと `CdlDiagramView`
 * が別の図を渡されたとみなして描き直し、切替を触っていない図が最初へ戻る
 * (`playback-speed.ts` と同じ理由)。
 */
export function 図の描き方を変える(diagram: CdlDiagram, 描き方: 描き方): CdlDiagram {
  if (描き方 !== "描き直す" || !描き方を選べる(diagram)) return diagram;
  // `描き方を選べる` が 1 段目の `draw` を見ているので必ず引ける
  const 一段目 = diagram.phases[0];
  if (一段目 === undefined) return diagram;
  const 写す = 一段目.draw ?? [];
  return {
    ...diagram,
    phases: diagram.phases.map((p, i) => (i === 0 ? p : { ...p, draw: [...写す] })),
  };
}

/** 記法の種別。 描く指定の書き方が違うので分けて扱う */
export type 記法の種別 = "yaml" | "json";

/** 記法 (YAML) の段の見出し行 */
const YAMLの段の見出し = /^[ \t]*-[ \t]*step:[ \t]*"[^"]*"[ \t]+\d+(?:\.\d+)?s[ \t]*$/gm;

/** 文字列を、渡した位置で区切って並べる */
function 位置で割る(source: string, 位置: number[]): string[] {
  return 位置.map((始, i) => source.slice(始, i + 1 < 位置.length ? 位置[i + 1] : source.length));
}

/**
 * 記法 (YAML) の 2 段目以降に描く指定を写す。
 *
 * 1 段目の `draw: <語>` を読み、同じ字下げの行を 2 段目以降の段にも足す。 語を推測しないので、
 * 図の種別が増えても対応表を持たずに済む。
 *
 * 既に `draw:` を持つ段は触らない。
 */
function yamlの描き方を変える(source: string): string {
  const 位置 = [...source.matchAll(YAMLの段の見出し)].map((m) => m.index ?? 0);
  if (位置.length < 2) return source;

  const 段 = 位置で割る(source, 位置);
  // `位置` は 2 件以上あるので先頭は必ず引ける
  const 先頭 = 段[0];
  if (先頭 === undefined) return source;
  const draw行 = /^([ \t]*)draw:[ \t]*(\S+)[ \t]*$/m.exec(先頭);
  // 2 つとも必須の群。 一致した以上必ず取れる
  const 字下げ = draw行?.[1];
  const 語 = draw行?.[2];
  if (字下げ === undefined || 語 === undefined) return source;

  const 直した = 段.map((本体, i) => {
    if (i === 0 || /^[ \t]*draw:/m.test(本体)) return 本体;
    // 見出しは本体の 1 行目。 その直後に足す
    const 改行 = 本体.indexOf("\n");
    if (改行 < 0) return `${本体}\n${字下げ}draw: ${語}`;
    return `${本体.slice(0, 改行)}\n${字下げ}draw: ${語}${本体.slice(改行)}`;
  });

  return source.slice(0, 位置[0]) + 直した.join("");
}

/** 記法 (JSON) の段の見出し (`"step": "..."` とその直後のコンマ) */
const JSONの段の見出し = /"step"\s*:\s*"[^"]*"\s*,/g;

/**
 * 記法 (JSON) の 2 段目以降に描く指定を写す。
 *
 * JSON は見本によって形が違う (1 行に畳んだ段と、欄ごとに改行した段の両方がある) ため、
 * **段の見出しの直後** に足す。 どちらの形でも壊れず、元の改行の入れ方も保てる。
 */
function jsonの描き方を変える(source: string): string {
  const 語 = /"draw"\s*:\s*"([^"]+)"/.exec(source)?.[1];
  if (語 === undefined) return source;

  const 見出し = [...source.matchAll(JSONの段の見出し)];
  if (見出し.length < 2) return source;

  const 位置 = 見出し.map((m) => m.index ?? 0);
  const 段 = 位置で割る(source, 位置);

  const 直した = 段.map((本体, i) => {
    if (i === 0 || /"draw"\s*:/.test(本体)) return 本体;
    // `段` は `見出し` から作った位置で割っているので同じ数だけ在る
    const この見出し = 見出し[i];
    if (この見出し === undefined) return 本体;
    const 見出しの長さ = この見出し[0].length;
    const 頭 = 本体.slice(0, 見出しの長さ);
    const 残り = 本体.slice(見出しの長さ);
    // 直後が改行なら同じ字下げで次の行に、そうでなければ空白 1 つで続ける
    const 次の字下げ = /^\n([ \t]*)/.exec(残り);
    return 次の字下げ
      ? `${頭}\n${次の字下げ[1]}"draw": "${語}",${残り}`
      : `${頭} "draw": "${語}",${残り}`;
  });

  return source.slice(0, 位置[0]) + 直した.join("");
}

/**
 * 記法に描き方を反映する。
 *
 * **「動かすだけ」 では元の文字列をそのまま返す** (`playback-speed.ts` と同じ理由)。
 */
export function 記法の描き方を変える(source: string, 描き方: 描き方, 種別: 記法の種別): string {
  if (描き方 !== "描き直す") return source;
  return 種別 === "yaml" ? yamlの描き方を変える(source) : jsonの描き方を変える(source);
}
