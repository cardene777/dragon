# 外した検査と、速くした検査 (#3381)

検査を 1 件 10 秒、1 回の実行 5 分に収めるために、要らない検査を外し、重い検査は同じ守りのまま軽くした。
外した検査は、下の表に理由と、同じ守りを担う残りの検査の名前を残す。
`packages/dragon/test/test-policy.test.ts` の `removed-tests-are-gone-and-covered` が、外した検査が検査の file に無いことと、守りを担う検査が在ることを確かめる。

## 頁を開く検査を全て外した (#3585)

見本帳の頁を本物の `Chromium` で開く検査を全て外した。
本人が2026-11-09に、意味が無いので要らないと決めた。
見た目は本人の目で見て決めるので、機械が頁を開いて確かめる価値が低いためである。
この検査は検査時間の合計の約7割を占め、機械が混むと1件10秒の上限で公開前の一式を止めていた。

同じ守りを担う検査は置かない。
頁を開かない検査は残した (build の結果の中身、文書の例、部品の表、字の file)。
書き出しの命令と script の1行の入口は `Chromium` を使う機能なので、`packages/dragon/test/` の検査を残した。

## 外した検査

外したのは次の 3 つのどれかに当たる検査だけ。

- 同じことを別の検査が確かめている
- 守っていた仕組みがもう無い
- 図の種類ごとに同じ確かめを繰り返している

