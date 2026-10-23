# site

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `/dragon/`、`/dragon/catalog`、`/dragon/catalog/<分類>`、`/dragon/editor`、`/dragon/docs`、`/dragon/release-notes` と、それ以外の経路を開いた時、それぞれ概要、カタログの一覧、カタログの分類、編集画面、使い方、更新履歴、見つからない頁が出る | `pnpm test`の検査`site-routes-render-each-screen`が通る | #3030 |
| 7 画面のどれでも、上部の帯に印と名前 `dragon` と添え書き、行き先 6 つ (概要 / カタログ / 編集画面 / 使い方 / 更新履歴 / GitHub)、言語の切替、明暗の切替、`編集画面を開く →` の釦が乗る | `pnpm test`の検査`site-header-on-every-screen`が通る | #3030 |
| 帯の行き先のうち今いる画面の物に現在地の印が付き、行き先を押すと頁を読み直さずにその画面へ移る | `pnpm test`の検査`site-header-marks-current-and-navigates`が通る | #3030 |
| 色味を選んでいない時、サイトの地と面と字と差し色は紙と墨の値で、端末が暗い時は暗い側の値になり、明暗の切替で替わる (前の活版の値で固定した色の検査を置き換える) | `pnpm test`の検査`site-colors-follow-palette`が通る | #3030、#3033 |
| 上の帯の色味の切替 (紙と墨、澄んだ色、夜の計器) で、サイトの地と面と字と差し色と頁の全部の図が今の明暗の側の色味の値に替わり、頁を開き直しても残り、幅 720 以下では畳んだ行き先の面の中で切り替えられる | `pnpm test`の検査`site-palette-switch-recolors-site-and-diagrams`が通る | #3033 |
| 7 画面のどれを幅 1440 と幅 390 で、明暗それぞれで開いても、頁が横にあふれない | `pnpm test`の検査`site-screens-no-overflow`が通る | #3030 |
| 7 画面のどれでも言語を EN に切り替えると、帯と画面の言葉が英語になり、仮名と漢字が残らない | `pnpm test`の検査`site-screens-switch-to-english`が通る | #3030 |
| 概要の頁に、呼びかけ、記法と図の実物、特長 3 つ、3 手順、用例 3 つ、最後の呼びかけの 6 区画がこの順で並び、実物の図と用例の図は今の記法で書いた見本が動いて描かれる | `pnpm test`の検査`home-has-six-sections-with-live-diagrams`が通る | #3032 |
| カタログの一覧に分類の札が並び、各札が番号、見本の件数、見出し、説明、`開く →` を持ち、件数は分類に載せた見本の数と一致する | `pnpm test`の検査`catalog-cards-count-from-samples`が通る | #3033 |
| カタログの分類の頁は左に検索と見本の一覧、右に選んだ見本 1 つを持つ。右の見本は名前と説明、図とコードの見出し、色味の切替、縮小と拡大と幅に合わせる、拡大の釦、動く図、段の札、進み具合の帯、段の本文、編集画面で開くを持ち、一覧で別の見本を選ぶと右が替わり、検索で一覧が絞られ、知らない分類は見つからない頁になる | `pnpm test`の検査`category-page-lists-samples-and-previews-one`が通る | #3033 |
| 分類の頁のコードの見出しが、記法と JSON の切替、写す釦、選んだ側の本文を持つ | `pnpm test`の検査`category-item-shows-source`が通る | #3033 |
| 拡大の釦で画面を覆う重ね窓に図 1 つが大きく出て、閉じる釦と Escape で閉じ、「編集画面で開く」でその記法が入った編集画面が開く | `pnpm test`の検査`category-item-opens-overlay-and-editor`が通る | #3033 |
| カタログに載せた見本がすべて今の記法で読めて、schema の検査で誤りが 0 件になる | `pnpm test`の検査`catalog-samples-all-valid`が通る | #3033 |
| 分類の頁の色味の切替 (サイトと同じ、紙と墨、澄んだ色、夜の計器) はその見本の図の色だけを替え、「サイトと同じ」で上の帯の色味に戻る | `pnpm test`の検査`category-palette-overrides-one-diagram`が通る | #3033 |
| 使い方の頁に前置き、見出し、編集画面とカタログへの釦 2 つ、特長の札と、今の記法 (箱、線、区画、段、帯、運ぶ物、JSON、書き出し) を説明する節が並び、本文の記法の例はすべて読めて図が描かれる | `pnpm test`の検査`docs-sections-cover-notation-and-examples-parse`が通る | #3034 |
| 概要の版の札と更新履歴の版が、`packages/dragon/package.json` の版を build 時に差し込んだ `v{major}.{minor}` になる | `pnpm test`の検査`version-badge-from-package`が通る | #3035 |
| 更新履歴の頁に版と、変更の記録 (`CHANGELOG.md`) を GitHub で見る釦 1 つが出る | `pnpm test`の検査`release-notes-shows-version-and-changelog-link`が通る | #3035 |
| 見つからない頁に大きな `404` と行き先の釦が並び、説明の入口の数が釦の数と一致する | `pnpm test`の検査`not-found-counts-destinations`が通る | #3035 |
| 編集画面の左の棚に新規作成の釦、見本と部品と記法の 3 つの見出し、絞り込みの入力欄があり、見本を選ぶとその記法が書く欄に入り、部品を選ぶとその部品の行が書く欄に足され、絞り込むと一覧が絞れる | `pnpm test`の検査`editor-shelf-loads-samples-parts-and-filters`が通る | #3031 |
| 編集画面の書く欄の上に記法と JSON の切替、書類名、取り込みと書き出しの釦があり、取り込んだ file の記法が欄に入り、書き出しで今の記法が `.dragon` の file として保存される | `pnpm test`の検査`editor-imports-and-exports-notation`が通る | #3031 |
| 編集画面の図の側に字の大きさ、拡大、縮小、全体に合わせる、格子、全画面の道具があり、拡大と縮小で図の大きさが変わり、格子を出すと 24px 刻みの点が出る | `pnpm test`の検査`editor-stage-tools-change-view`が通る | #3031 |
| 幅 1440 で編集画面に OAuth と CCIP の見本を出した時、箱の名前の字が 11px 以上で描かれ、どの箱も図の領域の内側に収まり、全体図が箱に重ならない | `pnpm test`の検査`editor-diagram-readable-and-not-clipped`が通る | #3031 |
| 編集画面で段を 2 つ以上持つ図を出した時、図の左上に `段 {N} / {全体} · {題}` の札が、下端に段の数だけ区切った進み具合の帯が出る | `pnpm test`の検査`editor-phase-badge-and-progress`が通る | #3031 |
| 編集画面の書く欄の下の知らせの欄に、記法の読み取りと schema の誤りを行番号付きで出し、行番号を押すと書く欄がその行へ動いて行が選ばれる | `pnpm test`の検査`editor-notice-lists-errors-with-lines`が通る | #3031 |
| 編集画面で書く欄の記法を書き換えた時、右の図が書き換えた内容で描き直される | `pnpm test`の検査`editing-notation-redraws-diagram`が通る | #3030、#3031 |
| 編集画面で JSON の側に切り替えた時、今の図の JSON が出て、JSON を書き換えると図と記法の側に反映する | `pnpm test`の検査`json-side-edits-sync-to-notation`が通る | #3030、#3031 |
| 書いた中身が URL の `#` の後ろに入り、その URL を新しく開くと同じ記法と図が出る | `pnpm test`の検査`url-hash-restores-notation`が通る | #3030、#3031 |
| 頁の図を描く code が `@cardenelabs/dragon` の部品を呼び、`apps/playground-spa` の中に SVG を組む code が無い | `pnpm test`の検査`page-draws-with-package-parts`が通る | #3030、#3031 |
| 配る頁の CSP が、script を自分の置き場だけにし、inline と eval を許さない | `pnpm test`の検査`csp-script-self-only`が通る | #3030 |
| カタログの構成図の頁 (`/dragon/catalog/architecture`) を幅 390px と 860px で開いた時、寄って追う図の窓の枠 (`.dg-vp-frame`) と全体図の地 (`.dg-mm-bg`) が、図の枠 (`.dg-frame`) の中に全部収まる | `pnpm test`の検査`catalog-follow-figure-whole-in-frame`が通る | #3044 |
| 時系列図のカタログの頁 (`/dragon/catalog/sequence`) を幅 390px と 860px と 1440px (高さ 900px) で開いた時、全体を止めて見せる図の枠 (`[data-catalog="stage"]`) の高さが 522px (`clamp(360px, 58vh, 620px)` の値) のまま | `pnpm test`の検査`catalog-fixed-figure-keeps-frame-height`が通る | #3044 |
| 編集画面を幅 390px と 860px で開き、oauth と ccip の見本を段 1 から最後の段まで進めた時、どの段でも全体図の地が窓の枠と重ならず、図の枠の中に全部見える | `pnpm test`の検査`editor-overview-beside-window-and-in-frame`が通る | #3044 |
| 画面の大きさ 390 × 844、860 × 900、1024 × 768、1440 × 900、1280 × 720 で、構成図と時系列図のカタログの頁の全部の見本について拡大の重ね窓を開き、段を 1 つずつ送った時、どの段でも図の枠 (`.dg-frame`) を送らずに図の全体が見える。寄って追う図では窓の枠 (`.dg-vp-frame`) と全体図の地 (`.dg-mm-bg`) が図の枠の中に全部収まる | `pnpm test`の検査`catalog-overlay-figure-whole-without-scroll`が通る | #3047 |
| 再生の部品に枠の中で見える高さに収めるよう頼んだ時 (`fitHeight`)、幅 390px と 560px の枠で oauth と ccip を寄って追う図にすると、図の高さが枠の中で見える高さを超えない | `pnpm test`の検査`follow-figure-fits-frame-height`が通る | #3047 |
| 再生の部品に `fitHeight` を頼んだ時、枠の高さに全体を収めると箱の名前の字が読める下限を割る図 (幅 1200px と高さ 675px の枠の oauth) は寄って追う図になり、収めても読める図 (同じ枠の ccip) と、書き手が見せ方を決めた図は今の見せ方のまま | `pnpm test`の検査`fit-height-turns-tall-figure-follow`が通る | #3047 |
| 再生の部品に `fitHeight` を頼まない時は、枠の高さが低くても見せ方を枠の幅だけで選ぶ (幅 1200px と高さ 300px の枠の oauth は全体を止めて見せる図) | `pnpm test`の検査`view-by-width-without-fit-height`が通る | #3047 |
| 再生の部品に高さを頼まない時、幅 390px と 560px の枠で oauth と ccip を寄って追う図にすると、窓の高さは今と同じく枠の幅の 0.75 倍 (320px 以上、図の高さ以下) | `pnpm test`の検査`follow-window-height-from-width`が通る | #3047 |
| 拡大の重ね窓の図が、見本の枠の図より大きく出る | `pnpm test`の検査`category-item-opens-overlay-and-editor`が通る | #3047 |
| カタログの構成図の頁の見本の枠で、寄って追う図の窓と全体図が枠の中に全部収まる | `pnpm test`の検査`catalog-follow-figure-whole-in-frame`が通る | #3047 |
| 編集画面で oauth と ccip の見本を段 1 から最後まで進めた時、全体図が窓と重ならず図の枠の中に全部見える | `pnpm test`の検査`editor-overview-beside-window-and-in-frame`が通る | #3047 |
| 1440 × 900 の編集画面で oauth と ccip の見本を開いた時、箱の名前の字が今と同じく 11px 以上で、箱が図の枠の外に出ない | `pnpm test`の検査`editor-diagram-readable-and-not-clipped`が通る | #3047 |
| 画面の大きさ 390 × 844、860 × 900、1024 × 768、1280 × 720、1440 × 900 で、構成図と時系列図のカタログの頁の全部の見本を拡大の重ね窓で開いた時、本文が最も長い段の本文の下端と重ね窓の札 (`.catalog-overlay-card`) の下の縁の間が 8px 以上ある | `pnpm test`の検査`overlay-caption-clear-of-bottom-edge`が通る | #3051 |
| 1440 × 900 の編集画面で oauth と ccip の見本を開いた時、本文が最も長い段の本文の下端と図の側 (`[data-playground="figure"]`) の下の縁の間が 8px 以上ある | `pnpm test`の検査`editor-caption-clear-of-bottom-edge`が通る | #3051 |
| 1280 × 720 で構成図のカタログの頁の 1 番目の見本を拡大の重ね窓で開いた時、図は今と同じく全体を止めて見せる図 (`data-view="fixed"`) のまま | `pnpm test`の検査`overlay-low-screen-keeps-whole-figure`が通る | #3051 |
| 重ね窓で、どの段でも送らずに図の全体が見える | `pnpm test`の検査`catalog-overlay-figure-whole-without-scroll`が通る | #3051 |
| 重ね窓で段を 1 つずつ送った時、どの段でも段の本文の帯の高さと図の大きさと位置が 1 段目と同じ | `pnpm test`の検査`overlay-figure-steady-across-steps`が通る | #3051 |
| 編集画面で段を 1 つずつ送った時、どの段でも段の本文の帯の高さと図の大きさと位置が 1 段目と同じ | `pnpm test`の検査`editor-figure-steady-across-steps`が通る | #3051 |
