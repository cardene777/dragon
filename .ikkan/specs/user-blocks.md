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
| 使い方の頁の「配管の図」 の節の次が「ブロックを足す」 の節で、日本語と英語の頁の本文が`blocks 1`、`block`、`base`、`shape`、`color`、`end`の書き方と、図で`+<名前>`と書くことを説明する | `pnpm exec vitest run apps/playground-spa/src/lib/site-pages.test.ts`の検査`docs-extend-section-follows-pipe`が通る | #3407 |
| 「ブロックを足す」 の節の例の file (日本語と英語) が記法として読め、元が箱 (`base box`)、線 (`base edge`)、印 (`base icon`) の足したブロックを 1 つずつ定義し、3 つとも図の中で使う | `pnpm exec vitest run apps/playground-spa/src/lib/site-pages.test.ts`の検査`docs-extend-example-uses-three-bases`が通る | #3407 |
| 使い方の頁を開いた時、「ブロックを足す」 の節の例の図が描かれ、足した箱の枠が定義に書いた`path`で描かれる | `pnpm exec vitest run apps/playground-spa/src/lib/site-pages.test.ts`の検査`docs-extend-example-draws-user-blocks`が通る | #3407 |
| 「ブロックを足す」 の節が、頁の`<link rel="dragon-blocks">`で定義の file を読む書き方と、`readBlocks`で読んだ定義を`parseNotation`の`blocks`に渡す書き方を code の枠で示す | `pnpm exec vitest run apps/playground-spa/src/lib/site-pages.test.ts`の検査`docs-extend-shows-shared-definitions`が通る | #3407 |
| 編集画面の棚の見本に、足したブロックを使う見本が構成図の束に在り、選ぶと書く欄にその記法が入って図が描かれる | `pnpm exec vitest run apps/playground-spa/src/lib/site-editor.test.ts`の検査`editor-shelf-has-user-blocks`が通る | #3407 |
| 使い方の頁の全ての節の例が記法として読め、行の頭の語が頁の言葉の語で書かれる | `pnpm exec vitest run apps/playground-spa/src/lib/site-pages.test.ts`の検査`docs-sections-cover-notation-and-examples-parse`が通る | #3407 |
| 見本帳が最初に読む script と CSS の合計が、gzip で 181KB 以下に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3407 |
| 軽い入口で種類を読む関数を待った後の`renderDiagram`の SVG が、`packages/dragon/examples`の全ての見本で既定の入口の SVG と同じ (絵柄集 Tabler の絵柄を描く見本は`loadFor`も待った後、#3489) | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-entry-draws-same-svg`が通る | #3407 |
| 箱を元にしたブロックの定義 (`block +bridge` から `end`) に `icon tabler:building-bridge-2` の行を書くと、そのブロックの箱 (`+bridge cc as CCIP`) の絵柄の枠に Tabler の石の橋の path が描かれる | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`box-block-icon-draws-on-box`が通る | #3489 |
| 定義の絵柄を持つブロックの箱の行に `[icon: key]` を書くと、行に書いた手描きの鍵の絵柄が描かれ、定義の絵柄は描かれない | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`box-line-icon-wins-over-block-icon`が通る | #3489 |
| 線と印を元にしたブロックの定義に `icon` の行を書くと、その行を指して箱を元にしたブロックだけが持てることを名指す誤りで止まる | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`block-icon-only-on-box-blocks`が通る | #3489 |
| 定義の `icon` に手描きの絵柄にも Tabler にも無い名前 (`tabler:no-such-icon`) を書くと、その行を指して近い名前を挙げる誤りで止まる | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`block-icon-unknown-name-refused`が通る | #3489 |
| 原本の JSON の `define` の定義に `icon` を書いた図は `validateDiagram` を通り、Tabler に無い名前は `/define/blocks/0/icon` を指して断られる | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`block-icon-passes-validator`が通る | #3489 |
| 定義の絵柄を持つ図を記法に書き戻して読み直すと、同じ原本の JSON になる | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`block-icon-round-trips`が通る | #3489 |
| `packages/dragon/blocks/bridge.dragon` の定義が `shape path` を持たずに `icon tabler:building-bridge-2` を持ち、共有の `+bridge` で描いた箱の縁がほかの箱と同じ角の丸み 12 の四角で描かれ、絵柄の枠に石の橋が描かれる | `pnpm exec vitest run packages/dragon/test/shared-blocks.test.ts`の検査`shared-bridge-is-card-with-icon`が通る | #3489 |
| 定義を書かずに共有の `+bridge` を使った図の原本の JSON の `define` が、色と絵柄を持ち path を持たない共有の定義を持ち、JSON だけを受け取って描いても石の橋の絵柄が描かれる | `pnpm exec vitest run packages/dragon/test/shared-blocks.test.ts`の検査`shared-block-used-without-definition`が通る | #3489 |
| 軽い入口で共有の `+bridge` を書いた記法を `loadFor` で待つと Tabler の表を読み、描いた SVG が既定の入口の SVG と同じになる | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-draws-shared-block`が通る | #3489 |
| 軽い入口で、定義に `icon tabler:<名前>` の行を持つ記法を `loadFor` で待つと Tabler の表を読む | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-loads-tabler-for-block-icon`が通る | #3489 |
| 軽い入口で `loadFor` を待たずに共有の `+bridge` の図を描くと、`loadFor` を待つよう告げる誤りで止まり、SVG を返さない | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-refuses-block-icon-before-load`が通る | #3489 |
| script の 1 行の入口で共有の `+bridge` の塊を描くと、箱の絵柄の枠に石の橋が描かれる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-draws-shared-block`が通る | #3489 |
| `packages/dragon/examples/bridge.dragon` と `bridge.en.dragon` と `packages/dragon/blocks/examples/bridge.dragon` の橋の箱に石の橋の絵柄が描かれる | `pnpm exec vitest run packages/dragon/test/shared-blocks.test.ts`の検査`bridge-examples-draw-bridge-icon`が通る | #3489 |
| `packages/dragon/test/fixtures/layout-breaks.json` から橋の見本 3 件の崩れ 6 件 (`slot-outside-shape` と `text-outside-shape`) が消え、全ての見本の崩れが記録と合う | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-examples-match-recorded`が通る | #3489 |
| 背景のブリッジの図と同じ記法を共有の `+bridge` で描いて `dragon check --layout` を打つと、`slot-outside-shape` と `text-outside-shape` と `badge-off-shape` が 0 件 | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-shared-bridge-has-no-shape-breaks`が通る | #3489 |
| skill の参照 `plugins/dragon/skills/dragon/references/blocks.md` が、箱を元にしたブロックの定義に `icon` の行を書けることと、共有の `+bridge` が石の橋の絵柄を持つ角丸の箱であることを書く | `pnpm exec vitest run packages/dragon/test/notation-skill.test.ts`の検査`skill-blocks-names-block-icon`が通る | #3489 |
| #3484 の崩れの検査が、背景のブリッジの図をアーチの path の箱で描いた #3520 の前の姿で、浮く丸とはみ出す枠と字を今どおり 1 件ずつ見つける | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-finds-badge-off-shape`と`layout-check-finds-slot-outside-shape`と`layout-check-finds-text-outside-shape`が通る | #3489 |
| 図の頭に書いた同じ名前の定義は共有の定義に勝つ | `pnpm exec vitest run packages/dragon/test/shared-blocks.test.ts`の検査`local-definition-wins-over-shared`が通る | #3489 |
| 箱を元にしたブロックの定義に書いた path の形と、足した印のブロックの path は今どおり描かれる | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`user-box-block-draws-its-path`と`user-icon-block-draws-on-box`が通る | #3489 |
| 見本帳が最初に読む script と CSS の合計が、今の上限に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3489 |
| script の 1 行の入口 (CDN) が時系列図 1 つの頁でその図を描くまでに読む script の合計が、gzip で 90,000 byte 以下に収まる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-within-budget`が通る | #3489 |
| 評価でAIが書いた支払いの図 (六角形の`+oracle`の箱を持つ) に`dragon check --layout`を掛けると、形からはみ出す崩れ (`text-outside-shape`と`slot-outside-shape`) と段の番号が浮く崩れ (`badge-off-shape`) が0件 | `pnpm exec vitest run packages/dragon/test/shaped-box-fit.test.ts`の検査`shaped-box-eval-payment-fits`が通る | #3520 |
| 評価でAIが書いた橋の図 (アーチの`shape path`の箱を持つ) に`dragon check --layout`を掛けると、形からはみ出す崩れと段の番号が浮く崩れが0件 | `pnpm exec vitest run packages/dragon/test/shaped-box-fit.test.ts`の検査`shaped-box-eval-bridge-fits`が通る | #3520 |
| 評価でAIが書いた、扇形の`shape path`の箱を3つ並べた図に`dragon check --layout`を掛けると、形からはみ出す崩れと段の番号が浮く崩れが0件 | `pnpm exec vitest run packages/dragon/test/shaped-box-fit.test.ts`の検査`shaped-box-eval-pie-fits`が通る | #3520 |
| `diamond`、`hexagon`、`circle`、`cylinder`の各形の箱に長い名前と添え書きと運ぶ物を付けた構成図と状態遷移図と木の図と時系列図とgitの図に`dragon check --layout`を掛けると、形からはみ出す崩れと段の番号が浮く崩れが0件 | `pnpm exec vitest run packages/dragon/test/shaped-box-fit.test.ts`の検査`shaped-box-basic-shapes-fit`が通る | #3520 |
| 形を持つ箱の名前と添え書きと運ぶ物の枠が元の大きさの形に収まらない時、箱の幅か高さを元の箱より大きくする | `pnpm exec vitest run packages/dragon/test/shaped-box-fit.test.ts`の検査`shaped-box-grows-when-text-does-not-fit`が通る | #3520 |
| 形を持つ箱の名前と添え書きと運ぶ物の枠が元の大きさの形に収まる時、箱は形を持たない箱と同じ大きさと置き場所で描く | `pnpm exec vitest run packages/dragon/test/shaped-box-fit.test.ts`の検査`shaped-box-keeps-size-when-text-fits`が通る | #3520 |
| 線の無い段 (`act`だけの段など) の番号を形を持つ箱に付ける時、番号の丸の真ん中を形の縁の上に置く | `pnpm exec vitest run packages/dragon/test/shaped-box-fit.test.ts`の検査`shaped-box-corner-badge-on-outline`が通る | #3520 |
| 箱を元にしたブロックの`shape path`の形は、形を囲む最も小さい四角を箱の枠いっぱいに伸ばして描き、`path`の字はそのままSVGに出す | `pnpm exec vitest run packages/dragon/test/shaped-box-fit.test.ts`の検査`shaped-box-path-fills-frame`が通る | #3520 |
| 見本の崩れの一覧`packages/dragon/test/fixtures/layout-breaks.json`に形からはみ出す崩れと段の番号が浮く崩れの行が無く、全ての見本の崩れが一覧と合う | `pnpm exec vitest run packages/dragon/test/shaped-box-fit.test.ts`の検査`layout-breaks-record-has-no-shape-rows`と、`pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-examples-match-recorded`が通る | #3520 |
| 崩れの検査は、形からはみ出す字と運ぶ物の枠と、形から浮く段の番号を今どおり1件ずつ見つけ、続く段の同じ崩れを最初の段の1件にまとめる | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-finds-badge-off-shape`と`layout-check-finds-slot-outside-shape`と`layout-check-finds-text-outside-shape`と`layout-check-merges-repeated-steps`と`layout-check-line-names-step-and-parts`が通る | #3520 |
| 形を持たない箱だけの見本と検査の記法と見本帳の部品の図は、SVGと置き場所と時刻が今と同じ | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3520 |
| 足した箱の`path`の形と基本の形の名前の形を今どおり描き、共有の`+bridge`の図は形の崩れを出さない | `pnpm exec vitest run packages/dragon/test/user-blocks.test.ts`の検査`user-box-block-draws-its-path`と`user-block-basic-shapes`と、`pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-shared-bridge-has-no-shape-breaks`が通る | #3520 |
