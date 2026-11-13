# cycle-diagram

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `cycle`で始まる原本の JSON を形の検査が受け付ける | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`schema-accepts-cycle-diagram`が通る | #3623 |
| `cycle`で始まる記法を読んで書き戻すと、同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`cycle-roundtrip-keeps-notation`が通る | #3623 |
| 回り続ける図を描くと、`box`を書いた順に真上から右回りに輪の上へ手順を置く | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`cycle-boxes-go-clockwise-from-top`が通る | #3623 |
| 段の中に輪の次の手順への線`<id> -> <id> [tag: <字>]`を書くと、その段で札が弧に沿って次の手順へ走り、走った弧は光ったまま残る | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`cycle-tag-runs-along-the-arc`が通る | #3623 |
| `strip`の欄を段の中の`set`で書くと、輪の真ん中にその段の欄の値を出す | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`cycle-centre-shows-strip-values`が通る | #3623 |
| 輪の次の手順でない手順への線 (1つ飛ばす線、逆回りの線) を書くと、読む時に日本語と英語の誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`cycle-rejects-a-line-that-skips-a-step`が通る | #3623 |
| 手順が2つより少ないか8つより多い回り続ける図は、読む時に誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`cycle-rejects-too-few-or-too-many-steps`が通る | #3623 |
| 軽い入口 (`@cardenelabs/dragon/light`) で`loadFor`を待った後、回り続ける図を読んで描ける | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`cycle-light-entry-draws-after-load-for`が通る | #3623 |
| 使い方の頁と`README.md`と`packages/dragon/README.md`と`packages/dragon/examples/quick-start.md`と`packages/dragon/examples/quick-start.en.md`に、回り続ける図の書き方の節が在る | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`cycle-docs-describe-the-notation`が通る | #3623 |
| ほかの種類の図では、`cycle`を箱の名札として読める | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts`の検査`notation-keeps-cycle-words-plain-outside-cycle`が通る | #3623 |
| カタログの12種類のどれも見本を4枚以上載せる | `pnpm exec vitest run apps/playground-spa/src/lib/kind-examples.test.ts`の検査`every-kind-has-four-examples`が通る | #3623 |
| 回り続ける図の見本6枚 (`eth-slot`、`sprint`、`pdca`、`restake`、`focus-clock`、`farm-year`) が日本語と英語の記法を持ち、英語版の形が日本語版と同じ | `pnpm exec vitest run apps/playground-spa/src/lib/cycle-examples.test.ts --reporter=verbose`の検査`cycle-has-six-examples-in-both-langs`が通る | #3623 #3638 #3639 |
| 回り続ける図の見本は一般の題 (`sprint`、`pdca`、`focus-clock`、`farm-year`) を4枚とWeb3の題 (`eth-slot`、`restake`) を2枚持つ | `pnpm exec vitest run apps/playground-spa/src/lib/cycle-examples.test.ts`の検査`cycle-examples-cover-general-and-web3`が通る | #3623 #3638 #3639 |
| 回り続ける図の見本4枚の日本語と英語で、`dragon check --layout`の崩れが0件 | `pnpm exec vitest run apps/playground-spa/src/lib/cycle-examples.test.ts`の検査`cycle-examples-have-no-breaks`が通る | #3623 |
| 編集画面の棚に回り続ける図の書き始めの雛形が在り、雛形の記法を誤り無く読める | `pnpm exec vitest run apps/playground-spa/src/lib/cycle-examples.test.ts`の検査`cycle-shelf-template-reads`が通る | #3623 |
| 見本帳が最初に読む script と CSS は gzip で184KB以下のまま | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts --reporter=verbose`の検査`page-bundle-within-budget`が通る | #3623 #3638 |
| 描き方の file は色と字の大きさを値の表から読む | `pnpm exec vitest run packages/dragon/test/look.test.ts --reporter=verbose`の検査`renderers-read-values-from-one-table`が通る | #3623 #3638 |
| 今ある見本の描いた結果の指紋は変わらず、足した見本の行だけが増える | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3623 |
| 回り続ける図の`shape: "clock"`と`turn: "left"`と、箱の`time`を持つ原本の JSON を、形の検査が受け付ける。`shape`の無い図の`turn`はその欄を指して断る | `pnpm exec vitest run packages/dragon/test/clock-look.test.ts --reporter=verbose`の検査`schema-accepts-clock-look`が通る | #3638 |
| `cycle <題> [shape: clock, turn: left]`の行と、`box <id> as <名前> [time: <長さ>]`の行を持つ記法を読んで書き戻すと、同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/clock-look.test.ts --reporter=verbose`の検査`clock-roundtrip-keeps-notation`が通る | #3638 |
| `[shape: clock]`の図を描くと、手順を12時から右回りに書いた順で弧に置き、弧の角度を手順の長さを1周の長さ (長さの合計) で割った割合にする。`turn: left`の図は左回りに置く | `pnpm exec vitest run packages/dragon/test/clock-look.test.ts --reporter=verbose`の検査`clock-arcs-follow-times`が通る | #3638 |
| 文字盤の目盛りの数字は、1、2、5に10の累乗を掛けた間隔で3個から6個置き、単位は箱に書いた中で一番大きい単位にする | `pnpm exec vitest run packages/dragon/test/clock-look.test.ts --reporter=verbose`の検査`clock-dial-numbers-at-nice-steps`が通る | #3638 |
| 段の中の線`<id> -> <id>`は、1本の針を前の段の向きから受ける手順の始まりの向きまで右回り (`turn: left`の図は左回り) に回し、受ける手順の弧を光らせる | `pnpm exec vitest run packages/dragon/test/clock-look.test.ts --reporter=verbose`の検査`clock-hand-turns-to-each-step`が通る | #3638 |
| 線の`[tag: <字>]`の札は、その段で針の先に乗って針と一緒に回る | `pnpm exec vitest run packages/dragon/test/clock-look.test.ts --reporter=verbose`の検査`clock-tag-rides-the-hand`が通る | #3638 |
| 段の番号が弧に入らない短い手順は、番号と名前を文字盤の外へ短い線で引き出し、ほかの番号と名前に重ならない | `pnpm exec vitest run packages/dragon/test/clock-look.test.ts --reporter=verbose`の検査`clock-short-step-leads-labels-out`が通る | #3638 |
| 文字盤の真ん中に帯の値を出し、`set`の行で値が変わる | `pnpm exec vitest run packages/dragon/test/clock-look.test.ts --reporter=verbose`の検査`clock-centre-shows-strip-values`が通る | #3638 |
| `[shape: clock]`の無い図の`time`と`turn`、文字盤の見た目で`time`の無い箱、`clock`でない`shape`、`left`でない`turn`、0か数でないか単位の無い`time`、回り続ける図の外の`time`と`turn`は、読む時に日本語と英語の誤りの文を返して図を作るのを拒む | `pnpm exec vitest run packages/dragon/test/clock-look.test.ts --reporter=verbose`の検査`clock-rejects-misused-words`が通る | #3638 |
| 携帯の幅 (390) では、文字盤を幅いっぱいに描き、手順の番号と名前と長さを文字盤の下の一覧に並べる | `pnpm exec vitest run packages/dragon/test/clock-look.test.ts --reporter=verbose`の検査`clock-stacks-list-below-at-phone-width`が通る | #3638 |
| 見本帳に`[shape: clock]`の見本`focus-clock`が日本語と英語で1枚ずつ在り、`dragon check --layout`の崩れが0件 | `pnpm exec vitest run packages/dragon/test/clock-look.test.ts --reporter=verbose`の検査`clock-examples-in-both-langs-have-no-breaks`が通る | #3638 |
| 編集画面の棚に`[shape: clock]`の書き始めの雛形が在り、雛形の記法を誤り無く読める | `pnpm exec vitest run packages/dragon/test/clock-look.test.ts --reporter=verbose`の検査`clock-shelf-template-reads`が通る | #3638 |
| 軽い入口 (`@cardenelabs/dragon/light`) で`loadFor`を待った後、`[shape: clock]`の図を読んで描ける | `pnpm exec vitest run packages/dragon/test/clock-look.test.ts --reporter=verbose`の検査`clock-light-entry-draws-after-load-for`が通る | #3638 |
| 使い方の頁と`packages/dragon/README.md`と`packages/dragon/README.ja.md`と`packages/dragon/examples/quick-start.md`と`packages/dragon/examples/quick-start.en.md`に、`[shape: clock]`と`time`と`turn`の書き方が在る | `pnpm exec vitest run packages/dragon/test/clock-look.test.ts --reporter=verbose`の検査`clock-docs-describe-the-look`が通る | #3638 |
| `time`を書かない今の回り続ける図は、手順を真上から右回りに輪の上へ置く | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts --reporter=verbose`の検査`cycle-boxes-go-clockwise-from-top`が通る | #3638 |
| 今の回り続ける図の記法を読んで書き戻すと、同じ記法に戻る | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts --reporter=verbose`の検査`cycle-roundtrip-keeps-notation`が通る | #3638 |
| 輪の見た目の線の札は、今どおり弧の上を走る | `pnpm exec vitest run packages/dragon/test/cycle-diagram.test.ts --reporter=verbose`の検査`cycle-tag-runs-along-the-arc`が通る | #3638 |
| `examples/`の今ある見本の描いた結果の指紋は変わらず、足した見本の行だけが増える | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts --reporter=verbose`の検査`examples-svg-unchanged`が通る | #3638 |
