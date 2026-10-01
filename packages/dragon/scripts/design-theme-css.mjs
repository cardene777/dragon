/**
 * 図の色を当てる規則を、入れ物の下に閉じ込める。
 *
 * cdl は形だけを描き、色は `apps/playground-spa/src/styles/cdl-theme.css` が当てる。
 * 意匠帳は明るい側と暗い側を 1 つの頁に並べるので、規則をそのまま置くと両方に同じ色が乗る。
 * 面の class を前に付けて、面ごとの変数で解決させる。
 */

/**
 * 変換が扱える入れ子 (#2770)。
 *
 * `@keyframes` は **名前で引く決まり** で、面の下に入れる意味がない。
 * 中身をそのまま出せば、どちらの面の規則からも同じ名前で引ける。
 * `@media` や `@supports` は条件が付くので同じようには出せず、引き続き扱えない側に残る。
 */
const 扱える入れ子 = /^@keyframes\b/;

/** 入れ子の規則のうち、変換が扱えないもの (`@media` 等)。 現れたら呼出側に知らせる */
export function findNestedAtRules(css) {
  const noComments = stripComments(css);
  return [...noComments.matchAll(/@[\w-]+[^;{]*\{/g)]
    .map((m) => m[0].trim().replace(/\s*\{$/, ""))
    .filter((at) => !扱える入れ子.test(at));
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * `@keyframes` を本文から切り出す。
 *
 * 平らな走査 (`[^{}]`) では読めない = 中に `from` / `to` の規則を入れ子で持つため、
 * 走査は内側だけを拾って `.light-face from { … }` のような規則を作ってしまう。
 * 波括弧を数えて丸ごと取り出し、面を付けずにそのまま返す。
 *
 * @returns 取り出した `@keyframes` の並びと、取り除いた残りの本文
 */
function 動きを切り出す(css) {
  const 切り出し = [];
  let 残り = "";
  let i = 0;
  while (i < css.length) {
    const m = /@keyframes[^{]*\{/.exec(css.slice(i));
    if (!m) {
      残り += css.slice(i);
      break;
    }
    const 始め = i + m.index;
    残り += css.slice(i, 始め);
    let 深さ = 0;
    let j = 始め + m[0].length - 1;
    for (; j < css.length; j++) {
      if (css[j] === "{") 深さ += 1;
      else if (css[j] === "}") {
        深さ -= 1;
        if (深さ === 0) {
          j += 1;
          break;
        }
      }
    }
    切り出し.push(css.slice(始め, j).trim());
    i = j;
  }
  return { 切り出し, 残り };
}

/**
 * 選択子に面の class を付ける。
 *
 * `:root` の宣言は落とす = 変数は面ごとに控えた実値を当てているので、
 * ここで重ねると控えた値を上書きしてしまう。
 *
 * `@keyframes` は面を付けずそのまま出す (§ 扱える入れ子)。
 *
 * @param css   元の規則
 * @param scope 面の選択子 (例 `.light-face`)
 * @returns     閉じ込めた規則と、落とした宣言の数と、そのまま出した動きの数
 */
export function scopeThemeCss(css, scope) {
  const { 切り出し, 残り } = 動きを切り出す(stripComments(css));
  const rules = [];
  let dropped = 0;
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(残り)) !== null) {
    const selector = m[1].trim();
    const decls = m[2].trim();
    if (!selector || !decls) continue;
    if (selector === ":root" || selector.startsWith("@")) {
      dropped += 1;
      continue;
    }
    const scoped = selector
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => `${scope} ${s}`)
      .join(",\n");
    rules.push(`${scoped} {\n  ${decls}\n}`);
  }
  return {
    css: [...切り出し, ...rules].join("\n"),
    dropped,
    count: rules.length,
    keyframes: 切り出し.length,
  };
}
