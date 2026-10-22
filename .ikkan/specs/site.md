# site

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `/dragon/`、`/dragon/catalog`、`/dragon/catalog/<分類>`、`/dragon/editor`、`/dragon/docs`、`/dragon/release-notes` と、それ以外の経路を開いた時、それぞれ概要、カタログの一覧、カタログの分類、編集画面、使い方、更新履歴、見つからない頁が出る | `pnpm test`の検査`site-routes-render-each-screen`が通る | #3030 |
| 7 画面のどれでも、上部の帯に印と名前 `dragon` と添え書き、行き先 6 つ (概要 / カタログ / 編集画面 / 使い方 / 更新履歴 / GitHub)、言語の切替、明暗の切替、`編集画面を開く →` の釦が乗る | `pnpm test`の検査`site-header-on-every-screen`が通る | #3030 |
| 帯の行き先のうち今いる画面の物に現在地の印が付き、行き先を押すと頁を読み直さずにその画面へ移る | `pnpm test`の検査`site-header-marks-current-and-navigates`が通る | #3030 |
| 明るい側で開いた時、頁の地・面・字・差し色が前のサイトの既定の見た目 (`letterpress`) の値 (地 `#f6f1e6`、面 `#fffdf7`、字 `#2a231d`、差し色 `#c0421f`) になる | `pnpm test`の検査`site-colors-match-previous-site`が通る | #3030 |
| 7 画面のどれを幅 1440 と幅 390 で、明暗それぞれで開いても、頁が横にあふれない | `pnpm test`の検査`site-screens-no-overflow`が通る | #3030 |
| 7 画面のどれでも言語を EN に切り替えると、帯と画面の言葉が英語になり、仮名と漢字が残らない | `pnpm test`の検査`site-screens-switch-to-english`が通る | #3030 |
| 編集画面で書く欄の記法を書き換えた時、右の図が書き換えた内容で描き直される | `pnpm test`の検査`editing-notation-redraws-diagram`が通る | #3030 |
| 編集画面で JSON の側に切り替えた時、今の図の JSON が出て、JSON を書き換えると図と記法の側に反映する | `pnpm test`の検査`json-side-edits-sync-to-notation`が通る | #3030 |
| 書いた中身が URL の `#` の後ろに入り、その URL を新しく開くと同じ記法と図が出る | `pnpm test`の検査`url-hash-restores-notation`が通る | #3030 |
| 頁の図を描く code が `@cardenelabs/dragon` の部品を呼び、`apps/playground-spa` の中に SVG を組む code が無い | `pnpm test`の検査`page-draws-with-package-parts`が通る | #3030 |
| 配る頁の CSP が、script を自分の置き場だけにし、inline と eval を許さない | `pnpm test`の検査`csp-script-self-only`が通る | #3030 |
