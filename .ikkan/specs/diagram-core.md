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
