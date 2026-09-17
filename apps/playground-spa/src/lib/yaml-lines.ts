import { parseEvents, getScalarValue, EVENT_ID, type Event } from "js-yaml";
import { 書いた場所の鍵, type 書いた行の表 } from "@cardenelabs/dragon";

/**
 * YAML の本文から、書いた場所ごとの行番号を読む (#2117)。
 *
 * `load()` が返す素の値は書いた場所を持たないため、そこから組み立てた図の知らせは全て
 * 0 行になり、画面は「どの行の話か」 を出せなかった。 `parseEvents` は同じ本文を事象の
 * 並びとして返し、各事象が本文の何文字目から始まるかを持つ。 その位置を行番号に直して
 * 場所ごとに覚える。
 *
 * 鍵の形と、名前に `/` や `~` を含む欄でも重ならない理由は `書いた場所の鍵`
 * (`packages/dragon/src/json-line-map.ts`) が持つ。 作る側と引く側で同じ関数を呼ぶ。
 *
 * 拾えない書き方が 2 つある。 どちらも行が 0 に戻るだけで、図と誤りの表示は変わらない。
 *
 * | 書き方 | どうなるか |
 * |---|---|
 * | 別名の取り込み (`<<: *ref`) | 取り込んだ側の欄は `*ref` を書いた場所を持たない。 取り込み元の欄として覚える |
 * | 鍵が入れ子になった形 (`? [a, b]`) | その鍵の下は場所を作らない。 `load()` が作る名前と繋げられないため |
 */
export function 書いた行を読む(src: string): 書いた行の表 {
  const 表 = new Map<string, number>();
  let 並び: Event[];
  try {
    並び = parseEvents(src, {});
  } catch {
    // 読めない本文の誤りは `yamlToObject` が行つきで知らせる。 ここでは行を諦めて空の表を
    // 返す = 知らせが行を持たない今までの形に戻るだけで、図は出る
    return 表;
  }
  const 行を引く = 行の引き手(src);
  const 積み: 枠[] = [];
  for (const 事象 of 並び) {
    if (事象.type === EVENT_ID.POP) {
      積み.pop();
      continue;
    }
    if (事象.type === EVENT_ID.DOCUMENT) {
      積み.push({ 種類: "文書" });
      continue;
    }
    const 上 = 積み[積み.length - 1];
    if (上 === undefined) continue;
    const 道 = 次の道(上, 事象, src);
    const 始まり = 節の始まり(事象);
    if (道 !== null && 始まり >= 0) 表.set(道, 行を引く(始まり));
    if (事象.type === EVENT_ID.SEQUENCE) 積み.push({ 種類: "並び", 道, 番号: 0 });
    else if (事象.type === EVENT_ID.MAPPING) 積み.push({ 種類: "写像", 道, 次は鍵: true, 鍵: null });
  }
  return 表;
}

/**
 * 今いる入れ物の中で、この節がどの場所に当たるかを返す。
 *
 * `null` は「場所を作らない」 = 鍵そのものと、鍵が入れ子になった形の下。
 */
function 次の道(上: 枠, 事象: Event, src: string): string | null {
  if (上.種類 === "文書") return "";
  if (上.種類 === "並び") {
    const 道 = 上.道 === null ? null : 上.道 + 書いた場所の鍵(上.番号);
    上.番号 += 1;
    return 道;
  }
  if (上.次は鍵) {
    // 鍵は場所を持たない。 `load()` が作る名前と繋がるのは値の側だけ
    上.鍵 = 事象.type === EVENT_ID.SCALAR ? getScalarValue(src, 事象) : null;
    上.次は鍵 = false;
    return null;
  }
  上.次は鍵 = true;
  if (上.道 === null || 上.鍵 === null) return null;
  return 上.道 + 書いた場所の鍵(上.鍵);
}

/** 事象が本文の何文字目から始まるか。 `-1` は本文に対応する場所が無いことを表す */
function 節の始まり(事象: Event): number {
  if (事象.type === EVENT_ID.SCALAR) return 事象.valueStart;
  if (事象.type === EVENT_ID.ALIAS) return 事象.anchorStart;
  if (事象.type === EVENT_ID.SEQUENCE || 事象.type === EVENT_ID.MAPPING) return 事象.start;
  return -1;
}

/**
 * 本文の位置 (何文字目か) から行番号 (1 始まり) を引く。
 *
 * 行頭の位置を先に並べてから二分探索する。 位置ごとに数え直すと、要素数に比例して
 * 本文を読み直すことになる (本文の長さ × 要素数)。
 */
function 行の引き手(src: string): (位置: number) => number {
  const 行頭: number[] = [0];
  for (let i = 0; i < src.length; i += 1) {
    if (src.charCodeAt(i) === 10) 行頭.push(i + 1);
  }
  return (位置) => {
    let 下 = 0;
    let 上 = 行頭.length - 1;
    while (下 < 上) {
      const 中 = Math.ceil((下 + 上) / 2);
      if ((行頭[中] ?? 0) <= 位置) 下 = 中;
      else 上 = 中 - 1;
    }
    return 下 + 1;
  };
}

/** 読んでいる途中の入れ物。 `道` が `null` の入れ物の中では場所を作らない */
type 枠 =
  | { 種類: "文書" }
  | { 種類: "写像"; 道: string | null; 次は鍵: boolean; 鍵: string | null }
  | { 種類: "並び"; 道: string | null; 番号: number };
