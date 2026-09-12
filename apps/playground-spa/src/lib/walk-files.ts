import { readdirSync, statSync } from "node:fs";

/**
 * 木を降りて file を集める。 検査からしか引かれない (node の file 読み取りを使う)。
 *
 * 2 つ目の引き手ができたので切り出した (#1834)。 同じ歩き方を 2 箇所に置くと、
 * 片方だけが `.test.` の扱いを変えた日に母集団が静かにずれる。
 *
 * `dir` は末尾に `/` を付けて渡す (中で `d + e` とつなぐ)。
 *
 * @param dir 走査の根。 末尾 `/` 付き
 * @param 拡張子 file 名に当てる正規表現
 * @param 検査を含む `false` なら名前に `.test.` を含む file を外す
 */
export function file一覧(dir: string, 拡張子: RegExp, 検査を含む: boolean): string[] {
  const out: string[] = [];
  const 降りる = (d: string): void => {
    for (const e of readdirSync(d)) {
      const p = d + e;
      if (statSync(p).isDirectory()) 降りる(p + "/");
      else if (拡張子.test(e) && (検査を含む || !e.includes(".test."))) out.push(p);
    }
  };
  降りる(dir);
  return out;
}
