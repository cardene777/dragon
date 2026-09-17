/**
 * 書き間違えた名前に綴りの近い候補を探す (#1295 で JSON の項目名に作り、#2113 で部品の名前と共有した)。
 *
 * 「知らない名前です」 だけだと、書いた人は正しい綴りを探しに行く必要がある。
 * 2 文字の違い (足りない / 多い / 別の字) までを候補とする。 隣どうしの入れ替わりは 2 文字の違いに数える。
 *
 * 遠い名前は勧めない。 無関係な名前を勧めると、書いた人がそちらへ直して二度手間になる。
 * 大文字と小文字は区別しない。
 */
export function 近い名前(語: string, 候補: Iterable<string>): string | undefined {
  const 小文字 = 語.toLowerCase();
  let 最短: { 名: string; 距離: number } | undefined;
  for (const c of 候補) {
    const d = 編集距離(小文字, c.toLowerCase(), 2);
    if (d <= 2 && (最短 === undefined || d < 最短.距離)) 最短 = { 名: c, 距離: d };
  }
  return 最短?.名;
}

/**
 * 2 つの語の編集距離 (上限付き)。
 *
 * 上限を持つのは、長い語どうしで表を全部埋めないため。 上限を超えた時点で打ち切る。
 */
function 編集距離(a: string, b: string, 上限: number): number {
  if (Math.abs(a.length - b.length) > 上限) return 上限 + 1;
  let 前 = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const 今: number[] = [i];
    let 行の最小 = i;
    for (let j = 1; j <= b.length; j += 1) {
      const 費用 = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(今[j - 1]! + 1, 前[j]! + 1, 前[j - 1]! + 費用);
      今.push(v);
      if (v < 行の最小) 行の最小 = v;
    }
    // その行の最小が上限を超えたら、以降どう進んでも上限以下にはならない
    if (行の最小 > 上限) return 上限 + 1;
    前 = 今;
  }
  return 前[b.length]!;
}
