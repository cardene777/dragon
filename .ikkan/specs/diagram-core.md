# diagram-core

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 7 つの意匠の値の表と、意匠を切り替える仕組みが repo に残っていない | `pnpm test`の検査`designs-folded-into-one-look`が通る | #2983 |
| 今の図の一覧 (playground の catalog の図) が repo に残っていない | `pnpm test`の検査`old-catalog-removed`が通る | #2983 |
| 原本の JSON を検査した時、JSON Schema 1 本で判定し、誤りがあれば誤った欄の場所を JSON Pointer で示して落ちる | `pnpm test`の検査`schema-reports-pointer-of-invalid-field`が通る | #2984 |
| 原本の JSON が座標の欄 (x / y) を持つ時、検査が落ちる | `pnpm test`の検査`schema-rejects-coordinates`が通る | #2984 |
| 段に題か本文が無い時、検査が落ちる | `pnpm test`の検査`schema-requires-step-title-and-body`が通る | #2984 |
| 形式の版を持たない JSON を検査した時、検査が落ちる | `pnpm test`の検査`schema-requires-format-version`が通る | #2984 |
| 区画、箱、線、運ぶ物、段、中身の帯を共通の欄に書き、生存線のような種類だけの物を種類の欄に書いた JSON は、検査を通る | `pnpm test`の検査`schema-accepts-common-skeleton-with-form-fields`が通る | #2984 |
| 道具より新しい版の JSON を読んだ時、描かずに版の番号を示して落ちる | `pnpm test`の検査`version-rejects-newer-than-tool`が通る | #2984 |
| 今の版の JSON を移行の命令に渡した時、file を書き換えない | `pnpm test`の検査`migrate-leaves-current-version-untouched`が通る | #2984 |
| OAuth の時系列図を記法で書いた時、同じ内容の JSON に変換される | `pnpm test`の検査`notation-compiles-oauth-to-json`が通る | #2984 |
| CCIP の構成図を記法で書いた時、同じ内容の JSON に変換される | `pnpm test`の検査`notation-compiles-ccip-to-json`が通る | #2984 |
| 記法の行に誤りがある時、誤りの行と列を示して落ちる | `pnpm test`の検査`notation-reports-line-and-column`が通る | #2984 |
| dragon の囲みを 2 つ以上含む Markdown を読んだ時、囲みごとに図を取り出す | `pnpm test`の検査`markdown-fence-extracts-every-diagram`が通る | #2984 |
| OAuth と CCIP を記法、JSON、記法、JSON の順に往復した時、最初と最後の JSON が一致する | `pnpm test`の検査`roundtrip-keeps-json-identical`が通る | #2984 |
| JSON から記法へ書き戻した時、同じ JSON からは毎回同じ文字列になる | `pnpm test`の検査`print-is-stable`が通る | #2984 |
| OAuth の時系列図を原本の JSON から描いた時、12 段が順に動く | `pnpm test`の検査`oauth-renders-12-steps`が通る | #2985 |
| CCIP の構成図を原本の JSON から描いた時、13 段が順に動く | `pnpm test`の検査`ccip-renders-13-steps`が通る | #2985 |
| OAuth と CCIP の置き場所を自動で決めた時、箱どうしと、線の名前と箱が 10px 以上離れる | `pnpm test`の検査`layout-keeps-10px-gap`が通る | #2985 |
| 線の名前に寄せの指示で側を書いた時、その名前が指示した側に置かれる | `pnpm test`の検査`layout-honors-label-side-hint`が通る | #2985 |
| 全体を枠に収めた時の字が 10.5px 以上の図を開いた時、全体を止めて中だけ動かす見せ方になる | `pnpm test`の検査`view-mode-fixed-when-text-readable`が通る | #2985 |
| 全体を枠に収めた時の字が 10.5px を下回る図を開いた時、寄って動かし全体図で今どこかを示す見せ方になる | `pnpm test`の検査`view-mode-follow-when-text-too-small`が通る | #2985 |
| 書き手が見せ方を指定した時、字の大きさに関わらず指定した見せ方になる | `pnpm test`の検査`view-mode-honors-explicit-choice`が通る | #2985 |
| OAuth と CCIP を 0.25 秒ごとに止めて数えた時、運ぶ物が図のどこにも見えない時刻が全体の 2% 以下 | `pnpm test`の検査`carrier-stays-visible`が通る | #2985 |
| 時系列図と構成図では、線の名前はその段の間だけ出て、どの時刻でも同時に見える数が 2 個以下。状態遷移図は段が終わった線の名前を薄く残す | `pnpm test`の検査`labels-show-only-during-their-step`が通る | #2985 #3171 |
| 段の番号は、その段が始まるまで出ない | `pnpm test`の検査`badges-hidden-before-their-step`が通る | #2985 |
| 色味を指定せずに描いた時、紙と墨で描く | `pnpm test`の検査`palette-defaults-to-paper`が通る | #2985 |
| 色味 3 案 (澄んだ色 / 紙と墨 / 夜の計器) の明暗それぞれで、1 型 / 2 型 / 3 型を模した全ての 2 色の差が 6 以上、通常の見え方の差が 15 以上ある | `pnpm test`の検査`palettes-keep-cvd-separation`が通る | #2985 |
| 図の種類ごとの描画が、色、字、余白、動きの値を共通の値の表からだけ読み、描画の file に色の値と字の大きさを直接書かない | `pnpm test`の検査`renderers-read-values-from-one-table`が通る | #2985 |
| 頁と書き出しの字が、同梱した Noto Sans JP と等幅の字で描かれ、端末の字に落ちない | `pnpm test`の検査`render-uses-bundled-fonts`が通る | #2985 |
| 動きを嫌う設定で図を開いた時、自動再生せず、段ごとの止め絵を釦で送れる | `pnpm test`の検査`reduced-motion-shows-stills`が通る | #2985 |
| 図を開いた時、各段の題と本文を段の順に読み上げの道具から読める | `pnpm test`の検査`steps-exposed-to-screen-readers`が通る | #2985 |
| 依存を足した後も、入れた依存が公開されている中身と一致する | `pnpm verify:deps`が終了 0 | #2985 |
| 書き出しの命令を実行した時、同じ JSON から mp4、GIF、HTML、PNG の 4 つが書き出される | `pnpm test`の検査`export-writes-four-formats`が通る | #2986 |
| 同じ JSON を 2 回書き出した時、PNG がバイト単位で一致する | `pnpm test`の検査`export-is-deterministic`が通る | #2986 |
| 寄って見せる図を動画に書き出した時、最初のコマと途中のコマで見ている範囲が違う | `pnpm test`の検査`export-video-follows-camera`が通る | #2986 #3042 |
| HTML に書き出した時、図で使った字だけを含む字の file が HTML の中に入る | `pnpm test`の検査`html-export-embeds-font-subset`が通る | #2986 |
| 依存を足した後も、入れた依存が公開されている中身と一致する | `pnpm verify:deps`が終了 0 | #2986 |
| 新しい形で書いた `packages/dragon/examples/oauth.dragon` と `ccip.dragon` を `parseNotation` が読み、今と同じ `oauth.json` と `ccip.json` を返す | `pnpm exec vitest run packages/dragon/test/notation.test.ts`の検査`notation-compiles-oauth-to-json`と`notation-compiles-ccip-to-json`が通る | #3137 |
| 行の一覧の全ての種類を 1 つずつ書いた記法を読み、`as` の無い箱は名札を名前にし、`say` の下に字下げして続けた行は 1 つの本文につなぎ、段は次の `step` か file の終わりで閉じる | `pnpm exec vitest run packages/dragon/test/notation.test.ts`の検査`notation-reads-every-line-kind`が通る | #3137 |
| 空白を含む名前を `[` の前に置いた行と、`,` か `]` を含む値を引用符で囲んだ属性を読み、引用符の中の字をそのまま値にする | `pnpm exec vitest run packages/dragon/test/notation.test.ts`の検査`notation-reads-quoted-and-spaced-values`が通る | #3137 |
| `end` の無い `group`、一覧に無い行の頭の語、コロンの無い属性、知らない属性の鍵、宣言していない名札は、行と列を示した誤りで止まる | `pnpm exec vitest run packages/dragon/test/notation.test.ts`の検査`notation-reports-line-and-column`と`notation-rejects-unclosed-group`が通る | #3137 |
| 日本語の語で書いた今の形 (`時系列図` か `構成図` で始まる file、「」で囲んだ字) は読まず、新しい形の語を示す誤りで止まる | `pnpm exec vitest run packages/dragon/test/notation.test.ts`の検査`notation-rejects-the-old-form`が通る | #3137 |
| 記法の誤りの文は呼ぶ側が渡した言葉 (`ja` か `en`) で出し、渡さなければ日本語で出す。file の字から言葉を決めない。英語の文は同じ行と列を示し、仮名と漢字を含まない | `pnpm test`の検査`errors-follow-given-language`が通る | #3137 |
| `printNotation` が新しい形を出し、出した記法を読み直すと元の JSON と同じになる | `pnpm exec vitest run packages/dragon/test/notation.test.ts`の検査`roundtrip-keeps-json-identical`が通る | #3137 |
| `printNotation` が書き戻した記法が、`packages/dragon/test/fixtures/printed/` の見本と 1 字も違わない | `pnpm exec vitest run packages/dragon/test/notation.test.ts`の検査`print-matches-the-printed-fixtures`が通る | #3137 |
| `printNotation` は、`,` か `]` を含む値と `[` を含む名前だけを引用符で囲んで書き戻し、それ以外の値は囲まない | `pnpm exec vitest run packages/dragon/test/notation.test.ts`の検査`print-quotes-only-when-needed`が通る | #3137 |
| 欄の並び順だけが違う同じ内容の JSON は、今どおり同じ記法に書き戻す | `pnpm exec vitest run packages/dragon/test/notation.test.ts`の検査`print-is-stable`が通る | #3137 |
| repo の全ての `.dragon` の file (`git ls-files '*.dragon'` が挙げる file) を `parseNotation` が誤り無く読む | `pnpm exec vitest run packages/dragon/test/notation.test.ts`の検査`every-dragon-file-parses`が通る | #3137 |
| markdown の dragon の囲みから図の字を取り出す動きは今どおり | `pnpm exec vitest run packages/dragon/test/notation.test.ts`の検査`markdown-fence-extracts-every-diagram`が通る | #3137 |
| 使い方の文書の英語版 `packages/dragon/examples/quick-start.en.md` が在り、その中の dragon の囲みがすべて新しい形で読める | `pnpm test`の検査`quick-start-en-fences-parse`が通る | #2997、#3137 |
| 公開する頁で言葉を EN にした時、編集画面の左の棚の 3 つの見本のどれを選んでも、書く欄の記法に日本語の語 (`時系列図` や `帯`) が 1 つも無い | `pnpm test`の検査`english-page-examples-use-english-words`が通る | #2997、#3031 |
| 編集画面で JSON を直した後に書き戻す記法が、新しい形になる | `pnpm exec vitest run apps/playground-spa/src/lib/playground.test.ts`の検査`json-edit-prints-dragon-notation`が通る | #2997、#3137 |
| 使い方の頁の節が記法の全ての行の種類を扱い、頁に載せた例は全て新しい形で読める | `pnpm exec vitest run apps/playground-spa/src/lib/site.test.ts`の検査`docs-sections-cover-notation-and-examples-parse`が通る | #3137 |
| 頁の書く欄の記法に誤りがある時、欄の下の誤りの文と行の番号を頁の言葉で出す。図の字の言葉には従わない | `pnpm test`の検査`page-errors-follow-page-language`が通る | #2997、#3137 |
| 原本の JSON の検査に英語を渡した時、書けない欄、要る欄、決まった値、道具より新しい版、型、字の数、名札の形、数、版の下限、線の種類の値、書けない組み合わせ、どちらかが要る欄の誤りの文に仮名と漢字が 1 つも無い | `pnpm test`の検査`json-errors-in-english`が通る | #2999 |
| 言葉を渡さずに原本の JSON を検査した時、書けない欄、要る欄、決まった値、道具より新しい版の誤りの文が今と同じ文字列になる | `pnpm test`の検査`json-errors-default-japanese-unchanged`が通る | #2999 |
| 日本語を渡した時と言葉を渡さない時、型、字の数、名札の形、数、版の下限、線の種類の値、書けない組み合わせ、どちらかが要る欄の誤りの文が日本語で書かれ、ajv の英語の文 (`must …`) を含まない | `pnpm test`の検査`json-errors-in-japanese-for-ajv-rules`が通る | #2999 |
| 名札の形の誤りは、正規表現ではなく書けない字 (空白と `[` `]` `「` `」` `=` `:`) を並べた文で出す | `pnpm test`の検査`pattern-error-lists-forbidden-characters`が通る | #2999 |
| 書けない組み合わせ (`sequence` の欄と、運ぶ物の `text` の欄) の誤りは、書けない欄の名前とその欄を書ける時 (`kind` が `sequence` の図だけ、運ぶ物の `kind` が `tag` の時だけ) を示し、場所 (JSON Pointer) をその欄にする。`kind` が無い時と綴りを誤った時も、同じ文で出る | `pnpm test`の検査`not-error-names-the-field`が通る | #2999 |
| 帯の値に `value` も `tag` も無い時、誤りは 1 つで、どちらかを書くよう示す | `pnpm test`の検査`any-of-error-is-one-message`が通る | #2999 |
| schema が使う決まり (`discriminator` を含む) のどれかに日本語か英語の誤りの文が無い時、検査が落ちる | `pnpm test`の検査`every-schema-keyword-has-messages`が通る | #2999 |
| 公開する頁で JSON の側に誤りがある時、欄の下の誤りの文を頁の言葉で出す (EN の頁は仮名と漢字を含まず、日本語の頁は `must …` を含まない) | `pnpm test`の検査`page-json-errors-follow-page-language`が通る | #2999 |
| JSON の側を書き換えて誤りが出ている間に頁の言葉を切り替えた時、書いた JSON を見本の英語版に替えずに残し、誤りの文を切り替えた言葉で出し直す。記法の欄が見本のままの時も同じ | `pnpm test`の検査`page-json-error-follows-language-switch`が通る | #2999 |
| 図を描く部品 (`renderDiagram`) に英語を渡して形の誤りのある原本を描いた時、断りの文は `Cannot draw the diagram: <場所> <英語の誤りの文>` になり、仮名と漢字を含まない | `pnpm test`の検査`render-refusal-in-english`が通る | #3001 |
| 再生する部品 (`mountDiagram`) に英語を渡して寄って動かす見せ方 (`view` が `follow`) の図を置いた時、全体図の札は `Overview` になる | `pnpm test`の検査`overview-label-in-english`が通る | #3001 |
| 再生する部品に英語を渡した時、釦の読み上げの名前は前の段が `Previous step`、動かしている間の止める釦が `Pause`、止めた後が `Play`、次の段が `Next step` になり、段の一覧の名前は `Steps of <題>` になる。釦を並べた要素の `lang` 属性は渡した言葉になる | `pnpm test`の検査`player-labels-in-english`が通る | #3001 |
| 言葉を渡さない時と日本語を渡した時、断りの文 (`図を描けない: <場所> <誤りの文>`)、全体図の札 (`全体図`)、読み上げの名前 (`前の段` `止める` `動かす` `次の段` `<題> の段`) が今と同じ文字列になる | `pnpm test`の検査`render-text-default-japanese-unchanged`が通る | #3001 |
| 寄って動かす見せ方で、高さが幅の 6 倍ほどある縦に長い図 (箱 2 つで段 30) を置いた時も、全体図の札 (`全体図` と `Overview`) が全体図の地の中に収まる。収まりは書き出した HTML を Chromium で開き、札と地の描かれた幅 (`getBBox`) で比べる | `pnpm test`の検査`overview-label-fits-minimap`が通る | #3001 |
| 公開する頁で手を入れた記法を描いたまま言葉を EN に切り替えた時、再生の釦と段の一覧の読み上げの名前が英語になり、寄って動かす見せ方の図の全体図の札が `Overview` になる。日本語に戻すと日本語の名前と札に戻る | `pnpm test`の検査`page-player-labels-follow-page-language`が通る | #3001 |
| 日本語の頁で英語の字の図を描いた時、再生の釦と段の一覧の読み上げの名前と全体図の札は頁の言葉 (日本語) で出る | `pnpm test`の検査`page-player-labels-ignore-notation-language`が通る | #3001 |
| `dragon export` に `--lang` なしで記法の file を渡した時、英語の字の見本も日本語の字の見本も日本語で、書き出した HTML の `lang` 属性と、開いた時の読み上げの名前と、寄って見せる時の全体図の札が書かれる | `pnpm test`の検査`export-without-lang-is-japanese`が通る | #3001、#3137 |
| `dragon export` に `--lang` を渡した時は、記法の file でも JSON の原本でもその言葉に従う。JSON の原本は `--lang en` なら英語、`--lang` なしなら今の日本語で、HTML の `lang` 属性と読み上げの名前と全体図の札を書き出す | `pnpm test`の検査`export-lang-flag`が通る | #3001、#3137 |
| `dragon export` に `--lang en` と形の誤りのある JSON の原本を渡した時、何も書き出さずに終了 1 で終わり、出した断りの文は `Cannot draw the diagram:` で始まって誤りの場所 (`/boxes/0/colour` など) を含み、仮名と漢字を含まない | `pnpm test`の検査`export-refusal-follows-language`が通る | #3001 |
| `dragon export` の `--lang` に `ja` と `en` 以外を渡した時、何も書き出さずに終了 2 で終わり、使い方を出す。使い方には `--lang` の行がある | `pnpm test`の検査`export-rejects-unknown-lang`が通る | #3001 |
| 書き出しの部品 (`exportDiagram`) に英語を渡して HTML を書き出した時、埋めた字の file は全体図の札 `Overview` の字を含み、`全体図` の字と図で描かない字を含まない (原本は大文字の `O` を持たない図にする) | `pnpm test`の検査`html-export-font-subset-follows-language`が通る | #3001 |
| `dragon export --lang en` を図の file を渡さずに打った時と、`dragon help --lang en` のように `export` 以外を打った時、標準エラーの使い方の文は `Usage: dragon export <diagram file (.json or .dragon)> [options]` で始まり、8 つの設定 (`--out` `--width` `--palette` `--theme` `--lang` `--fps` `--gif-fps` `--format`) の行を持ち、仮名と漢字を含まず、終了 2 で終わる | `pnpm test`の検査`cli-usage-in-english`が通る | #3003 |
| 言葉を選ばずに図の file を渡さずに打った時、使い方の文は `--lang` の行を除いて今と同じ文字列で、終了 2 で終わる | `pnpm test`の検査`cli-usage-default-japanese-unchanged`が通る | #3003 |
| 使い方の文の `--lang` の行は、命令の文の言葉も決めることを書く。日本語の行は `図の中の字と命令の文の言葉 (ja か en)` で始まる説明を持ち、英語の行は `Language of the diagram text and command messages (ja or en)` で始まる説明を持つ | `pnpm test`の検査`cli-usage-lang-line-names-messages`が通る | #3003 |
| 知らない設定 (`--colour` と短い形の `-x`) を渡した時、1 行目に `知らない設定: <設定>` を出し、続けて使い方の文を出して、何も書き出さずに終了 2 で終わる。`--lang en` を知らない設定より後ろに置いても、1 行目は `Unknown option: <設定>` になり、英語の使い方の文が続く | `pnpm test`の検査`cli-unknown-option-follows-language`が通る | #3003 |
| 値の要る設定 (`--out`) の値を書かずに最後に置いた時、1 行目に `設定に値が無い: --out` を出し、続けて使い方の文を出して終了 2 で終わる。値を書かずに後ろへ `--lang en` を続けた時 (`--out --lang en`) は、`--lang` を値と取り違えずに 1 行目が `Option needs a value: --out` になり、英語の使い方の文が続く | `pnpm test`の検査`cli-missing-value-follows-language`が通る | #3003 |
| 無い file を渡した時、`図の file が無い: <渡した path>` の 1 行を出して終了 1 で終わる。`--lang en` を渡すと `No such diagram file: <渡した path>` になる | `pnpm test`の検査`cli-missing-file-follows-language`が通る | #3003 |
| file の代わりに dir を渡した時、`図の file を読めない: <渡した path> (<Node の文>)` を出して終了 1 で終わる。`--lang en` を渡すと頭が `Cannot read the diagram file: <渡した path> (` になる | `pnpm test`の検査`cli-unreadable-file-follows-language`が通る | #3003 |
| JSON として読めない `.json` の file を渡した時、`JSON として読めない: <渡した path> (<Node の文>)` を出して終了 1 で終わる。括弧の中は同じ中身を `JSON.parse` に渡した時の文と同じ。`--lang en` を渡すと頭が `Cannot read as JSON: <渡した path> (` になる | `pnpm test`の検査`cli-bad-json-follows-language`が通る | #3003 |
| `playwright-core` が解決できない場で PNG を書き出した時、`--lang en` を渡した JSON の原本でも、`--lang en` を渡した英語の記法の file でも、断りの文は `Exporting needs playwright-core.` で始まり、入れ方の 2 つの命令 (`pnpm add -D playwright-core` と `pnpm exec playwright-core install chromium`) を含み、仮名と漢字を含まず、終了 1 で終わる。解決できない場は `node --import` で読ませる hook が `playwright-core` の解決を断って作る | `pnpm test`の検査`cli-missing-playwright-in-english`が通る | #3003、#3137 |
| Chromium の置き場 (`PLAYWRIGHT_BROWSERS_PATH`) を空の dir に向けて PNG を書き出した時、`--lang en` を渡した JSON の原本でも、`--lang en` を渡した英語の記法の file でも、断りの文は `Cannot launch Chromium.` で始まり、入れ方の 2 つの命令を含み、括弧の中の Playwright の文を含めて仮名と漢字を含まず、終了 1 で終わる | `pnpm test`の検査`cli-chromium-refusal-in-english`が通る | #3003、#3137 |
| 言葉を選ばずに JSON の原本で同じ 2 つの場から PNG を書き出した時、断りの文は今と同じ `書き出しには playwright-core が要る。<入れ方>` と `Chromium を起動できない。<入れ方> (<Playwright の文>)` になる | `pnpm test`の検査`cli-export-refusal-default-japanese-unchanged`が通る | #3003 |
| 記法の行の誤りの文は、英語の字の file でも日本語の字の file でも `--lang` の言葉で出て、`--lang` なしなら日本語で出る。一覧に無い行の頭の語を書くと、`--lang en` なら `<path>:<行> A line cannot start with <語>.`、それ以外は `<path>:<行> <語> は行の頭に書けない。` で始まる | `pnpm test`の検査`cli-notation-errors-follow-lang`が通る | #3003、#3137 |
| `--lang` に `ja` と `en` 以外を渡した時、何も書き出さずに終了 2 で終わり、日本語の使い方を出す | `pnpm test`の検査`export-rejects-unknown-lang`が通る | #3003 |
| 再生の部品 (`mountDiagram`) で枠の幅 390px と 560px に寄って追う図 (`view` が `follow`) を置いた時、時系列図 (oauth) と構成図 (ccip) のどちらでも、全体図の地 (`.dg-mm-bg`) が窓の枠 (`.dg-vp-frame`) と重ならない | `pnpm test`の検査`overview-outside-window`が通る | #3042 |
| 寄って追う図で、全体図の高さが幅より大きい時 (oauth) は全体図が窓の右に、幅が高さ以上の時 (ccip) は窓の下に出る | `pnpm test`の検査`overview-side-follows-its-shape`が通る | #3042 |
| 公開する頁の編集画面を幅 390px と 860px で開き、oauth と ccip の見本を段 1 から最後の段まで進めた時、どの段でも全体図の地が窓の枠と重ならず、図の枠 (`.dg-frame`) の中に全部見える | `pnpm test`の検査`editor-overview-beside-window-and-in-frame`が通る | #3042 |
| 寄って追う図の幅 (`svg` の `width`) は、全体図を右に出す時も下に出す時も、渡した枠の幅を超えない | `pnpm test`の検査`follow-figure-within-frame-width`が通る | #3042 |
| 寄って追う図の全体図に、今見ている所の枠 (`.dg-mm-vp`) と、全体図の札 (`全体図`) が出る | `pnpm test`の検査`overview-shows-viewport-box`が通る | #3042 |
| 全体を止めて見せる図 (`data-view="fixed"`) は全体図を持たず、図の幅と高さが配置の幅と高さのまま | `pnpm test`の検査`fixed-figure-has-no-overview`が通る | #3042 |
| 寄って動かす見せ方で縦に長い図を置いた時も、全体図の札が全体図の地の中に収まる | `pnpm test`の検査`overview-label-fits-minimap`が通る | #3042 |
| 画面の大きさ 390 × 844、860 × 900、1024 × 768、1280 × 720、1440 × 900 で、構成図と時系列図のカタログの頁の全部の見本を拡大の重ね窓で開き、自動で送らずに段を 1 つずつ送った時、どの段でも段の本文の帯の高さと、図 (`svg[data-dragon="figure"]`) の幅と高さと上端の位置が 1 段目と同じ | `pnpm test`の検査`overlay-figure-steady-across-steps`が通る | #3049 |
| 1440 × 900 の編集画面で oauth と ccip の見本を開き、自動で送らずに段を 1 つずつ送った時、どの段でも段の本文の帯の高さと、図の幅と高さと上端の位置が 1 段目と同じ | `pnpm test`の検査`editor-figure-steady-across-steps`が通る | #3049 |
| oauth を書き出した HTML を幅 390px で開き、自動で送らずに段を 1 つずつ送った時、どの段でも段の本文の帯の高さと図の上端の位置が 1 段目と同じ | `pnpm test`の検査`html-export-caption-bar-steady`が通る | #3049 |
| 再生の部品で図を置いた時、段の題 (`[data-dragon="step-title"]`) と本文 (`[data-dragon="step-body"]`) は 1 つずつのままで今の段の中身を出し、帯の高さを決めるための全部の段の題と本文の写しは見た目から隠れ、読み上げの道具からも隠れる | `pnpm test`の検査`player-caption-room-holds-every-step`が通る | #3049 |
| 重ね窓で、どの段でも送らずに図の全体が見える | `pnpm test`の検査`catalog-overlay-figure-whole-without-scroll`が通る | #3049 |
| 全部の段の題と本文が、段の順に読み上げの道具へ出る | `pnpm test`の検査`steps-exposed-to-screen-readers`が通る | #3049 |
| 動きを嫌う設定で図を開いた時、自動再生せず、段の題が今の段の題を出す | `pnpm test`の検査`reduced-motion-shows-stills`が通る | #3049 |
| 編集画面で字の大きさを替えると、段の題の字が大きくなり小さくなる | `pnpm test`の検査`editor-stage-tools-change-view`が通る | #3049 |
| カタログの時系列図の頁の見本の枠の高さが、今と同じ `clamp(360px, 58vh, 620px)` の値のまま | `pnpm test`の検査`catalog-fixed-figure-keeps-frame-height`が通る | #3049 |
| 画面の大きさ 1024 × 768、1280 × 720、1440 × 900 で時系列図のカタログの頁の oauth の見本を拡大の重ね窓で開いた時、寄って追う図の窓が図の原寸の横幅の全部を見せる | `pnpm test`の検査`overlay-follow-window-shows-whole-width`が通る | #3053 |
| 画面の大きさ 390 × 844 と 1440 × 900 で oauth の見本を拡大の重ね窓で開いた時、窓の高さと図の枠の中で見える高さの差が 1px 以下で、窓と全体図が図の枠の中に収まる | `pnpm test`の検査`overlay-follow-window-fills-frame-height`が通る | #3053 |
| 枠の幅が図の原寸の幅と全体図の列を足した幅より広い時 (oauth、枠の幅 1200px)、寄って追う図の窓の幅が図の原寸の幅と同じで、全体図が窓の右に重ならずに出る | `pnpm test`の検査`follow-window-takes-figure-width`が通る | #3053 |
| 高さに収めると頼んだ時 (`fitHeight`)、枠の中で見える高さが今の窓より高ければ、窓の高さが見える高さ (全体図を下に置く時はその分を除く) と図の高さの小さい方になり、全体図の大きさは今と同じ (oauth と ccip) | `pnpm test`の検査`follow-window-grows-to-frame-height`が通る | #3053 |
| 高さに収めると頼まない時、窓の高さは今と同じく枠の幅から決まる | `pnpm test`の検査`follow-window-height-from-width`が通る | #3053 |
| 枠の中で見える高さが今の窓より低い時、窓と全体図がその高さに収まる | `pnpm test`の検査`follow-figure-fits-frame-height`が通る | #3053 |
| 寄って追う図の全体図が窓に重ならずに窓の外に出る | `pnpm test`の検査`overview-outside-window`が通る | #3053 |
| 寄って追う図の幅が枠の幅を超えない | `pnpm test`の検査`follow-figure-within-frame-width`が通る | #3053 |
| 重ね窓で、どの段でも送らずに図の全体が見える | `pnpm test`の検査`catalog-overlay-figure-whole-without-scroll`が通る | #3053 |
| 重ね窓で段を 1 つずつ送った時、どの段でも段の本文の帯の高さと図の大きさと位置が 1 段目と同じ | `pnpm test`の検査`overlay-figure-steady-across-steps`が通る | #3053 |
| 枠の幅が 440px より狭く全体図が縦に長い時 (oauth、枠の幅 360、390、430px、高さに収める時と収めない時)、全体図を描かず、窓の幅が枠の幅と同じ | `pnpm test`の検査`narrow-tall-figure-drops-overview`が通る | #3055 |
| 画面の大きさ 360 × 780、390 × 844、430 × 932 で oauth をカタログの頁の見本の枠、拡大の重ね窓、編集画面で開いた時、全体図が無く、窓の幅と図の枠の中の幅の差が 1px 以下で、図が枠の中に送らずに収まる | `pnpm test`の検査`narrow-follow-window-fills-frame-width`が通る | #3055 |
| 縦に長い全体図は枠の幅 440px 以上で窓の右に、横に長い全体図は枠の幅に関わらず窓の下に出る (oauth は 440 と 560px、ccip は 390 と 560px) | `pnpm test`の検査`overview-side-follows-its-shape`が通る | #3055 |
| 全体図を出す時、全体図が窓に重ならない | `pnpm test`の検査`overview-outside-window`が通る | #3055 |
| 寄って追う図の幅が枠の幅を超えない | `pnpm test`の検査`follow-figure-within-frame-width`が通る | #3055 |
| 全体図を出す時、全体図が今見ている所の枠と札を持つ | `pnpm test`の検査`overview-shows-viewport-box`が通る | #3055 |
| 枠の中で見える高さが今の窓より低い時、窓と全体図がその高さに収まる | `pnpm test`の検査`follow-figure-fits-frame-height`が通る | #3055 |
| 枠の中で見える高さが今の窓より高い時、窓が伸び、全体図の大きさは変わらない | `pnpm test`の検査`follow-window-grows-to-frame-height`が通る | #3055 |
| `--lang` なしで書き出した HTML を幅 440px で開いた時、再生の釦と全体図の札が日本語で出る | `pnpm test`の検査`export-without-lang-is-japanese`が通る | #3055、#3137 |
| 書き出しの命令に言葉を渡した時、再生の釦と全体図の札がその言葉で出る | `pnpm test`の検査`export-lang-flag`が通る | #3055 |
| 縦に長い図の書き出した HTML を幅 440px で開いた時、全体図の札が全体図の地からはみ出さない | `pnpm test`の検査`overview-label-fits-minimap`が通る | #3055 |
| 編集画面で、全体図を出す見本 (860px の oauth と ccip、390px の ccip) の全体図が窓に重ならず図の枠の中にある | `pnpm test`の検査`editor-overview-beside-window-and-in-frame`が通る | #3055 |
| 重ね窓で、どの段でも送らずに図の全体が見え、全体図を出す時は図の枠の中にある | `pnpm test`の検査`catalog-overlay-figure-whole-without-scroll`が通る | #3055 |
| 1024 × 768 から 1440 × 900 の重ね窓で、oauth の窓が図の横幅の全部を見せる | `pnpm test`の検査`overlay-follow-window-shows-whole-width`が通る | #3055 |
| 帯の中身の幅が 440px より狭い時 (oauth の書き出した HTML を幅 360、390、430px で開く)、戻る・再生・進むの釦と段の番号が同じ段に並び、題がその下の段で、題と本文が釦の左端から帯の中身の右端までの幅を使う | `pnpm test`の検査`html-export-narrow-caption-stacks-body`が通る | #3057、#3069 |
| 画面の大きさ 360 × 780 と 390 × 844 で oauth と ccip を拡大の重ね窓で開いた時、段の本文の帯が今 (360 × 780 で 191px と 211px、390 × 844 で 151px と 191px) より低く、図の枠の中の高さが今 (398px と 355px、502px と 462px) より高い | `pnpm test`の検査`narrow-overlay-caption-lower`が通る | #3057、#3069 |
| 画面の大きさ 360 × 780、390 × 844、430 × 932 で oauth と ccip を拡大の重ね窓と編集画面で開き、自動で送らずに段を 1 つずつ送った時、どの段でも帯の高さと図の大きさと位置が 1 段目と同じで、全部の段の題と本文が帯の中身の幅に収まる | `pnpm test`の検査`narrow-caption-steady-and-inside`が通る | #3057、#3069 |
| 画面の大きさ 360 × 780 の編集画面で、字の大きさの釦を押すと段の題と本文の字が大きくなり小さくなる | `pnpm test`の検査`narrow-editor-caption-font-scales`が通る | #3057、#3069 |
| 画面の大きさ 560 × 900 と 1440 × 900 で oauth と ccip を拡大の重ね窓と編集画面で開いた時、帯は横 1 列のまま (釦と番号と題が同じ段に並び、本文が題の下で題と同じ左端から始まる) | `pnpm test`の検査`wide-caption-stays-one-row`が通る | #3057、#3069、#3076 |
| 画面の大きさ 390 × 844 から 1440 × 900 で構成図と時系列図の全部の見本を重ね窓で開き、段を 1 つずつ送った時、どの段でも帯の高さと図の大きさと位置が 1 段目と同じ | `pnpm test`の検査`overlay-figure-steady-across-steps`が通る | #3057 |
| 1440 × 900 の編集画面で oauth と ccip を開き、段を 1 つずつ送った時、どの段でも帯の高さと図の大きさと位置が 1 段目と同じ | `pnpm test`の検査`editor-figure-steady-across-steps`が通る | #3057 |
| oauth を書き出した HTML を幅 390px で開き、段を 1 つずつ送った時、どの段でも帯の高さと図の上端の位置が 1 段目と同じ | `pnpm test`の検査`html-export-caption-bar-steady`が通る | #3057、#3069、#3076 |
| 段の題と本文は 1 つずつで今の段の中身を出し、全部の段の写しは見た目と読み上げの道具から隠れる | `pnpm test`の検査`player-caption-room-holds-every-step`が通る | #3057、#3069、#3076 |
| 重ね窓で、本文の最も長い段の本文の下端と札の下の縁の間が 8px 以上ある | `pnpm test`の検査`overlay-caption-clear-of-bottom-edge`が通る | #3057、#3069 |
| 編集画面で、本文の最も長い段の本文の下端と図の側の下の縁の間が 8px 以上ある | `pnpm test`の検査`editor-caption-clear-of-bottom-edge`が通る | #3057、#3069 |
| 1440 × 900 の編集画面で、字の大きさの釦で段の題の字が大きくなり小さくなる | `pnpm test`の検査`editor-stage-tools-change-view`が通る | #3057 |
| 画面の大きさ 360 × 780、390 × 844、430 × 932 で oauth の編集画面、時系列図のカタログの見本の枠と重ね窓、使い方の頁を開いた時、見える図の段を送る 3 つの釦が縦横 44px 以上あり、それぞれの四隅を押すとその釦に当たる | `pnpm test`の検査`narrow-player-buttons-touch-targets`が通る | #3069、#3076 |
| oauth を書き出した HTML を幅 360、390、430px で開いた時、段を送る 3 つの釦が 44 × 44px で、幅 1440px で開いた時は 36 × 36px | `pnpm test`の検査`html-export-player-buttons-touch-size`が通る | #3069、#3076 |
| 画面の大きさ 360 × 780、390 × 844、430 × 932 の oauth の編集画面で、次の釦で段が 1 つ進み、前の釦で 1 つ戻り、再生の釦で動き出して止めるの釦に替わる | `pnpm test`の検査`narrow-player-buttons-work`が通る | #3069、#3076 |
| 画面の大きさ 1440 × 900 で oauth の編集画面、時系列図のカタログの見本の枠と重ね窓、使い方の頁を開いた時、段を送る釦が 36 × 36px のまま | `pnpm test`の検査`wide-player-buttons-keep-size`が通る | #3069、#3076 |
| 画面の大きさ 360 × 780 と 390 × 844 で oauth と ccip を拡大の重ね窓で開いた時、見出しが今 (360 × 780 で 133px と 156px、390 × 844 で 133px と 133px) より低く、図の枠の中が今 (472px と 435px、542px と 522px) より高い | `pnpm test`の検査`narrow-overlay-head-lower`が通る | #3069 |
| 指で触る端末を模して画面の大きさ 768 × 1024、1024 × 1366、1366 × 1024 で oauth の編集画面、時系列図のカタログの見本の枠と重ね窓、使い方の頁を開いた時、見える図の段を送る 3 つの釦が縦横 44px 以上あり、それぞれの四隅を押すとその釦に当たる | `pnpm test`の検査`coarse-player-buttons-touch-targets`が通る | #3076 |
| 指で触る端末を模して oauth を書き出した HTML を幅 1024px で開いた時、段を送る 3 つの釦が 44 × 44px | `pnpm test`の検査`html-export-coarse-player-buttons`が通る | #3076 |
| 指で触る端末を模して画面の大きさ 1366 × 1024 の oauth の編集画面で、次の釦で段が 1 つ進み、前の釦で 1 つ戻り、再生の釦で動き出して止めるの釦に替わり、段を 1 つずつ最後まで送ってもどの段でも帯の高さが 1 段目と同じ | `pnpm test`の検査`coarse-player-buttons-work`が通る | #3076 |
| 指で触る端末を模して画面の大きさ 1024 × 1366 と 1366 × 1024 で oauth と ccip を拡大の重ね窓と編集画面で開いた時、帯は横 1 列のまま (釦と番号と題が同じ段に並び、本文が題の下で題と同じ左端から始まる) | `pnpm test`の検査`coarse-caption-stays-one-row`が通る | #3076 |
| oauth と ccip を寄って追う図にして枠の幅 390px と 560px (編集画面の幅 390px と 860px の図の枠) に置き、段 1 から最後の段まで送った時、どの段でも今の段の番号の丸が窓の枠の中に全部収まる | `pnpm test`の検査`follow-window-shows-step-badge`が通る | #3046 |
| 構成図 (ccip) を同じ 2 つの枠の幅に置いた時、今の形で丸が窓に全部見えている段は、窓の位置が `ba9784a2` の時と同じ。時系列図の窓の位置は、頭の列の下へ寄せる位置に変えた (#3118) | `pnpm test`の検査`follow-window-keeps-fitting-steps`が通る | #3046 |
| 動く物を全部囲んだ範囲が窓に収まらず丸が外れていた段で、丸に近い動く物を窓に入れる。ccip の段 13 では、丸の隣の OffRamp の箱が窓に全部入り、oauth の段 9、11、12 では、今の段の線の両端が窓に入る | `pnpm test`の検査`follow-window-holds-badge-neighbors`が通る | #3046 |
| oauth を寄って追う図にして枠の幅 390px と 560px (編集画面の幅 390px と 860px の図の枠) に置き、段 9、11、12 の止め絵の時刻にした時、書き換わった字 (トークンを持つ、データを返した、ログイン済み) が、窓の上端に貼った頭の列の中で窓の枠の内側に見える | `pnpm test`の検査`follow-heads-show-swapped-text`が通る | #3118 |
| 同じ 2 つの置き方で、どの段の止め絵でも、頭の列が窓の上端に在り、頭の列の横の位置が窓の中身の横の位置と同じ (頭の箱が自分の生存線の真上に在る) | `pnpm test`の検査`follow-heads-track-window-x`が通る | #3118 |
| 同じ 2 つの置き方で、どの段でも今の段の番号の丸が、頭の列より下の窓に全部入る | `pnpm test`の検査`follow-badge-below-heads`が通る | #3118 |
| 同じ 2 つの置き方で、頭の字が書き換わらない段 (段 1 から 8 と段 10) は、窓が頭の列の下の残りの高さで線を真ん中に見せる位置に止まる。止まる位置の値は、頭の列を 2 段にした #3120 の行が持つ | `pnpm test`の検査`follow-sequence-window-under-heads`が通る | #3118 |
| 構成図 (ccip) を枠の幅 390px と 560px に寄って追う図で置いた時、頭の列を持たず、丸が見えていた段の窓の位置が `8e2b0c09` の時と同じ | `pnpm test`の検査`follow-window-keeps-fitting-steps`が通る | #3118 |
| oauth と ccip を同じ 4 つの置き方にした時、どの段でも今の段の番号の丸が窓の枠の中に全部収まる (#3046) | `pnpm test`の検査`follow-window-shows-step-badge`が通る | #3118 |
| ccip の段 13 で丸の隣の OffRamp の箱が窓に全部入り、oauth の段 9、11、12 で今の段の線の両端が窓に入る (#3046) | `pnpm test`の検査`follow-window-holds-badge-neighbors`が通る | #3118 |
| 止めて見せる図 (`renderDiagram` が返す SVG) は、時系列図でも頭の列を持たない | `pnpm test`の検査`fixed-view-has-no-heads-strip`が通る | #3118 |
| oauth を寄って追う図にして枠の幅 390px と 560px (編集画面の幅 390px と 860px の図の枠) に置いた時、窓の上の頭の列の頭の箱はアイコンを持たず、名前と下の字の 2 段で、箱の高さが 40px、頭の列の高さが 56px | `pnpm test`の検査`follow-heads-two-rows`が通る | #3120 |
| 同じ 2 つの置き方で、頭の列の頭の箱ごとに、名前が下の字より上に在り、どちらも箱の中に在る | `pnpm test`の検査`follow-heads-two-rows`が通る | #3120 |
| 同じ 2 つの置き方で、頭の列の下の線を見せる高さが、枠の幅 390px で 264px、560px で 364px | `pnpm test`の検査`follow-heads-leave-line-room`が通る | #3120 |
| 同じ 2 つの置き方で、頭の字が書き換わらない段 (段 1 から 8 と段 10) の窓が、線を図の頭の箱の下から見せ始める位置に止まる。#3118 の位置より中ほどの段で 20px、図の上端の段 (段 1 と 2) で 40px 下に在る | `pnpm test`の検査`follow-sequence-window-under-heads`が通る | #3120 |
| 同じ 2 つの置き方で、どの段の止め絵でも、図の頭の箱が頭の列の下か窓の上に隠れ、頭の列より下の窓に見えない | `pnpm test`の検査`follow-heads-cover-figure-heads`が通る | #3120 |
| 同じ 2 つの置き方で、段 9、11、12 の止め絵の時刻に、書き換わった字が窓の上端の頭の列の中に見える (#3118) | `pnpm test`の検査`follow-heads-show-swapped-text`が通る | #3120 |
| 同じ 2 つの置き方で、どの段でも今の段の番号の丸が頭の列より下の窓に全部入る (#3118) | `pnpm test`の検査`follow-badge-below-heads`が通る | #3120 |
| 同じ 2 つの置き方で、頭の列が窓の上端に在り、窓の中身と同じだけ横に動く (#3118) | `pnpm test`の検査`follow-heads-track-window-x`が通る | #3120 |
| 止めて見せる図 (`renderDiagram` が返す SVG) は頭の列を持たない (#3118) | `pnpm test`の検査`fixed-view-has-no-heads-strip`が通る | #3120 |
| 止めて見せる図の箱の縁は、頭の列の箱と縁を描く部分を共に使った後も、置き場所の箱と同じ四角に在る | `pnpm test`の検査`fixed-view-cards-match-layout`が通る | #3120 |
| oauth を寄って追う図にして枠の幅 560px と 1000px に置いた時、どの段でも全体図の四角が、窓の上の頭の列の下の線を見せる所 (窓の上端から頭の列の高さ 56px 下から窓の下端まで、窓と同じ幅) を全体図の倍率で囲む | `pnpm test`の検査`overview-frames-line-region`が通る | #3122 |
| 同じ置き方で、どの段でも全体図の四角の上下の線が、全体図の頭の箱の帯の高さを通らない | `pnpm test`の検査`overview-clears-head-bars`が通る | #3122 |
| ccip を寄って追う図にして枠の幅 560px と 1000px に置いた時、頭の列を持たない構成図の全体図の四角は、どの段でも窓の全体を全体図の倍率で囲む | `pnpm test`の検査`overview-architecture-frames-window`が通る | #3122 |
| 枠の幅が 440px より狭い寄って追う oauth は全体図を持たない | `pnpm test`の検査`narrow-tall-figure-drops-overview`が通る | #3122 |
| 止めて見せる図は全体図と窓を持たない | `pnpm test`の検査`fixed-figure-has-no-overview`が通る | #3122 |
| 使い方の頁と `CHANGELOG.md` に、今の形と新しい形の対応表が在り、表の新しい形の行の頭の語が記法を読む部品の語と一致する | `pnpm exec vitest run apps/playground-spa/src/lib/site.test.ts`の検査`notation-old-to-new-table-matches-the-parser`が通る | #3138 |
| `README.md` と `packages/dragon/README.md` が決まり 4 つを載せ、2 つの README の記法の例が新しい形で読める | `pnpm exec vitest run packages/dragon/test/notation.test.ts`の検査`readme-notation-examples-parse`が通る | #3138 |
| 字が重なる図を描いた時、`renderDiagram` の結果の `overlaps` が、重なる 2 つの字とその段の番号を 1 件ずつ持つ | `pnpm exec vitest run packages/dragon/test/text-overlaps.test.ts`の検査`overlaps-lists-texts-and-step`が通る | #3175 |
| 別々の段の間だけ見える 2 つの字が同じ所に在る時、`overlaps` に数えない | `pnpm exec vitest run packages/dragon/test/text-overlaps.test.ts`の検査`overlaps-ignore-texts-not-shown-together`が通る | #3175 |
| 箱の名前と下の字のように、上下に並べた 2 行の字を `overlaps` に数えない | `pnpm exec vitest run packages/dragon/test/text-overlaps.test.ts`の検査`overlaps-ignore-stacked-lines`が通る | #3175 |
| 線が札を持たない字 (薄く残す線の名前、通らない道の名前、始まりと終わりの印の字、区画と脇道の名前と添え書き) を横切る図を描いた時、`overlaps` が、その字と線の両端の名前とその段の番号を 1 件ずつ持つ | `pnpm exec vitest run packages/dragon/test/text-overlaps.test.ts`の検査`overlaps-lists-lines-through-text`が通る | #3175 |
| 札に入った字 (線の名前の札、処理の札、段の番号) を線が横切っても、`overlaps` に数えない | `pnpm exec vitest run packages/dragon/test/text-overlaps.test.ts`の検査`overlaps-ignore-lines-under-pills`が通る | #3175 |
| 使い方の頁の状態遷移図の例 (日本語と英語) の全ての段で、「取り消す」と「注文を確定」(英語は `Cancel` と `Place order`) が重ならない | `pnpm exec vitest run apps/playground-spa/src/lib/text-overlaps.test.ts`の検査`state-side-label-clear-of-step-labels`が通る | #3175 |
| 使い方の頁の状態遷移図の例 (日本語と英語) の全ての段で、「取り消す」の点線が「注文を確定」(英語は `Place order`) を横切らない | `pnpm exec vitest run apps/playground-spa/src/lib/text-overlaps.test.ts`の検査`state-step-label-clear-of-side-path`が通る | #3175 |
| 状態遷移図で同じ線に 2 つの段の名前を薄く残す時、名前どうしが重ならない (部品「運ぶ物」の状態遷移図の日本語と英語) | `pnpm exec vitest run apps/playground-spa/src/lib/text-overlaps.test.ts`の検査`state-past-labels-on-one-line-clear`が通る | #3175 |
| 見本帳の部品の見本、使い方の頁の例、`packages/dragon/examples` の全ての見本の全ての段で、`overlaps` が 0 件 (字どうしの重なりも、線が札を持たない字を横切る所も無い) | `pnpm exec vitest run apps/playground-spa/src/lib/text-overlaps.test.ts`の検査`overlaps-none-in-every-example`と`state-step-label-clear-of-side-path`が通る | #3175 |
| 全ての見本を見る検査に字が重なる見本を 1 つ混ぜると、検査が見本の名前と段と重なる 2 つの字を出して落ちる | `pnpm exec vitest run apps/playground-spa/src/lib/text-overlaps.test.ts`の検査`overlaps-check-names-example-step-and-texts`が通る | #3175 |
| 時系列図と構成図では、線の名前はその段の間だけ出て、どの時刻でも同時に見える数が 2 個以下 | `pnpm exec vitest run packages/dragon/test/render.test.ts`の検査`labels-show-only-during-their-step`が通る | #3175 |
| 段の番号はその段の線の上に在る | `pnpm exec vitest run packages/dragon/test/render.test.ts`の検査`edge-step-badge-on-its-line`が通る | #3175 |
| 状態遷移図で段が終わった後も、その段の線の名前を薄く残し、普通の濃さで見える線の名前はどの時刻でも 2 個以下 | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-keeps-past-line-names-faint`が通る | #3175 |
| 脇道の囲みは右上に在り、始まりの印とその添え書きに重ならない | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-renders-side-path-top-right`が通る | #3175 |
| 構成図と状態遷移図で運ぶ物が箱に着いて留まる時、運ぶ物は絵柄の右の置き場に在り、絵柄と名前と下の字に重ならない | `pnpm exec vitest run packages/dragon/test/carrier-slot.test.ts`の検査`carrier-rests-beside-icon`が通る | #3176 |
| 同じ段に同じ箱へ着く 2 つの運ぶ物は、置き場に横に並んで重ならない | `pnpm exec vitest run packages/dragon/test/carrier-slot.test.ts`の検査`carriers-in-one-box-side-by-side`が通る | #3176 |
| 運ぶ物を出し入れする箱は、初めの段から絵柄の右に点線の置き場の枠を持ち、出し入れしない箱は枠を持たずに絵柄を真ん中に置く | `pnpm exec vitest run packages/dragon/test/carrier-slot.test.ts`の検査`slot-frame-only-on-carrier-boxes`が通る | #3176 |
| 置き場の枠と留まる札は箱の右上の済んだ印に重ならず、長い札 (例 `#1042`) が着く箱は札が枠に収まる幅に広がる | `pnpm exec vitest run packages/dragon/test/carrier-slot.test.ts`の検査`slot-clear-of-done-mark`が通る | #3176 |
| 構成図と状態遷移図で、走り出す前の運ぶ物は出る箱の置き場で待ち、段の番号に重ならない | `pnpm exec vitest run packages/dragon/test/carrier-slot.test.ts`の検査`carrier-waits-in-slot-before-departing`が通る | #3176 |
| 時系列図で、着いた運ぶ物は生存線の向こう側に留まって矢印の先に重ならず、走り出す前の運ぶ物は出る生存線の手前側で待って段の番号に重ならない | `pnpm exec vitest run packages/dragon/test/carrier-slot.test.ts`の検査`sequence-carrier-beside-lifeline`が通る | #3176 |
| 運ぶ物が絵柄に重なる図を描いた時、`overlaps` がその運ぶ物と絵柄と段の番号を 1 件ずつ持つ | `pnpm exec vitest run packages/dragon/test/text-overlaps.test.ts`の検査`overlaps-lists-carrier-over-icon`が通る | #3176 |
| 見本帳の部品の見本、使い方の頁の例、`packages/dragon/examples` の全ての見本の全ての段で、留まる運ぶ物と走り出す前の運ぶ物が、絵柄と名前と下の字と段の番号と矢印の先に重ならない | `pnpm exec vitest run apps/playground-spa/src/lib/carrier-slot.test.ts`の検査`carriers-clear-in-every-example`が通る | #3176 |
| 部品「絵」の状態遷移図の見本の説明文 (日本語と英語) が、運ぶ物は着いた状態の絵柄の横の置き場に留まると書いている | `pnpm exec vitest run apps/playground-spa/src/lib/carrier-slot.test.ts`の検査`icon-state-example-describes-slot`が通る | #3176 |
| 構成図で箱の下を回る線の名前が、図の外へはみ出さない | `pnpm exec vitest run packages/dragon/test/carrier-slot.test.ts`の検査`architecture-labels-inside-figure`が通る | #3176 |
| 段ごとの止め絵で、運ぶ物は着いた先に居る | `pnpm exec vitest run packages/dragon/test/motion.test.ts`の検査`still-carrier-at-rest`が通る | #3176 |
| どの時刻にも運ぶ物が 1 つ以上見えている | `pnpm exec vitest run packages/dragon/test/render.test.ts`の検査`carrier-stays-visible`が通る | #3176 |
| 状態遷移図で、運ぶ物がどの時刻にも見えていて、段の番号は段より前に出ない | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-keeps-carrier-and-badge-rules`が通る | #3176 |
| 段の番号はその段の線の上に在る | `pnpm exec vitest run packages/dragon/test/render.test.ts`の検査`edge-step-badge-on-its-line`が通る | #3176 |
| 全ての見本の全ての段で、`overlaps` が 0 件 | `pnpm exec vitest run apps/playground-spa/src/lib/text-overlaps.test.ts`の検査`overlaps-none-in-every-example`が通る | #3176 |
| 時系列図で、上に置く線の名前の札の下端と線の間、下に置く札の上端と線の間が、どちらも 6 | `pnpm exec vitest run packages/dragon/test/layout.test.ts`の検査`layout-honors-label-side-hint`が通る | #3177 |
| 時系列図で、頭の箱の下端から上に名前を持つ最初の線までが 36、同じ段の名前の無い線と線の間が 32、上に名前を持つ次の段の線と前の線の間が 48、最後の線から生存線の終わりまでが 20 | `pnpm exec vitest run packages/dragon/test/sequence-height.test.ts`の検査`sequence-rows-packed`が通る | #3177 |
| 部品「絵」の時系列図の見本 (英語) の図の高さが 250 以下 | `pnpm exec vitest run apps/playground-spa/src/lib/sequence-height.test.ts`の検査`icon-sequence-example-shorter`が通る | #3177 |
| 時系列図の全ての見本の全ての段で、線の名前の札が自分の線と他の線に食い込まない | `pnpm exec vitest run apps/playground-spa/src/lib/sequence-height.test.ts`の検査`sequence-labels-clear-of-lines-in-every-example`が通る | #3177 |
| 構成図と状態遷移図で、上に置く線の名前の札の下端と線の間は今どおり 12 | `pnpm exec vitest run packages/dragon/test/sequence-height.test.ts`の検査`architecture-and-state-label-gap-unchanged`が通る | #3177 |
| 全ての見本の全ての段で、`overlaps` が 0 件 | `pnpm exec vitest run apps/playground-spa/src/lib/text-overlaps.test.ts`の検査`overlaps-none-in-every-example`が通る | #3177 |
| 全ての見本の全ての段で、運ぶ物が絵柄と字と段の番号と矢印の先を隠さない | `pnpm exec vitest run apps/playground-spa/src/lib/carrier-slot.test.ts`の検査`carriers-clear-in-every-example`が通る | #3177 |
| 同じ線を 5 段で通る構成図 (packages/dragon/test/fixtures/repeat-line.dragon) を描いた時、全ての段で `overlaps` が 0 件 | `pnpm exec vitest run packages/dragon/test/badge-pile.test.ts`の検査`architecture-repeat-no-overlaps`が通る | #3184 |
| 同じ状態へ戻る線を 5 段で通る状態遷移図を描いた時、全ての段で `overlaps` が 0 件 | `pnpm exec vitest run packages/dragon/test/badge-pile.test.ts`の検査`state-loop-repeat-no-overlaps`が通る | #3184 |
| 同じ線を何度も通る時、その線を通る段の番号は全て同じ所に置かれる | `pnpm exec vitest run packages/dragon/test/badge-pile.test.ts`の検査`repeat-line-badges-share-one-spot`が通る | #3184 |
| 線の無い段が同じ箱か中身の帯を続けて書き換える時、段の番号は同じ角に置かれ、全ての段で `overlaps` が 0 件 | `pnpm exec vitest run packages/dragon/test/badge-pile.test.ts`の検査`corner-badges-share-one-spot`が通る | #3184 |
| 状態遷移図で同じ線に同じ名前が付く段が続く時、名前は 1 つの所に置かれ、図の高さは 1 回だけ通る図と同じ | `pnpm exec vitest run packages/dragon/test/badge-pile.test.ts`の検査`state-same-name-once`が通る | #3184 |
| 部品「運ぶ物」の構成図と状態遷移図で、同じ線を 2 つの段で通る組の番号が同じ所に置かれる | `pnpm exec vitest run apps/playground-spa/src/lib/text-overlaps.test.ts`の検査`repeated-line-badges-share-one-spot`が通る | #3184 |
| 同じ線を 1 度しか通らない段の番号は、後の段が始まっても消えずに残る | `pnpm exec vitest run packages/dragon/test/badge-pile.test.ts`の検査`single-pass-badges-stay`が通る | #3184 |
| 時系列図で同じ 2 つの箱の間を何度も行き来する時、段の番号はそれぞれの行の線に置かれる | `pnpm exec vitest run packages/dragon/test/badge-pile.test.ts`の検査`sequence-repeat-badges-on-own-rows`が通る | #3184 |
| 状態遷移図で同じ線に違う名前が付く段は、名前を別々の所に置く | `pnpm exec vitest run apps/playground-spa/src/lib/text-overlaps.test.ts`の検査`state-past-labels-on-one-line-clear`が通る | #3184 |
| 見本帳の部品の見本、使い方の頁の例、packages/dragon/examples の全ての見本の全ての段で `overlaps` が 0 件のまま | `pnpm exec vitest run apps/playground-spa/src/lib/text-overlaps.test.ts`の検査`overlaps-none-in-every-example`が通る | #3184 |
| 英語で重なりを知らせる時、箱の絵柄を `The icon of "<箱の名前>"`、硬貨を `the coin`、封筒を `the envelope` と呼ぶ | `pnpm exec vitest run packages/dragon/test/overlap-notice.test.ts`の検査`overlap-names-parts-in-english`が通る | #3184 |
| 日本語で重なりを知らせる時、箱の絵柄を「<箱の名前> の絵柄」、運ぶ物を「硬貨」「封筒」と呼ぶ | `pnpm exec vitest run packages/dragon/test/overlap-notice.test.ts`の検査`overlap-names-parts-in-japanese`が通る | #3184 |
| 構成図で同じ箱へ戻る線を持つ図 (packages/dragon/test/fixtures/arch-self-loop.dragon) を描いた時、全ての段で `overlaps` が 0 件 | `pnpm exec vitest run packages/dragon/test/self-line.test.ts`の検査`architecture-self-line-no-overlaps`が通る | #3186 |
| 構成図で同じ箱へ戻る線は、箱の下端から出て箱の下へ膨らみ、箱の下端へ戻る輪になる | `pnpm exec vitest run packages/dragon/test/self-line.test.ts`の検査`architecture-self-line-loops-below-box`が通る | #3186 |
| 構成図の輪の段の番号は輪の右に、線の名前は輪の下に置かれる | `pnpm exec vitest run packages/dragon/test/self-line.test.ts`の検査`architecture-self-line-badge-and-label`が通る | #3186 |
| 構成図の輪に載せた運ぶ物は、輪の上を通って箱の置き場に着く | `pnpm exec vitest run packages/dragon/test/self-line.test.ts`の検査`architecture-self-line-carrier-on-loop`が通る | #3186 |
| 同じ箱へ戻る線を持つ箱の真下に別の箱が在る時、輪と名前と番号が下の箱に重ならない | `pnpm exec vitest run packages/dragon/test/self-line.test.ts`の検査`architecture-self-line-clear-of-box-below`が通る | #3186 |
| 区画の中の箱に同じ箱へ戻る線を書いた時、輪と名前と番号が区画の中に収まる | `pnpm exec vitest run packages/dragon/test/self-line.test.ts`の検査`architecture-self-line-inside-region`が通る | #3186 |
| 輪を持つ箱から出入りするほかの線 (packages/dragon/test/fixtures/arch-self-region.dragon、arch-self-side.dragon、arch-self-wide.dragon) は、輪と名前の置き場を通らず箱の脇から列の間を回る | `pnpm exec vitest run packages/dragon/test/self-line.test.ts`の検査`architecture-other-lines-avoid-loop`が通る | #3186 |
| 同じ列の箱どうしを列の間で回る線は、列で一番幅の広い箱の中を通らない (packages/dragon/test/fixtures/arch-self-wide.dragon) | `pnpm exec vitest run packages/dragon/test/self-line.test.ts`の検査`architecture-detour-clear-of-wide-box`が通る | #3186 |
| 状態遷移図の同じ状態へ戻る線は、今のまま状態の下に輪で描く | `pnpm exec vitest run packages/dragon/test/state-diagram.test.ts`の検査`state-draws-self-loop-under-box`が通る | #3186 |
| 時系列図の自分への矢印は、今のまま生存線の右へ出て戻る | `pnpm exec vitest run packages/dragon/test/self-line.test.ts`の検査`sequence-self-message-unchanged`が通る | #3186 |
| 見本帳の部品の見本、使い方の頁の例、packages/dragon/examples の全ての見本の全ての段で `overlaps` が 0 件のまま | `pnpm exec vitest run apps/playground-spa/src/lib/text-overlaps.test.ts`の検査`overlaps-none-in-every-example`が通る | #3186 |
| 区画の中の箱と下の帯の箱を往復する 2 本の線を持つ構成図 (packages/dragon/test/fixtures/pair-band.dragon) の全ての段で、`overlaps` が 0 件 | `pnpm exec vitest run packages/dragon/test/badge-pair.test.ts`の検査`badge-pair-band-no-overlaps`が通る | #3189 |
| 同じ帯の上下の行の箱を往復する 2 本の線を持つ構成図 (packages/dragon/test/fixtures/pair-row.dragon) の全ての段で、`overlaps` が 0 件 | `pnpm exec vitest run packages/dragon/test/badge-pair.test.ts`の検査`badge-pair-row-no-overlaps`が通る | #3189 |
| 別の箱どうしの線が同じ箱の同じ辺から出るか入る構成図 (packages/dragon/test/fixtures/shared-side.dragon、crowd-side.dragon) の全ての段で、`overlaps` が 0 件 | `pnpm exec vitest run packages/dragon/test/badge-pair.test.ts`の検査`badge-shared-side-no-overlaps`が通る | #3189 |
| 44px より短い線の段の番号は、線の始まりから番号の半径と 1px だけ進んだ所に置かれる | `pnpm exec vitest run packages/dragon/test/badge-pair.test.ts`の検査`badge-short-line-at-start`が通る | #3189 |
| 線の上で前の番号を避けられない時、番号は線の脇へずれ、ほかの線に乗らない (crowd-side.dragon) | `pnpm exec vitest run packages/dragon/test/badge-pair.test.ts`の検査`badge-crowd-aside-clear-of-lines`が通る | #3189 |
| 44px 以上の線の段の番号は、今までどおり線の始まりから 14px 進んだ所に置かれる | `pnpm exec vitest run packages/dragon/test/badge-pair.test.ts`の検査`badge-long-line-unchanged`が通る | #3189 |
| 同じ線を後の段がまた通る時、番号は同じ所に置かれて入れ替わる (#3184) | `pnpm exec vitest run packages/dragon/test/badge-pile.test.ts`の検査`repeat-line-badges-share-one-spot`が通る | #3189 |
| 構成図の同じ箱へ戻る輪の番号は、今のまま輪の右に置かれる (#3186) | `pnpm exec vitest run packages/dragon/test/self-line.test.ts`の検査`architecture-self-line-badge-and-label`が通る | #3189 |
| 見本帳の部品の見本、使い方の頁の例、packages/dragon/examples の全ての見本の全ての段で `overlaps` が 0 件のまま | `pnpm exec vitest run apps/playground-spa/src/lib/text-overlaps.test.ts`の検査`overlaps-none-in-every-example`が通る | #3189 |
| 状態に `note` だけを書いた段を持つ状態遷移図 (packages/dragon/test/fixtures/corner-note.dragon) の全ての段で、`overlaps` が 0 件 | `pnpm exec vitest run packages/dragon/test/corner-badge.test.ts`の検査`corner-badge-state-note-no-overlaps`が通る | #3187 |
| 何も書かない段を持つ状態遷移図 (packages/dragon/test/fixtures/corner-empty.dragon) の全ての段で、`overlaps` が 0 件 | `pnpm exec vitest run packages/dragon/test/corner-badge.test.ts`の検査`corner-badge-state-empty-no-overlaps`が通る | #3187 |
| 札を置く枠を持つ構成図の箱に `note` だけを書いた段 (packages/dragon/test/fixtures/corner-slot.dragon) の全ての段で、`overlaps` が 0 件 | `pnpm exec vitest run packages/dragon/test/corner-badge.test.ts`の検査`corner-badge-architecture-slot-no-overlaps`が通る | #3187 |
| 線の無い段の番号の中心が、状態遷移図と構成図と時系列図のどれでも、書き換わる箱の左上の角に在る | `pnpm exec vitest run packages/dragon/test/corner-badge.test.ts`の検査`corner-badge-centered-on-corner`が通る | #3187 |
| 中身の帯だけを書き換える線の無い段の番号は、今までどおり帯の左上の角から 4px 内側に在る | `pnpm exec vitest run packages/dragon/test/corner-badge.test.ts`の検査`corner-badge-strip-unchanged`が通る | #3187 |
| 箱が図の左端と上端に在る 4 つの見本 (corner-note、corner-empty、corner-slot、corner-seq) で、線の無い段の番号が図の外へはみ出さない | `pnpm exec vitest run packages/dragon/test/corner-badge.test.ts`の検査`corner-badge-inside-figure`が通る | #3187 |
| 線の無い段が同じ箱か中身の帯を続けて書き換える時、段の番号は同じ角に置かれ、全ての段で `overlaps` が 0 件 | `pnpm exec vitest run packages/dragon/test/badge-pile.test.ts`の検査`corner-badges-share-one-spot`が通る | #3187 |
| 重なりを知らせる文は、番号を絵柄に重ねた図で、日本語と英語の文を出す。重なりは描いた後の置き場所を書き換えて作る | `pnpm exec vitest run packages/dragon/test/overlap-notice.test.ts`の検査`overlap-message-in-both-languages`が通る | #3187 |
| 書き出しの命令が字の重ならない図を書き出す時、標準エラーに何も出さない | `pnpm exec vitest run packages/dragon/test/overlap-notice.test.ts`の検査`export-quiet-without-overlaps`が通る | #3187 |
| 編集画面で字の重ならない見本を開いた時、「読めています」だけが出て、重なりの欄も図の上の囲みも出ない | `pnpm exec vitest run apps/playground-spa/src/lib/overlap-notice.test.ts`の検査`editor-quiet-without-overlaps`が通る | #3187 |
| 見本帳の部品の見本、使い方の頁の例、packages/dragon/examples の全ての見本の全ての段で `overlaps` が 0 件のまま | `pnpm exec vitest run apps/playground-spa/src/lib/text-overlaps.test.ts`の検査`overlaps-none-in-every-example`が通る | #3187 |
