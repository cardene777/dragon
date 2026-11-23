/**
 * 字を 2 行に折れる所 (#3809)。
 *
 * 流れ図の判断の問い (`kinds/flow/layout.ts`) と、量の図のドーナツの真ん中の名前 (`render/chart.ts`) が使う。
 * 欧文は空白で、和文は読点の後と、漢字か片仮名か英字の後に続く助詞か、漢字か片仮名か英字の前に来る助詞の後で折る。
 * 折った後の行が空になる所と、次の行が閉じる字で始まる所では折らない。
 * 助詞で折れない和文 (漢字だけの名前など) は、`anyTwoRows` が字の間の全ての所を返す
 */

/** 後ろで折ってよい助詞。和文の問いは助詞の後で折り、助詞を行の頭に送らない */
const PARTICLES = new Set([..."はがをにでとへもの"]);
/** 後ろで折ってよい読点 */
const COMMAS = new Set([..."、，"]);
/** 前で折らない字。閉じ括弧と句読点と、問いの終わりの印を行の頭に送らない */
const CLOSING = new Set([..."、。，．）」』！？!?,.)"]);
/** 平仮名か。助詞と同じ字の平仮名は語の中にも出るので、前と後ろがどちらも平仮名の所では折らない */
const isKana = (ch: string | undefined): boolean => ch !== undefined && /\p{Script=Hiragana}/u.test(ch);
/** 和文の字か */
const isWide = (ch: string | undefined): boolean => ch !== undefined && (ch.codePointAt(0) ?? 0) >= 0x2e80;

/** `k` 番目の字の前で折った 2 行。空の行か、閉じる字で始まる次の行になる時は無い */
function splitAt(chars: string[], k: number): string[] | undefined {
  const first = chars.slice(0, k).join("").trimEnd();
  const second = chars.slice(k).join("").trimStart();
  if (first === "" || second === "" || CLOSING.has([...second][0] as string)) return undefined;
  return [first, second];
}

/** 字を 2 行に折れる所ごとの 2 行。空白と読点と助詞の後で折る */
export function twoRows(text: string): string[][] {
  const chars = [...text];
  const out: string[][] = [];
  for (let k = 1; k < chars.length; k++) {
    const prev = chars[k - 1] as string;
    const next = chars[k] as string;
    const space = /\s/u.test(next);
    const particle = PARTICLES.has(prev) && k >= 2 && !(isKana(chars[k - 2]) && isKana(next));
    if (!space && !particle && !COMMAS.has(prev)) continue;
    const rows = splitAt(chars, k);
    if (rows) out.push(rows);
  }
  return out;
}

/** 字を 2 行に折れる全ての所の 2 行。和文は字の間で、欧文は空白の後で折る */
export function anyTwoRows(text: string): string[][] {
  const chars = [...text];
  const out: string[][] = [];
  for (let k = 1; k < chars.length; k++) {
    if (!isWide(chars[k]) && !isWide(chars[k - 1]) && !/\s/u.test(chars[k - 1] as string)) continue;
    const rows = splitAt(chars, k);
    if (rows) out.push(rows);
  }
  return out;
}
