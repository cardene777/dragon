# mind-diagram

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `mind`で始まる原本の JSON を形の検査が受け付ける | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`schema-accepts-mind-diagram`が通る | #3619 |
| `mind`で始まる記法を読んで書き戻すと、同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`mind-roundtrip-keeps-notation`が通る | #3619 |
| 段の中に`idea <id> as <名前> of <親>`を書くと、その段でその考えが現れ、親からの枝の線が引かれていく | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`mind-idea-appears-at-its-step`が通る | #3619 |
| `of`の無い`idea`を真ん中の題に置き、題の子の枝を左右に分けて四方へ曲線で伸ばし、孫を子の外側に置く | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`mind-branches-spread-four-ways`が通る | #3619 |
| 枝の考えに書いた色をその枝の線と孫の枠に引き継ぎ、色の無い枝には書いた順に色を割り当てる | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`mind-branch-color-flows-to-leaves`が通る | #3619 |
| 無い親を指す`idea`を書くと、読む時に日本語と英語の誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`mind-rejects-an-idea-with-a-missing-parent`が通る | #3619 |
| `of`の無い`idea`が2つ以上か1つも無い図は、読む時に誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`mind-rejects-other-than-one-centre`が通る | #3619 |
| 真ん中の題から数えて4段目より深い考えを書くと、読む時に誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`mind-rejects-ideas-deeper-than-three-levels`が通る | #3619 |
| 軽い入口 (`@cardenelabs/dragon/light`) で`loadFor`を待った後、考えを広げる地図を読んで描ける | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-entry-draws-each-later-kind-after-load-for`が通る | #3619 |
| 使い方の頁と`packages/dragon/examples/quick-start.md`と`packages/dragon/examples/quick-start.en.md`に、考えを広げる地図の書き方の節が在る | `pnpm exec vitest run packages/dragon/test/kind-playground.test.ts`の検査`mind-docs-describe-the-notation`が通る | #3619 #3881 |
| ほかの種類の図では、`idea`を箱の名札として読める | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`notation-keeps-mind-words-plain-outside-mind`が通る | #3619 |
| カタログの種類が考えを広げる地図の分だけ1つ増え、どの種類も見本を4枚以上載せる | `pnpm exec vitest run apps/playground-spa/src/lib/kind-examples.test.ts`の検査`every-kind-has-four-examples`が通る | #3619 |
| 考えを広げる地図の見本4枚 (`budget-app`、`trip-plan`、`dao-proposal`、`wallet-ux`) が日本語と英語の記法を持ち、英語版の形が日本語版と同じ | `pnpm exec vitest run apps/playground-spa/src/lib/mind-examples.test.ts`の検査`mind-has-four-examples-in-both-langs`が通る | #3619 |
| 考えを広げる地図の見本は一般の題 (`budget-app`、`trip-plan`) とWeb3の題 (`dao-proposal`、`wallet-ux`) を2枚ずつ持つ | `pnpm exec vitest run apps/playground-spa/src/lib/mind-examples.test.ts`の検査`mind-examples-cover-general-and-web3`が通る | #3619 |
| 考えを広げる地図の見本4枚の日本語と英語で、`dragon check --layout`の崩れが0件 | `pnpm exec vitest run apps/playground-spa/src/lib/mind-examples.test.ts`の検査`mind-examples-have-no-breaks`が通る | #3619 |
| 編集画面の棚に考えを広げる地図の書き始めの雛形が在り、雛形の記法を誤り無く読める | `pnpm exec vitest run apps/playground-spa/src/lib/mind-examples.test.ts`の検査`mind-shelf-template-reads`が通る | #3619 |
| 見本帳が最初に読む script と CSS は gzip で184KB以下のまま | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3619 |
| 描き方の file は色と字の大きさを値の表から読む | `pnpm exec vitest run packages/dragon/test/look.test.ts`の検査`renderers-read-values-from-one-table`が通る | #3619 |
| 今ある見本の描いた結果の指紋は変わらず、足した見本の行だけが増える | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3619 |
| 1つの親から同じ側の子へ向かう線は、題から枝も枝から葉も、親の箱の縁の高さの真ん中の1点から出る | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`mind-links-leave-parent-from-one-point`が通る | #3960 |
| 親の縁から出た幹は、親の縁から子の縁までの35%の所で終わり、子への曲線は全て幹の先の1点から出て子の縁へ入る | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`mind-trunk-splits-at-one-fork`が通る | #3960 |
| 幹は子を持つ親ごと左右ごとに1本だけ親の色で描き、子への曲線は今どおり子の色で描く。題から枝への幹は題の色になる | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`mind-trunk-drawn-once-in-parent-color`が通る | #3960 |
| 子を持たない考え (葉と、葉の無い枝) からは幹を描かない | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`mind-no-trunk-without-children`が通る | #3960 |
| 幹は最初の子が現れる段で親の側から引かれ、その段より前は薄く出し、後の子が現れる段では引き直さない | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`mind-trunk-drawn-with-first-child`が通る | #3960 |
| 葉が6枚の枝を持つ図の日本語と英語で、`dragon check --layout`の崩れが0件 | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`mind-six-leaves-have-no-breaks`が通る | #3960 |
| 見本帳の考えを広げる地図の見本4枚の日本語と英語で、子を持つ考えごとに幹が描かれる | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`mind-examples-draw-trunks`が通る | #3960 |
| 段の中に書いた考えは今どおりその段で現れ、親からの線 (`data-mind-link`) はその段で引かれていく | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`mind-idea-appears-at-its-step`が通る | #3960 |
| 題の子の枝を今どおり左右に分けて四方へ置き、題から枝と枝から葉の線は曲線を持つ | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`mind-branches-spread-four-ways`が通る | #3960 |
| 枝の色は今どおりその枝の線と葉の枠と葉への線に引き継がれる | `pnpm exec vitest run packages/dragon/test/mind-diagram.test.ts`の検査`mind-branch-color-flows-to-leaves`が通る | #3960 |
| 考えを広げる地図の見本4枚の日本語と英語で、`dragon check --layout`の崩れは今どおり0件 | `pnpm exec vitest run apps/playground-spa/src/lib/mind-examples.test.ts`の検査`mind-examples-have-no-breaks`が通る | #3960 |
| ほかの種類の図で同じ所から出て重なって走り先で分かれる線は、今どおり崩れとして知らせる | `pnpm exec vitest run packages/dragon/test/git-branch-lines.test.ts`の検査`layout-check-names-overlapping-branch-lines`が通る | #3960 |
| 見本の崩れは、記録した一覧に無い物が増えない | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-examples-match-recorded`が通る | #3960 |
