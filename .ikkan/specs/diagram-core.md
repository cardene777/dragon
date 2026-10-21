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
| 線の名前はその段の間だけ出て、どの時刻でも同時に見える数が 2 個以下 | `pnpm test`の検査`labels-show-only-during-their-step`が通る | #2985 |
| 段の番号は、その段が始まるまで出ない | `pnpm test`の検査`badges-hidden-before-their-step`が通る | #2985 |
| 色味を指定せずに描いた時、紙と墨で描く | `pnpm test`の検査`palette-defaults-to-paper`が通る | #2985 |
| 色味 3 案 (澄んだ色 / 紙と墨 / 夜の計器) の明暗それぞれで、1 型 / 2 型 / 3 型を模した全ての 2 色の差が 6 以上、通常の見え方の差が 15 以上ある | `pnpm test`の検査`palettes-keep-cvd-separation`が通る | #2985 |
| 図の種類ごとの描画が、色、字、余白、動きの値を共通の値の表からだけ読み、描画の file に色の値と字の大きさを直接書かない | `pnpm test`の検査`renderers-read-values-from-one-table`が通る | #2985 |
| 頁と書き出しの字が、同梱した Noto Sans JP と等幅の字で描かれ、端末の字に落ちない | `pnpm test`の検査`render-uses-bundled-fonts`が通る | #2985 |
| 動きを嫌う設定で図を開いた時、自動再生せず、段ごとの止め絵を釦で送れる | `pnpm test`の検査`reduced-motion-shows-stills`が通る | #2985 |
| 図を開いた時、各段の題と本文を段の順に読み上げの道具から読める | `pnpm test`の検査`steps-exposed-to-screen-readers`が通る | #2985 |
| 依存を足した後も、入れた依存が公開されている中身と一致する | `pnpm verify:deps`が終了 0 | #2985 |
