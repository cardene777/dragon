# user-blocks

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 図の塊の頭に`blocks 1`と、`block +bridge`から`end`までに`base box`と`shape path "<path>"`と`color <役>`を持つ定義を書いた時、`+bridge cc as CCIP`の行を箱として読み、描いた SVG にその path の形を出す | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`user-box-block-draws-its-path`が通る | #3399 |
| 足した箱のブロックを段の中の線が名指した時、元の箱と同じくその段で光る | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`user-box-block-lights-in-step`が通る | #3399 |
| `base edge`の定義を書いた時、段の中の`eth +bridge base: トークン`の行を線として読み、その段で線の上を玉が走る | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`user-edge-block-carries-token`が通る | #3399 |
| `base icon`の定義を書いた時、`box cc as CCIP [icon: +bridge]`の箱にその path の印を描く | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`user-icon-block-draws-on-box`が通る | #3399 |
| 形に基本の形の名前 (`round` / `circle` / `cylinder` / `diamond` / `hexagon`) を書いた時、元のブロックの枠に収めてその形で描く | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`user-block-basic-shapes`が通る | #3399 |
| 足したブロックの線と塗りは色の表の役から読み、色味 (`palette`) を変えた時に足したブロックの色も変わる | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`user-block-reads-palette`が通る | #3399 |
| 同じ定義を JSON (`"format": 1`と`blocks`の並び) で渡した時、記法で書いた定義と同じ図の中身になる | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`user-block-json-equals-notation`が通る | #3399 |
| 定義と`+`の語を持つ図を JSON にしてから記法へ書き戻した時、定義と`+`の行が元の記法と同じに戻る | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`user-block-round-trips`が通る | #3399 |
| `parseNotation`と`renderDiagram`の引数`blocks`に定義を渡した時、図の塊に定義が無くても`+bridge`の行を読んで描く | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`user-block-passed-by-code`が通る | #3399 |
| 頁に`<link rel="dragon-blocks" href="…">`を置いた時、頁の全ての記法の塊がその file の定義を使って描かれ、頁が読みに行く file はその 1 つだけ | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`user-block-page-link`が通る | #3399 |
| 定義の頭に版が無い時と知らない版 (`blocks 2`) の時、行と列と日英の誤りの文を返し、図を描かない | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`user-block-rejects-unknown-format`が通る | #3399 |
| path に path の文法の外の字 (`<`、`url(`、`javascript:`) がある時、定義に知らない鍵 (`script`、`href`) がある時、色に役の名前の外の値がある時、行と列と日英の誤りの文を返して断る | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`user-block-rejects-non-data`が通る | #3399 |
| `+`で始まらない名前の定義 (`block bridge`) と、定義していない`+`の語の行に、行と列と日英の誤りの文を返す | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`user-block-names-need-plus`が通る | #3399 |
| README の 4 つの考え方の節に「手元でブロックを足す口はまだ無く」 と英語の同じ文が無く、足し方の節へのリンクが在り、package の README の足し方の節が定義と`+`の行の例を持つ | `pnpm exec vitest run packages/dragon/test/readme-idea.test.ts`の検査`readme-idea-links-block-extension`が通る | #3399 |
| 今の見本の`.dragon`の file は全て、誤り無く読める | `pnpm exec vitest run packages/dragon/test/notation.test.ts`の検査`every-dragon-file-parses`が通る | #3399 |
| CCIP の見本の記法は、今と同じ JSON になる | `pnpm exec vitest run packages/dragon/test/notation.test.ts`の検査`notation-compiles-ccip-to-json`が通る | #3399 |
| 原本の形の検査の関数は、原本の形の定義と一致する | `pnpm exec vitest run packages/dragon/test/schema.test.ts`の検査`validator-matches-schema`が通る | #3399 |
