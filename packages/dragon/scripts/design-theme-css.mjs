/**
 * 図の色を当てる規則を、入れ物の下に閉じ込める。
 *
 * cdl は形だけを描き、色は `apps/playground-spa/src/styles/cdl-theme.css` が当てる。
 * 意匠帳は明るい側と暗い側を 1 つの頁に並べるので、規則をそのまま置くと両方に同じ色が乗る。
 * 面の class を前に付けて、面ごとの変数で解決させる。
 */

/** 入れ子の規則 (`@media` 等)。 変換は入れ子を扱えないので、現れたら呼出側に知らせる */
export function findNestedAtRules(css) {
  const noComments = stripComments(css);
  return [...noComments.matchAll(/@[\w-]+[^;{]*\{/g)].map((m) => m[0].trim().replace(/\s*\{$/, ""));
}

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * 選択子に面の class を付ける。
 *
 * `:root` の宣言は落とす = 変数は面ごとに控えた実値を当てているので、
 * ここで重ねると控えた値を上書きしてしまう。
 *
 * @param css   元の規則
 * @param scope 面の選択子 (例 `.light-face`)
 * @returns     閉じ込めた規則と、落とした宣言の数
 */
export function scopeThemeCss(css, scope) {
  const body = stripComments(css);
  const rules = [];
  let dropped = 0;
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(body)) !== null) {
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
  return { css: rules.join("\n"), dropped, count: rules.length };
}
