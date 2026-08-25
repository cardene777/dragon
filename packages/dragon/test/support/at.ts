/**
 * 並びから要素を取り出す (#1414)。
 *
 * `noUncheckedIndexedAccess` が有効なため、`xs[0]` の型は `T | undefined` になる。
 * 検査 code では「あるはず」 の要素を引くことが多く、そのままでは型が通らない。
 *
 * ## `!` で潰さない
 *
 * `xs[0]!` と書くと型は通るが、実際に無かった時に
 * `Cannot read properties of undefined (reading 'x')` の形で落ちる。 **落ちる場所が原因から
 * 離れる** = 「何番目が無かったのか」 も「並びの長さがいくつだったのか」 も残らない。
 *
 * ここで確かめて落とすと、検査の前提が崩れたことがそのまま読める。
 *
 * ## 検査の判定は変えない
 *
 * 要素があれば素通しする。 無い時だけ落ちるので、いま通っている検査の pass / fail は
 * 変わらない (実測で確認する)。
 */
export function at<T>(xs: readonly T[], i: number, 名: string): T {
  const v = xs[i];
  if (v === undefined) {
    throw new Error(`${名}[${i}] が無い (検査の前提が崩れている: 長さ ${xs.length})`);
  }
  return v;
}

/**
 * 表から値を引く。
 *
 * `Record<string, T>` の添字も同じく `T | undefined` になる。 `at` と同じ理由で、
 * 無い時に鍵の名前を残して落とす。
 */
export function 引く<T>(表: Readonly<Record<string, T>>, 鍵: string, 名: string): T {
  const v = 表[鍵];
  if (v === undefined) {
    throw new Error(`${名} に "${鍵}" が無い (ある鍵: ${Object.keys(表).join(", ") || "なし"})`);
  }
  return v;
}
