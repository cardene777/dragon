/**
 * 書いた語に一番近い語 (#3315)。誤りの文で、書き間違えた語の代わりに 1 つだけ候補を示す。
 *
 * 大文字と小文字を区別しない編集距離 (1 字の足し、消し、置き換えを 1 と数える) で比べる。
 * 距離が 2 以下で、書いた語の字数より小さい時だけ近いとみなす。
 * 字数より小さいことを求めるのは、1 字の語がどの 1 字の語とも距離 1 になり、何を書いても候補が出るのを避けるため。
 * 同じ距離の語が 2 つ以上ある時は `candidates` の並びで先の語を返し、近い語が無ければ `undefined` を返す。
 */
const MAX_DISTANCE = 2;

export function nearest(word: string, candidates: readonly string[]): string | undefined {
  const written = [...word.toLowerCase()];
  let limit = Math.min(MAX_DISTANCE, written.length - 1);
  let best: string | undefined;
  for (const candidate of candidates) {
    const d = distance(written, [...candidate.toLowerCase()]);
    if (d > limit) continue;
    best = candidate;
    // 後の語は、今の語より近い時だけ置き換える
    limit = d - 1;
  }
  return best;
}

/**
 * 2 つの名札が、書き間違いを疑うほど似ているか (#3438)。箱を宣言しない図で、似た名前の箱を知らせる時に使う。
 * 大文字と小文字を区別して 1 字だけ違う時に似ているとみなす。
 * ただし数字を外すと同じになる名前 (`node1` と `node2`) は番号を振った別の箱なので、数字を外した残りが 1 字の名前 (`A` と `B`、`A1` と `B1`) は
 * どの 2 つも 1 字違いになるので、どちらも似ているとみなさない
 */
export function similarNames(a: string, b: string): boolean {
  const bareA = [...a.replace(/\p{Nd}/gu, "")];
  const bareB = [...b.replace(/\p{Nd}/gu, "")];
  if (bareA.join("") === bareB.join("") || Math.min(bareA.length, bareB.length) < 2) return false;
  return distance([...a], [...b]) === 1;
}

/** 2 つの字の並びの編集距離 */
function distance(a: readonly string[], b: readonly string[]): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const replace = (previous[j - 1] as number) + (a[i - 1] === b[j - 1] ? 0 : 1);
      current.push(Math.min((previous[j] as number) + 1, (current[j - 1] as number) + 1, replace));
    }
    previous = current;
  }
  return previous[b.length] as number;
}
