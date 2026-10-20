# diagram-core

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 7 つの意匠の値の表と、意匠を切り替える仕組みが repo に残っていない | `pnpm test`の検査`designs-folded-into-one-look`が通る | #2983 |
| 今の図の一覧 (playground の catalog の図) が repo に残っていない | `pnpm test`の検査`old-catalog-removed`が通る | #2983 |
