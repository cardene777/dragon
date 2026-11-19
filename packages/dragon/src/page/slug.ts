/**
 * 見出しの字から頁の中の場所の名前を作る (#3755)。GitHub が見出しに付ける場所の名前と同じ作り方にする。
 *
 * 英字を小文字にし、字と数字と `-` と `_` と空白のほかを外し、空白を `-` にする。仮名と漢字はそのまま残す。
 * 同じ名前が 2 度目に出た時は、後ろに `-1`、`-2` を足して分ける。
 */

/** 字と数字と結合文字と `-` と `_` と空白のほか */
const PUNCTUATION = /[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu;

/** 見出しの字の場所の名前。重なりは分けない */
export const slugOf = (heading: string): string => heading.trim().toLowerCase().replace(PUNCTUATION, "").replace(/ /gu, "-");

/** 頁の中で重ならない場所の名前を配る。`taken` に在る名前と、前に配った名前を避ける */
export function slugger(taken: Iterable<string> = []): (heading: string) => string {
  const used = new Set(taken);
  return (heading) => {
    const base = slugOf(heading);
    let name = base;
    for (let n = 1; used.has(name); n++) name = `${base}-${n}`;
    used.add(name);
    return name;
  };
}
