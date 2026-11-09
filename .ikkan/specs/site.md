# site

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 頁の図を描く code が `@cardenelabs/dragon` の部品を呼び、`apps/playground-spa` の中に SVG を組む code が無い | `pnpm test`の検査`page-draws-with-package-parts`が通る | #3030、#3031 |
| 配る頁の CSP が、script を自分の置き場だけにし、inline と eval を許さない | `pnpm test`の検査`csp-script-self-only`が通る | #3030 |
| 再生の部品に枠の中で見える高さに収めるよう頼んだ時 (`fitHeight`)、oauth (幅 560px の枠) と ccip (値の表を外して幅 390px の枠、表を持ったまま 560px の枠) を寄って追う図にすると、窓の下限 160px と全体図と値の表が入る高さの枠では、図の高さが枠の中で見える高さを超えない | `pnpm test`の検査`follow-figure-fits-frame-height`が通る | #3047、#3274 |
| 再生の部品に `fitHeight` を頼んだ時、枠の高さに全体を収めると箱の名前の字が読める下限を割る図 (幅 1200px と高さ 675px の枠の oauth) は寄って追う図になり、収めても読める図 (同じ枠の ccip) と、書き手が見せ方を決めた図は今の見せ方のまま | `pnpm test`の検査`fit-height-turns-tall-figure-follow`が通る | #3047 |
| 再生の部品に `fitHeight` を頼まない時は、枠の高さが低くても見せ方を枠の幅だけで選ぶ (幅 1200px と高さ 300px の枠の oauth は全体を止めて見せる図) | `pnpm test`の検査`view-by-width-without-fit-height`が通る | #3047 |
| 再生の部品に高さを頼まない時、幅 390px と 560px の枠で oauth と ccip を寄って追う図にすると、窓の高さは今と同じく枠の幅の 0.75 倍 (320px 以上、図の高さ以下) | `pnpm test`の検査`follow-window-height-from-width`が通る | #3047 |
| `words.ts` の表 (`KINDS`、`HEADS`、`ATTRS`) が持つ語と鍵のうち、どの部品にも割り当てられていない物が 0 件 | `pnpm test`の検査`catalog-parts-cover-every-word`が通る | #3166 |
| どの部品の図の記法も、その部品に割り当てた語と鍵を使い、記法から原本の JSON に変換できて JSON Schema の検査を通る | `pnpm test`の検査`catalog-part-snippets-use-their-words`が通る | #3166 |
| 一式 (型検査、build、lint、全ての検査) が通る | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'` が終了 0 | #3166 |
| 見本の file を読んだ時、`packages/dragon/examples/` に API の往復 (api)、失敗とやり直し (retry)、支払いと後から届く知らせ (payment)、ウォレットの署名 (wallet) の 4 つの見本が日本語と英語で在り、どれも時系列図で、記法から変換した JSON が同じ名前の `.json` の file と一致し、JSON Schema の検査を通る | `pnpm test`の検査`sequence-examples-compile-to-stored-json`が通る | #3167 |
| 4 つの見本を記法から JSON、JSON から記法、記法から JSON と変換した時、最初の JSON と同じ JSON に戻る | `pnpm test`の検査`sequence-examples-roundtrip`が通る | #3167 |
| 4 つの見本の記法を読んだ時、各見本が主に見せる部品の語を使う。往復は線と `side`、失敗は `act` と `note` と同じ 2 つの箱の間の線を 2 つの段で引く形、支払いは `carry: coin` と `strip` と `set`、署名は `tag` と `code` | `pnpm test`の検査`sequence-examples-use-their-parts`が通る | #3167 |
| 4 つの見本の英語版を読んだ時、日本語版と同じ数の箱と段と線を持ち、仮名と漢字を含まない | `pnpm test`の検査`sequence-examples-english-match`が通る | #3167 |
| 今の見本 (入門、OAuth、CCIP) は、今どおり記法から JSON、JSON から記法、記法から JSON と変換して同じ JSON に戻る | `pnpm test`の検査`roundtrip-keeps-json-identical`が通る | #3167 |
| 一式 (型検査、build、lint、全ての検査) が通る | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'` が終了 0 | #3167 |
| 使い方の頁の状態遷移図の節の例の記法 (日本語と英語) を `parseNotation` が誤り無く読み、JSON Schema の検査を通り、`start` の線、`finish` の線、通らない道を 1 つ以上ずつ持つ | `pnpm test`の検査`docs-state-example-parses`が通る | #3172 |
| repo の README の描ける図の欄に状態遷移図があり、行の頭の表に `state` の行と、`start` と `finish` の線の行がある。package の README の行の頭の語に `state` があり、`start`、`finish`、通らない道を使う `state` の例を載せた状態遷移図の小節がある | `pnpm test`の検査`readme-notation-covers-state`が通る | #3172 |
| 書き方の手引き `quick-start.md` と英語版の行の形の節に `state` の行があり、`state` で始まる例を `parseNotation` が誤り無く読む | `pnpm test`の検査`quick-start-covers-state`が通る | #3172 |
| package の版が 0.37.0 以上で、`CHANGELOG.md` の `## [0.37.0]` の節に状態遷移図 (#3163) と見た目を揃えた変更 (#3171) の項がある | `pnpm test`の検査`changelog-0-37-0-releases-state`が通る | #3172 |
| package の版が前提の配り方の節と、`CHANGELOG.md` の版の見出しに書かれている | `pnpm test`の検査`release-version-in-premise`と`release-version-in-changelog`が通る | #3172 #3202 |
| 2 つの README の dragon記法の節に決まりが 4 つ並び、dragon の囲みの例がどれも読める | `pnpm test`の検査`readme-notation-examples-parse`が通る | #3172 #3202 |
| 書き方の手引きの英語版の例の数が日本語版と同じで、どれも読める | `pnpm test`の検査`quick-start-en-fences-parse`が通る | #3172 #3202 |
| 記法の全ての語をどれかの部品が受け持ち、部品の頁の経路が組み立てで作られる | `pnpm test`の検査`catalog-parts-cover-every-word`が通る | #3172 |
| 型の検査、build、lint と、既存の検査の全てが通る | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'`が終了 0 | #3172 #3202 #3208 |
| 使い方の頁の枝分かれの図の節の例の記法 (日本語と英語) を `parseNotation` が誤り無く読み、JSON Schema の検査を通り、枝を 3 本以上宣言し、枝を切る出来事、当て直しの commit、merge commit、札を動かす線を 1 つ以上ずつ持つ | `pnpm test`の検査`docs-git-example-parses`が通る | #3202 |
| repo の README の描ける図の欄に枝分かれの図があり、行の頭の表に `git` と `branch` と `commit` の行と、`<枝> from <commit>` と `<札> -> <commit>` の行がある。package の README の行の頭の語に `git`、`branch`、`commit` があり、`copy`、`merge`、`from`、札を動かす線を使う `git` の例を載せた枝分かれの図の小節がある | `pnpm test`の検査`readme-notation-covers-git`が通る | #3202 |
| 書き方の手引き `quick-start.md` と英語版の行の形の節に `git`、`branch`、`commit` の行があり、`git` で始まる例を `parseNotation` が誤り無く読む | `pnpm test`の検査`quick-start-covers-git`が通る | #3202 |
| package の版が 0.40.0 以上で、`CHANGELOG.md` の `## [0.40.0]` の節に枝分かれの図 (#3164) と、書き方を載せたこの課題 (#3202) の項がある | `pnpm test`の検査`changelog-0-40-0-releases-git`が通る | #3202 |
| 使い方の頁の例を含む全ての見本で、どの段でも字が重ならない | `pnpm test`の検査`overlaps-none-in-every-example`が通る | #3202 |
| 記法の全ての語をどれかの部品が受け持ち、部品の図の記法がその部品の語を使い、部品の頁が英語でも出て、部品の頁の見本の札がその見本へ向かう | `pnpm exec vitest run apps/playground-spa/src/lib/catalog-parts.test.ts`の検査`catalog-parts-cover-every-word`と`catalog-part-snippets-use-their-words`が通る | #3208 |
| 使い方の頁の時間軸の図の節の例の記法 (日本語と英語) を `parseNotation` が誤り無く読み、JSON Schema の検査を通り、4 段を持ち、区切り、印の列、2 つ以上の節目、拡大の範囲を宣言し、針を進める出来事、印の色を変える出来事、範囲の出来事、物差しの欄を 1 つ以上ずつ持つ | `pnpm test`の検査`docs-time-example-parses`が通る | #3221 |
| repo の README の描ける図の欄に時間軸の図があり、行の頭の表に `time`、`scale`、`period`、`row`、`point`、`zoom`、`mark`、`span` の行と、針を進める `now ->` の行がある。package の README の行の頭の語に `time`、`scale`、`period`、`row`、`point`、`zoom`、`mark`、`span` があり、`now`、`mark`、`span`、`[meter: ]` を使う `time` の例を載せた時間軸の図の小節がある | `pnpm test`の検査`readme-notation-covers-time`が通る | #3221 |
| 書き方の手引き `quick-start.md` と英語版の行の形の節に `time`、`scale`、`period`、`row`、`point`、`zoom`、`mark`、`span` の行があり、`time` で始まる例を `parseNotation` が誤り無く読む | `pnpm test`の検査`quick-start-covers-time`が通る | #3221 |
| `CHANGELOG.md` に、時間軸の図の書き方を使い方の頁と README と書き方の手引きに載せたこの課題 (#3221) の項がある | `pnpm test`の検査`changelog-lists-time-docs`が通る | #3221 |
| package の版が前提の配り方の節と、`CHANGELOG.md` の版の見出しに書かれている | `pnpm test`の検査`release-version-in-premise`と`release-version-in-changelog`が通る | #3221、#3235 |
| 2 つの README の dragon記法の節に決まりが 4 つ並び、dragon の囲みの例がどれも読める | `pnpm test`の検査`readme-notation-examples-parse`が通る | #3221 |
| 書き方の手引きの英語版の例の数が日本語版と同じで、どれも読める | `pnpm test`の検査`quick-start-en-fences-parse`が通る | #3221、#3235 |
| 使い方の頁の例を含む全ての見本で、どの段でも字が重ならない | `pnpm test`の検査`overlaps-none-in-every-example`が通る | #3221、#3235 |
| 型の検査、build、lint と、既存の検査の全てが通る | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'`が終了 0 | #3221 |
| 使い方の頁の木の図の節の例の記法 (日本語と英語) を `parseNotation` が誤り無く読み、JSON Schema の検査を通り、4段を持ち、葉を4つと親を3つ持ち、値を持つ葉と親が全てで、親子の箱どうしの運ぶ物の線を1つ以上持つ | `pnpm test`の検査`docs-tree-example-parses`が通る | #3235 |
| repoのREADMEの描ける図の欄に木の図があり、行の頭の表に `tree`、`leaf`、`node` の行がある。packageのREADMEの行の頭の語に `tree`、`leaf`、`node` があり、`[hash: ]` を使う `tree` の例を載せた木の図の小節がある | `pnpm test`の検査`readme-notation-covers-tree`が通る | #3235 |
| 書き方の手引き `quick-start.md` と英語版の行の形の節に `tree`、`leaf`、`node` の行があり、`tree` で始まる例を `parseNotation` が誤り無く読む | `pnpm test`の検査`quick-start-covers-tree`が通る | #3235 |
| `CHANGELOG.md` に木の図の書き方を載せたこの課題 (#3235) の項がある | `pnpm test`の検査`changelog-records-tree-docs`が通る | #3235 |
| 2つのREADMEのdragon記法の節に決まりが4つ並び、dragonの囲みの例がどれも読める | `pnpm test`の検査`readme-notation-examples-parse`が通る | #3235 |
| 型の検査、build、lintと、既存の検査の全てが通る | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'`が終了0 | #3235 #3250 |
| 見本帳が最初に読む script と CSS の合計が、今の上限に収まる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`page-bundle-within-budget`が通る | #3505 |