| 外した検査 | 在った file | 理由 | 同じ守りを担う検査 |
|---|---|---|---|
| `stall-probe-live-page` | `apps/playground-spa/src/lib/stall-probe.test.ts` | 頁が止まった時の記録の仕組みを外した。頁の通信は手元の server を通さずに返すので (#3379)、記録が追っていた通信の切断はもう起きない | `test-over-limit-is-stopped-and-named` |
| `stall-probe-blocked-page` | `apps/playground-spa/src/lib/stall-probe.test.ts` | 同じく、止まった頁の記録の仕組みを外した | `test-over-limit-is-stopped-and-named` |
| `stall-record-on-failed-test` | `apps/playground-spa/src/lib/stall-probe.test.ts` | 同じく、止まった頁の記録の仕組みを外した。落ちた検査の名前は上限で止めた時に出る | `test-over-limit-is-stopped-and-named` |
| `stall-record-silent-on-passed-test` | `apps/playground-spa/src/lib/stall-probe.test.ts` | 同じく、止まった頁の記録の仕組みを外した | `test-over-limit-is-stopped-and-named` |
| `stall-record-samples-processes` | `apps/playground-spa/src/lib/stall-probe.test.ts` | 同じく、止まった頁の記録の仕組みを外した | `test-over-limit-is-stopped-and-named` |
| `stall-record-names-main-thread` | `apps/playground-spa/src/lib/stall-probe.test.ts` | 同じく、止まった頁の記録の仕組みを外した | `test-over-limit-is-stopped-and-named` |
| `stall-record-times-recovery` | `apps/playground-spa/src/lib/stall-probe.test.ts` | 同じく、止まった頁の記録の仕組みを外した | `test-over-limit-is-stopped-and-named` |
| `stall-record-recovery-null-when-stuck` | `apps/playground-spa/src/lib/stall-probe.test.ts` | 同じく、止まった頁の記録の仕組みを外した | `test-over-limit-is-stopped-and-named` |
| `stall-record-sample-failure-named` | `apps/playground-spa/src/lib/stall-probe.test.ts` | 同じく、止まった頁の記録の仕組みを外した | `test-over-limit-is-stopped-and-named` |
| `stall-record-fits-hook-timeout` | `apps/playground-spa/src/lib/stall-probe.test.ts` | 同じく、止まった頁の記録の仕組みを外した。前後処理の上限は 10 秒に揃えた | `test-over-limit-is-stopped-and-named` |
| `stall-record-skips-sample-when-live` | `apps/playground-spa/src/lib/stall-probe.test.ts` | 同じく、止まった頁の記録の仕組みを外した | `test-over-limit-is-stopped-and-named` |
| `stall-record-stuck-page-ends-in-time` | `apps/playground-spa/src/lib/stall-probe.test.ts` | 同じく、止まった頁の記録の仕組みを外した。止まった検査は 1 件の上限で止まる | `test-over-limit-is-stopped-and-named` |
| `stall-store-keeps-record` | `apps/playground-spa/src/lib/stall-probe.test.ts` | 同じく、止まった頁の記録の置き場を外した | `test-over-limit-is-stopped-and-named` |
| `stall-store-skips-live-pages` | `apps/playground-spa/src/lib/stall-probe.test.ts` | 同じく、止まった頁の記録の置き場を外した | `test-over-limit-is-stopped-and-named` |
| `stall-store-under-main-checkout` | `apps/playground-spa/src/lib/stall-probe.test.ts` | 同じく、止まった頁の記録の置き場を外した | `test-over-limit-is-stopped-and-named` |
| `stall-probe-leaves-store-clean` | `apps/playground-spa/src/lib/stall-probe.test.ts` | 同じく、止まった頁の記録の置き場を外した | `test-over-limit-is-stopped-and-named` |
| `型検査を実際に回せている` | `packages/dragon/test/typecheck-ratchet.test.ts` | 検査の code の型検査を、検査の 1 件 (16 秒) ではなく `pnpm typecheck` が回す | `typecheck-covers-test-code` |
| `残っている誤りが天井と一致する` | `packages/dragon/test/typecheck-ratchet.test.ts` | 同じく。`pnpm typecheck` は誤りが 1 つでも在れば落ちるので、誤りの数の天井は要らない | `typecheck-covers-test-code` |
| `設定を読めている` | `packages/dragon/test/vitest-timeout-config.test.ts` | 検査の待ち時間を既定より長くする決まり (#2087) を、1 件 10 秒の上限に替えた | `test-limit-is-ten-seconds` |
| `検査の待ち時間が下限以上` | `packages/dragon/test/vitest-timeout-config.test.ts` | 同じく、長く待つ決まりを外した | `test-limit-is-ten-seconds` |
| `前後処理の待ち時間が下限以上` | `packages/dragon/test/vitest-timeout-config.test.ts` | 同じく、長く待つ決まりを外した。前後処理も 10 秒で止まる | `test-over-limit-is-stopped-and-named` |
| `"既定の値と、書かれていない状態を落とせる (植え込み対照)"` | `packages/dragon/test/vitest-timeout-config.test.ts` | 同じく、長く待つ決まりを外した | `test-limit-is-ten-seconds` |
| `"長くする向きの値と、区切りの書き方の違いを通す (陰性対照)"` | `packages/dragon/test/vitest-timeout-config.test.ts` | 同じく、長く待つ決まりを外した | `test-limit-is-ten-seconds` |
| `export-writes-lineup-diagram` | `packages/dragon/test/lineup-diagram.test.ts` | 図の種類ごとに 4 つの形を書き出して 2 回の PNG を比べていた。書き出しは図を描いた後の処理で、図の種類に関わらず同じ | `export-writes-four-formats`、`export-is-deterministic`、`html-export-draws-every-kind` |
| `export-writes-tree-diagram` | `packages/dragon/test/tree-diagram.test.ts` | 同じく、図の種類ごとの繰り返し | `export-writes-four-formats`、`export-is-deterministic`、`html-export-draws-every-kind` |
| `export-writes-time-diagram` | `packages/dragon/test/time-diagram.test.ts` | 同じく、図の種類ごとの繰り返し | `export-writes-four-formats`、`export-is-deterministic`、`html-export-draws-every-kind` |
| `export-writes-git-diagram` | `packages/dragon/test/git-diagram.test.ts` | 同じく、図の種類ごとの繰り返し | `export-writes-four-formats`、`export-is-deterministic`、`html-export-draws-every-kind` |
| `export-writes-state-diagram` | `packages/dragon/test/state-diagram.test.ts` | 同じく、図の種類ごとの繰り返し | `export-writes-four-formats`、`export-is-deterministic`、`html-export-draws-every-kind` |
| `export-png-unchanged-by-font-dedupe` | `packages/dragon/test/export-fonts.test.ts` | 字の file の重なりを外す前と後で、24 個の見本の PNG を撮って画素を比べていた。字の振り分けは 1 字ずつ決まるので、どの字も 1 つの file にだけ入り、全ての字の file が読めれば撮る絵は変わらない | `export-font-files-do-not-overlap`、`font-chars-in-one-file-each`、`export-font-faces-all-load` |
| `common-parts-draw-time` | `apps/playground-spa/src/lib/time-catalog.test.ts` | どの図でも使う部品の頁を、図の種類ごとに開き直して同じ確かめをしていた。部品ごとの件が全ての図の種類の図を記法から描いて段を送る。部品が時間軸の図を持つことと、中身の帯の図が物差しを使うことは、頁を開かずに確かめる | `catalog-common-parts-listed`、`strip-time-figure-uses-meter` |
| `common-parts-draw-state` | `apps/playground-spa/src/lib/state-catalog.test.ts` | 同じく、図の種類ごとの繰り返し | `catalog-common-parts-listed` |
| `common-parts-draw-tree` | `apps/playground-spa/src/lib/tree-catalog.test.ts` | 同じく、図の種類ごとの繰り返し | `catalog-common-parts-listed` |
| `common-parts-draw-git` | `apps/playground-spa/src/lib/git-catalog.test.ts` | 同じく、図の種類ごとの繰り返し | `catalog-common-parts-listed` |

## 速くした検査

次の検査は、守りを変えずに入力を減らすか、同じ準備を 1 度にまとめた。

| 検査 | 減らした物 | 守りが変わらない理由 |
|---|---|---|
| 見本帳の頁を開く全ての検査 | 頁の build を、検査の file ごとから 1 回の実行で 1 度に減らした (`site-setup.ts`) | 全ての file が同じ build の頁を開く。build の設定を名指す file には、その設定の build を別に 1 度行う |
| `export-frame-counts-follow-rates` ほか書き出しの検査 | 撮るコマを 1 秒 2 コマ、GIF を 1 秒 1 コマにした | 渡したコマの数のとおりに撮って書くことを確かめる。既定のコマの数は `export-default-frame-rates` が撮る部品を替えて確かめる |
| `export-font-files-do-not-overlap` | 見本ごとに字の file を作るのをやめ、全ての見本の字を 1 度に振り分けた | 字の振り分けは 1 字ずつ決まるので、字を合わせて振り分けても見本ごとと同じ結果になる |
| `arcade-cuts-box-region-frame-corners` ほか `arcade-corners.test.ts` の角の検査 | 英語の見本を外し、描いた絵を検査の間で使い回す | 英語の見本は日本語の見本と同じ箱と囲みを、字の言葉だけ替えて描く |
| `other-palettes-keep-rounded-corners` | 明るい表示だけで確かめる | 明暗は色だけを替え、角の形を替えない |
| `package-excludes-catalog-material` | `.map` の file を読まない | 配る file に載る字を探す検査で、`.map` は同じ字の写し。読む前に `\uXXXX` の形の字を戻すので、日本語の字も見つかる |
| `cli-language.test.ts` の断りの検査 | 命令を順に起こすのをやめ、同時に起こす | 起こす命令と確かめる中身は同じ |
| `release-notes-for-every-section` | 版ごとの本文を作る命令を、順に起こすのをやめて 8 つずつ同時に起こす | 全ての版の本文を同じ命令で作って確かめる。順に起こすと版が増えるほど遅くなる |
| `catalog-common-part-shows-both-kinds` ほか部品ごとの 5 つの件 (`catalog-parts.test.ts`) | 部品の頁を、件ごとに開き直すのをやめ、部品ごとに 1 度開いて使い回す (#3432) | 読むだけの件を先に回し、頁を移る件と言語を替える件は部品の頁と日本語に戻して終わる。開く回数は `catalog-parts-open-one-page-per-part` が数える |
| `narrow-editor-step-buttons-on-first-screen` ほか編集画面を読むだけの 12 の件 (`site-editor.test.ts`) | 編集画面を、件ごとに開き直すのをやめ、画面の大きさと指で触るかの組ごとに 1 度開いて使い回す (#3435) | 頁の状態を変えない件だけを並べ、見本は棚から読んで頁を上端へ戻してから読む。開く回数は `editor-readers-open-one-page-per-setting` が数える |
| `docs-state-section-follows-regions` ほか使い方の頁を読む 8 つの件 (`site-pages.test.ts`) | 使い方の頁を、件ごとに開き直すのをやめ、言語ごとに 1 度開いて使い回す (#3435) | 頁の状態を変えない件で、部品「絵」の頁へ移る件は使い方の頁へ戻して終わる。開く回数は `docs-readers-open-one-page-per-lang` が数える |

1 件の中で画面の大きさや見本の組を順に回していた検査は、組ごとの件に分けた。
件の名前は元の名前のまま変えず、組は件を包む `describe` の名前に出る。
確かめる組と中身は変わらない。
見本帳の頁の検査は、111 件を 1 つの file に並べていたので、話題ごとの 6 つの file (`site-*.test.ts`) に分けて同時に回す。
