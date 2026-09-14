/**
 * 記法の検査の指摘を端末に書く形 (#1946)。
 *
 * 記法の検査の道具 (`dragon-lint.mjs`) と実証用の台本 (`lint-proof-fixture.mjs`) は同じ指摘を出す。
 * 形を 2 か所に書くと片方だけ直して食い違うので、ここに 1 つだけ置く。
 *
 * 識別子 (規則名) と書き手の値 (図や部品の `id`) は `` ` `` で囲む。 指摘の文 (`message`) と
 * 同じ約束で、囲んだ範囲の外を日本語で書く。
 */

/** 指摘の重さ (`severity`) の見出し。 記号だけだと、読む人は 2 つの違いを知らない */
const 重さの見出し = { warn: "⚠ 注意", info: "ℹ 参考" };

/**
 * 1 つの指摘を書く行。 1 行目に重さ・規則・対象、2 行目に指摘の文、3 行目に修正案 (あれば) を置く。
 *
 * @param {{ severity: string; rule: string; target: string; message: string; suggestion?: string; autoFixable: boolean }} 指摘
 * @param {string} [字下げ]
 * @returns {string[]}
 */
export function 指摘の行(指摘, 字下げ = "") {
  const 見出し = 重さの見出し[指摘.severity] ?? `\`${指摘.severity}\``;
  const 直せる = 指摘.autoFixable ? "、自動修正できる" : "";
  const 行 = [
    `${字下げ}${見出し} \`${指摘.rule}\` (対象 \`${指摘.target}\`${直せる})`,
    `${字下げ}   ${指摘.message}`,
  ];
  if (指摘.suggestion) 行.push(`${字下げ}   → ${指摘.suggestion}`);
  return 行;
}
