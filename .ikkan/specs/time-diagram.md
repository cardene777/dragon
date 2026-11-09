# time-diagram

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `kind` が `time` の原本の JSON を JSON Schema で検査した時、目盛り (`scale`)、区切り (`period`)、印の列 (`rows`)、節目 (`points`)、拡大の範囲 (`zoom`) を種類の欄 `time` に持ち、段の中に針を進める出来事 (`now`)、印の色を変える出来事 (`mark`)、範囲の括弧と囲み (`span`) を持つ図は通る。区切りと拡大の帯の箱を持たない時間軸の図も通る | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`schema-accepts-time-diagram`が通る | #3165 |
| `time` の欄か `now`、`mark`、`span` の出来事を時間軸の図でない図に書いた時、時間軸の図に `git`、`state`、`sequence` の欄を書いた時、単位の長さに数と単位 (`ms`、`s`、`min`、`h`、`d`) の組でない字を書いた時、検査が落ちて誤った欄の場所を JSON Pointer で示す。英語を渡した時の誤りの文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`schema-rejects-misplaced-time-fields`が通る | #3165 |
| schema が使う決まりのどれにも、日本語と英語の誤りの文がある | `pnpm test`の検査`every-schema-keyword-has-messages`が通る | #3165 |
| `packages/dragon/examples/finality.dragon` と `withdraw.dragon` を `parseNotation` が読んだ時、同じ名前の JSON と同じ JSON を返す。英語版の `.en.dragon` と `.en.json` も同じ | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`notation-compiles-time-examples-to-json`が通る | #3165 |
| 時間軸の図の記法に、宣言していない列への `mark`、宣言していない節目への `note`、目盛りの数を超える範囲か時刻、前の時刻より戻る `now`、拡大の範囲の外の列を選ぶ `[at: ]`、`zoom` の無い図の `[at: ]`、既にある名札と同じ名札の節目、最初の `step` より前の `now` か `mark` か `span` のどれかがある時、行と列を示した誤りで止まる。英語の文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`notation-rejects-misused-time-lines`が通る | #3165 |
| 時系列図、構成図、状態遷移図、枝分かれの図の記法で `scale`、`period`、`row`、`point`、`zoom`、`mark`、`span` の行か、中身の帯の欄の `[meter: ]` を書いた時、その行は時間軸の図でしか書けないと示す誤りで止まる | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`notation-limits-time-lines-to-time`が通る | #3165 |
| 時系列図、構成図、状態遷移図、枝分かれの図の記法では、`now` を名札にした箱どうしの線を今どおり読む | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`notation-keeps-now-plain-outside-time`が通る | #3165 |
| ブロックの確定と引き出しの図を記法、JSON、記法、JSON の順に往復した時、最初と最後の JSON が一致する | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`time-roundtrip-keeps-json-identical`が通る | #3165 |
| OAuth と CCIP の往復で、最初と最後の JSON が一致する | `pnpm test`の検査`roundtrip-keeps-json-identical`が通る | #3165 |
| 原本の JSON から並べた時、目盛りを軸に等間隔で並べ、列を宣言した順に上から並べ、区切りの境ごとに区切りの名前と番号 (`epoch 100`) とその区切りの目盛りの番号の範囲を置く。`empty` に書いた目盛りの印は空きの印になる | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`time-axis-places-units-evenly`が通る | #3165 |
| 目盛りの時刻の字は区切りの境ごとに単位の長さから計算し、軸全体の長さで選んだ 1 つの単位 (秒、分、時間、日) で出す。ブロックの確定は日本語で `0分`、`6.4分`、`12.8分`、`19.2分` (#3517で数と単位の間の空白を外した)、英語で `0 min`、`6.4 min`、`12.8 min`、`19.2 min` になり、引き出しは日の単位で出る | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`time-axis-labels-follow-language`が通る | #3165 |
| `now -> <目盛り>` の段で、針は前の時刻から目盛り 1 つを値の表の決まった秒数で進み、針が過ぎた目盛りの印がその時に出る。拡大した目盛りでは、その列の線が届くまで針が待つ。段の長さは針の進みと段の中の行から決まり、書き手は秒数を書かない | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`time-needle-sweeps-at-fixed-speed`が通る | #3165 |
| `zoom <範囲>` の目盛りごとに拡大の帯に列を作り、宣言した箱をどの列にも同じ並びで置き、列の上にその目盛りの番号と時刻を出す。線は `[at: <目盛り>]` の列の箱どうしを結び、`[into: <目盛り>]` を書くと受ける箱をその列から選ぶ (原本の JSON の線の `to` は受ける箱を指すため、受ける列は `into` と呼ぶ)。印の列と同じ名札の箱は、その列が空きにした目盛りの列で空きの枠になる。軸の上の拡大した範囲を枠で囲み、拡大の帯へ点線でつなぐ | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`time-zoom-repeats-boxes-per-column`が通る | #3165 |
| 節目は、置いた目盛りの印の下に旗の丸と名札で置き、`note` の字で状態を出し、`[color: ]` を付けた `note` を書いた段で丸の色が変わる。節目どうしの線 (`C100 -> C101: <名前>`) は 2 つの丸の間に引き、名前を線の下に置く | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`time-points-show-states`が通る | #3165 |
| `span <範囲>: <字>` は軸の下に範囲の括弧と字を出し、次に括弧を書いた段まで残す。`[shape: box]` を付けると印の列の範囲を囲み、字を縁の札にして最後の段まで残す | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`time-span-draws-bracket-and-box`が通る | #3165 |
| `mark <列> <範囲> [color: <色>]` を書いた段で、その列の範囲の印がその色に変わる。ブロックの確定では、段 8 でブロック 0 が、段 9 でブロック 1 から 32 が緑になる | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`time-mark-recolors-marks`が通る | #3165 |
| 中身の帯の欄に `[meter: <割合>]` を付けると物差しになり、その割合の所に線を引き、`set <欄>: <割合>` を書いた段で値まで針と一緒に満ち、区切りが替わると 0 から満ち直す | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`strip-meter-fills-with-needle`が通る | #3165 |
| ブロックの確定の図を原本の JSON から描いた時、試作 (`docs/design/base/scenes/finality.js`) と同じ題の 10 段が順に動き、針は段 1 から段 3 で拡大した 4 列を進み、段 5、段 7、段 9 でそれぞれ 1 つの区切りの 32 目盛りを進み、段 8 で C100 が、段 9 で C101 が確定の色になる | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`finality-renders-10-steps`が通る | #3165 |
| 引き出しの図を原本の JSON から描いた時、日の目盛りの軸の上で、7 日の挑戦の期間を囲みで示し、針が 7 日を進んだ段の後に引き出しの節目が出る | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`withdraw-renders-day-axis`が通る | #3165 |
| ブロックの確定と引き出しの図を 0.25 秒ごとに止めて数えた時、線の名前が同時に見える数は 2 個以下で、段の番号はその段が始まるまで出ない | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`time-keeps-motion-rules`が通る | #3165 |
| 見せ方を書かない時間軸の図を幅 728 の枠で開いた時、全体を止めて中だけを動かす見せ方 (`fixed`) になる | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`time-opens-fixed`が通る | #3165 |
| 時系列図、構成図、状態遷移図、枝分かれの図の描き方は今どおりで、OAuth は 12 段、CCIP は 13 段、rebase は 11 段が順に動き、箱どうしと線の名前と箱が 10px 以上離れる | `pnpm test`の検査`oauth-renders-12-steps`と`ccip-renders-13-steps`と`rebase-renders-11-steps`と`layout-keeps-10px-gap`が通る | #3165 |
| 時間軸の図の描画も、色、字、余白、動きの値を共通の値の表からだけ読み、描画の file に色の値と字の大きさを直接書かない | `pnpm test`の検査`renderers-read-values-from-one-table`が通る | #3165 |
| `dragon export` は図の種類に関わらず同じ処理で mp4、GIF、HTML、PNG の 4 つを書き出し、同じ JSON を 2 回書き出した PNG がバイト単位で一致する。ブロックの確定の図は書き出した HTML で全ての段を送れる | `pnpm exec vitest run packages/dragon/test/export.test.ts`の検査`export-writes-four-formats`と`export-is-deterministic`と`html-export-draws-every-kind`が通る | #3165 |
| `packages/dragon/examples` にブロックの確定と引き出しの日本語と英語の記法と JSON の 8 つの file があり、英語版の列と節目と段と段ごとの出来事の数が日本語版と同じ | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`time-example-files-match`が通る | #3165 |
| repo の全ての `.dragon` の file を `parseNotation` が誤り無く読む | `pnpm test`の検査`every-dragon-file-parses`が通る | #3165 |
| 見本帳と編集画面に載せた全ての見本で、どの段でも字が重ならず、運ぶ物が箱と字に掛からない | `pnpm test`の検査`overlaps-none-in-every-example`と`carriers-clear-in-every-example`が通る | #3165 |
| 中身の帯の頁の時間軸の図は物差しを使う | `pnpm exec vitest run apps/playground-spa/src/lib/catalog-parts.test.ts`の検査`strip-time-figure-uses-meter`が通る | #3165 |
| 記法の全ての語をどれかの部品が受け持ち、部品の図の記法がその部品の語を使う | `pnpm test`の検査`catalog-parts-cover-every-word`と`catalog-part-snippets-use-their-words`が通る | #3165 #3562 |
| 型の検査、build、lint と、既存の検査の全てが通る | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'`が終了 0 | #3165 |
| 幅 360px で `finality` の、針を動かさない段を開いた時、その段で札が変わる節目のうち番号の丸に近い節目が窓の中に在る | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`time-follows-events-when-needle-stops`が通る | #3284 |
| 全体を枠に収めた字が 10.5px を下回る狭い枠で時間軸の図を開いた時、寄って見せる見せ方 (`follow`) になり、針を動かす段の終わりでは針が見ている窓の中にあり、どの段の終わりでも印の列が窓の中にある | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`time-follows-needle-when-narrow`が通る | #3165、#3284 |
| 時間軸の図でない図の寄って追う窓は今のまま | `pnpm exec vitest run packages/dragon/test/follow-badge.test.ts`の検査`follow-window-shows-step-badge`が通る | #3284 |
| 見本`finality`を日本語と英語で描いた時、段3、段9、段10の止め絵で、針の頭と終わりの点と全ての目盛りの字が、時間軸の囲みの枠の線から4px以上内側に収まる | `pnpm exec vitest run packages/dragon/test/time-axis-inside.test.ts`の検査`time-axis-needle-inside-panel`が通る | #3527 |
| 見本`withdraw`を日本語と英語で描いた時、段4の止め絵で、右端の目盛りの字 (「10 日」と「10 d」) と最後の目盛りの線が、時間軸の囲みの枠の線から4px以上内側に収まる | `pnpm exec vitest run packages/dragon/test/time-axis-inside.test.ts`の検査`time-axis-last-tick-inside-panel`が通る | #3527 |
| 時間軸の節目の字が囲みの枠を越える図に`dragon check --layout`を打つと、字が見え始める段の`step`の行を名指し、段の番号とその字と時間軸の囲みを名指す`warning`の行を出し、終わり方は0 | `pnpm exec vitest run packages/dragon/test/time-axis-inside.test.ts`の検査`layout-check-finds-time-text-on-panel-edge`が通る | #3527 |
| 針か時刻の目盛りの線が時間軸の囲みの枠を越えるか、枠の線から4px未満に近づく時、崩れの知らせは針か目盛りの線と時間軸の囲みを名指し、続く段の同じ崩れを最初に見える段の1件にまとめる | `pnpm exec vitest run packages/dragon/test/time-axis-inside.test.ts`の検査`layout-check-names-needle-and-ticks`が通る | #3527 |
| 見本の崩れの一覧に`finality`と`withdraw`の新しい崩れが載らず、見本の崩れが一覧と合う | `pnpm exec vitest run packages/dragon/test/layout-check.test.ts`の検査`layout-check-examples-match-recorded`が通る | #3527 |
| 時間軸の図の今の描き方 (10段の動き、目盛りの等間隔、時刻の字の言葉、日の目盛りの軸) を保つ | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`finality-renders-10-steps`と`time-axis-places-units-evenly`と`time-axis-labels-follow-language`と`withdraw-renders-day-axis`が通る | #3527 |
| 見本帳が最初に読む script に新しい崩れの種類の名前`panel-edge`が入らず、最初に読む量が上限に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`first-load-carries-no-layout-check`と`page-bundle-within-budget`が通る | #3527 |
| `kind`が`time`の原本のJSONをJSON Schemaで検査した時、種類の欄`time`に作業の宣言 (`tasks`、名札と名前と範囲と色) を持つ図は通り、印の列 (`rows`) が無くても作業があれば通る | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`schema-accepts-time-tasks`が通る | #3562 |
| 作業の欄を時間軸の図でない図に書いた時と、範囲に負の数か整数でない数を書いた時、検査が落ちて誤った欄の場所をJSON Pointerで示す。英語を渡した時の誤りの文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`schema-rejects-misplaced-tasks`が通る | #3562 |
| 最初の`step`より前に`task <名札> as <名前> <範囲> [color: <色>]`の行を書いた時、原本の`time.tasks`に書いた順に入る。範囲は`0-2`と`13`の2つの形で書ける | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`notation-reads-task-lines`が通る | #3562 |
| 時間軸の図の記法に、目盛りの数を超える範囲、終わりが始まりより前の範囲、既にある名札と同じ名札の`task`、最初の`step`より後の`task`のどれかがある時と、印の列も作業も1つも無い時は、行と列を示した誤りで止まる。英語の文は仮名と漢字を含まない | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`notation-rejects-misused-task-lines`が通る | #3562 |
| 時系列図、構成図、状態遷移図、枝分かれの図、木の図、列の図の記法で`task <名札> as <名前> <範囲>`の行を書いた時、その行は時間軸の図でしか書けないと示す誤りで止まる | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`notation-limits-task-to-time`が通る | #3562 |
| 時間軸の図でない図の記法では、`task`を名札にした箱どうしの線 (`task -> db`) を今どおり読む | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`notation-keeps-task-plain-outside-time`が通る | #3562 |
| 工程表の見本を記法、JSON、記法、JSONの順に往復した時、最初と最後のJSONが一致する | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`task-roundtrip-keeps-json-identical`が通る | #3562 |
| `task design as 設計 0-2 [color: blue]`を描いた時、作業が自分の行を持ち、行の左に「設計」、目盛り0から2の上に角の丸い続いた棒が1本描かれ、棒の中に期間の字が出る。期間の字が棒に収まらない時は棒の右に出る | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`task-draws-a-thick-bar-per-row`が通る | #3562 |
| 針が棒の上を通る段で、針までの分の棒が作業の色で濃く塗られ、まだ通らない分は薄い色のまま残る。針が棒の終わりを過ぎると棒の全てが濃い | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`task-fills-passed-part`が通る | #3562 |
| 1つの目盛りだけの`task`は、目盛り1つ分の幅の棒で描かれる | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`task-single-tick-draws-bar`が通る | #3562 |
| 印の列と作業を両方持つ図では、行を宣言した順に上から並べ、どの棒も印の列と目盛りの位置がそろう | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`task-and-row-keep-declared-order`が通る | #3562 |
| 工程表の見本`packages/dragon/examples/release-plan.dragon`を日本語と英語で、枠の幅を渡さない時と390を渡した時に描いた時、期間が重なる棒どうしが重ならず、`dragon check --layout`がどの段でも崩れを何も出さない | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`release-plan-passes-layout-check`が通る | #3562 |
| `packages/dragon/examples`に工程表の見本の日本語と英語の記法とJSONの4つのfileがあり、英語版の作業と段の数が日本語版と同じ | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`task-example-files-match`が通る | #3562 |
| 作業を持たない今の時間軸の図と、ほかの種類の見本の描いた形は変わらない | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3562 |
| 時間軸の図の針は今どおり決まった速さで進み、段の番号はその段が始まるまで出ない | `pnpm exec vitest run packages/dragon/test/time-diagram.test.ts`の検査`time-needle-sweeps-at-fixed-speed`と`time-keeps-motion-rules`が通る | #3562 |
| 作業の棒の描画も、色、字、余白、動きの値を共通の値の表からだけ読み、描画のfileに色の値と字の大きさを直接書かない | `pnpm test`の検査`renderers-read-values-from-one-table`が通る | #3562 |
| 軽い入口が作業を持つ時間軸の図を読んで描く | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-load-for-reads-every-later-example`と`light-entry-draws-same-svg`が通る | #3562 |
| repoの全ての`.dragon`のfileを`parseNotation`が誤り無く読み、見本帳と編集画面に載せた全ての見本で、どの段でも字が重ならない | `pnpm test`の検査`every-dragon-file-parses`と`overlaps-none-in-every-example`が通る | #3562 |
| 使い方の頁と`README.md`と`packages/dragon/README.md`と手引き (`packages/dragon/examples/quick-start.md`と`quick-start.en.md`) とAIのskillの`references/kinds/time.md`に`task`の行の書き方が載り、`CHANGELOG.md`と`CHANGELOG.ja.md`のUnreleasedのAddedに工程表の棒が載る | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`docs-describe-time-task`が通る | #3562 |
| 使い方の頁と`CHANGELOG.md`の前の形との対応表の頭の語が、読む部品の語と一致し、AIのskillの記法の囲みが全て読める | `pnpm test`の検査`skill-fences-parse`が通る | #3562 |
| 見本帳が最初に読むscriptとCSSが上限に収まる | `pnpm test`の検査`page-bundle-within-budget`が通る | #3562 |
| `release-plan`を描いた時、軸の字が左から`1日`、`5日`、`10日`、`14日`の順に出て、`0日`が出ない | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`task-axis-uses-bar-numbers`が通る | #3574 |
| 英語の`release-plan`を描いた時、軸の字が棒の字と同じ`Day 1`の形で出る | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`task-axis-speaks-bar-words`が通る | #3574 |
| `release-plan`を描いた時、軸の字の横の真ん中が、その番号の目盛りの真ん中と1px以内で揃う | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`task-axis-centers-on-its-tick`が通る | #3574 |
| `[from: 1]`を書かない`task`の図を描いた時、軸の字が0から始まり、棒の字の番号と同じになる | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`task-axis-follows-scale-from`が通る | #3574 |
| 60目盛りの`task`の図を描いた時、軸の字どうしが重ならず、`dragon check --layout`が何も出さない | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`task-axis-keeps-apart-on-many-ticks`が通る | #3574 |
| `release-plan`を描いた時、`dragon check --layout`が何も出さない | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`release-plan-passes-layout-check`が通る | #3574 |
| `task`の行を持たない見本のSVGが、`packages/dragon/test/fixtures/examples-svg.json`の記録と1字も変わらない | `pnpm exec vitest run packages/dragon/test/examples-svg.test.ts`の検査`examples-svg-unchanged`が通る | #3574 |
| `task`の行を持つ図の針が、作業の棒を通った分だけ濃く塗る | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`task-fills-passed-part`が通る | #3574 |
| `CHANGELOG.md`と`CHANGELOG.ja.md`の0.68.1の節に軸の字の変更が載る | `pnpm exec vitest run packages/dragon/test/time-task.test.ts`の検査`changelog-describes-task-axis`が通る | #3574 |
