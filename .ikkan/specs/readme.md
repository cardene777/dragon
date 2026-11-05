# readme

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 4つの README (`README.md`、`README.ja.md`、`packages/dragon/README.md`、`packages/dragon/README.ja.md`) は、見本帳の場所の後、入れ方の節の前に思想の節 (日本語は`## 考え方`、英語は`## The idea`) を持つ | `pnpm exec vitest run packages/dragon/test/readme-idea.test.ts`の検査`readme-idea-before-install`が通る | #3391 |
| 思想の節は、コアブロックと個別ブロックと接続ブロックを表に並べ (英語は core blocks、kind blocks、connector blocks)、図がブロックを組み立てたものであることと、見た目を1つの表で揃えることを書く | `pnpm exec vitest run packages/dragon/test/readme-idea.test.ts`の検査`readme-idea-names-blocks`が通る | #3391 |
| 思想の節は、今ブロックを足す道が pull request か fork で、使う人が手元で足す口はまだ無いことを書く | `pnpm exec vitest run packages/dragon/test/readme-idea.test.ts`の検査`readme-idea-names-extend-path`が通る | #3391 |
| 思想の節は、mermaid と同じ手軽さの4つ (書く字が短い、script の1行で出る、AI が速く書ける、軽くて速い) と、mermaid と互換にしないことを書く | `pnpm exec vitest run packages/dragon/test/readme-idea.test.ts`の検査`readme-idea-names-mermaid-ease`が通る | #3391 |
| repo の README と npm の頁の README の思想の節は、同じ言葉の版どうしで1字も違わない | `pnpm exec vitest run packages/dragon/test/readme-idea.test.ts`の検査`readme-idea-same-in-repo-and-npm`が通る | #3391 |
| repo の README 2つの最初の図の節は、script の1行と`<pre class="dragon">`の塊で頁に図を出す書き方を示し、package の README のその節へ link する | `pnpm exec vitest run packages/dragon/test/readme-idea.test.ts`の検査`readme-first-diagram-points-to-script-entry`が通る | #3391 |
| repo の README 2つの描ける図の欄は8つの図の種類を全て挙げ、原本の欄はブロックを並べる版2の形を書く | `pnpm exec vitest run packages/dragon/test/readme-idea.test.ts`の検査`readme-lists-every-kind-and-blocks-source`が通る | #3391 |
| 4つの README は、言葉の link、見本帳、入れ方、最初の図の順に並び、最初の図が読める | `pnpm exec vitest run packages/dragon/test/notation.test.ts`の検査`readme-opens-with-catalog-install-and-first-diagram`が通る | #3391 |
| package の README の script の1行は、package の今の版の真ん中の数を書く | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`readme-shows-script-entry`が通る | #3391 |
