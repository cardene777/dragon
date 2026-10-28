# site

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| `/dragon/`、`/dragon/catalog`、`/dragon/catalog/<分類>`、`/dragon/editor`、`/dragon/docs`、`/dragon/release-notes` と、それ以外の経路を開いた時、それぞれ概要、カタログの一覧、カタログの分類、編集画面、使い方、更新履歴、見つからない頁が出る | `pnpm test`の検査`site-routes-render-each-screen`が通る | #3030 |
| 7 画面のどれでも、上部の帯に印と名前 `dragon` と添え書き、行き先 6 つ (概要 / カタログ / 編集画面 / 使い方 / 更新履歴 / GitHub)、言語の切替、明暗の切替、`編集画面を開く →` の釦が乗る | `pnpm test`の検査`site-header-on-every-screen`が通る | #3030、#3071、#3075 |
| 帯の行き先のうち今いる画面の物に現在地の印が付き、行き先を押すと頁を読み直さずにその画面へ移る | `pnpm test`の検査`site-header-marks-current-and-navigates`が通る | #3030、#3071、#3075 |
| 色味を選んでいない時、サイトの地と面と字と差し色は紙と墨の値で、端末が暗い時は暗い側の値になり、明暗の切替で替わる (前の活版の値で固定した色の検査を置き換える) | `pnpm test`の検査`site-colors-follow-palette`が通る | #3030、#3033 |
| 上の帯の色味の切替 (紙と墨、澄んだ色、夜の計器) で、サイトの地と面と字と差し色と頁の全部の図が今の明暗の側の色味の値に替わり、頁を開き直しても残り、幅 720 以下では畳んだ行き先の面の中で切り替えられる | `pnpm test`の検査`site-palette-switch-recolors-site-and-diagrams`が通る | #3033 |
| 7 画面のどれを幅 1440 と幅 390 で、明暗それぞれで開いても、頁が横にあふれない | `pnpm test`の検査`site-screens-no-overflow`が通る | #3030、#3063、#3065、#3067、#3071、#3075 |
| 7 画面のどれでも言語を EN に切り替えると、帯と画面の言葉が英語になり、仮名と漢字が残らない | `pnpm test`の検査`site-screens-switch-to-english`が通る | #3030、#3071、#3075 |
| 概要の頁に、呼びかけ、記法と図の実物、特長 3 つ、3 手順、用例 3 つ、最後の呼びかけの 6 区画がこの順で並び、実物の図と用例の図は今の記法で書いた見本が動いて描かれる | `pnpm test`の検査`home-has-six-sections-with-live-diagrams`が通る | #3032、#3079 |
| カタログの一覧に分類の札が並び、各札が番号、見本の件数、見出し、説明、`開く →` を持ち、件数は分類に載せた見本の数と一致する | `pnpm test`の検査`catalog-cards-count-from-samples`が通る | #3033 |
| カタログの分類の頁は左に検索と見本の一覧、右に選んだ見本 1 つを持つ。右の見本は名前と説明、図とコードの見出し、色味の切替、縮小と拡大と幅に合わせる、拡大の釦、動く図、段の札、進み具合の帯、段の本文、編集画面で開くを持ち、一覧で別の見本を選ぶと右が替わり、検索で一覧が絞られ、知らない分類は見つからない頁になる | `pnpm test`の検査`category-page-lists-samples-and-previews-one`が通る | #3033、#3067 |
| 分類の頁のコードの見出しが、記法と JSON の切替、写す釦、選んだ側の本文を持つ | `pnpm test`の検査`category-item-shows-source`が通る | #3033 |
| 拡大の釦で画面を覆う重ね窓に図 1 つが大きく出て、閉じる釦と Escape で閉じ、「編集画面で開く」でその記法が入った編集画面が開く | `pnpm test`の検査`category-item-opens-overlay-and-editor`が通る | #3033 |
| カタログに載せた見本がすべて今の記法で読めて、schema の検査で誤りが 0 件になる | `pnpm test`の検査`catalog-samples-all-valid`が通る | #3033 |
| 分類の頁の色味の切替 (サイトと同じ、紙と墨、澄んだ色、夜の計器) はその見本の図の色だけを替え、「サイトと同じ」で上の帯の色味に戻る | `pnpm test`の検査`category-palette-overrides-one-diagram`が通る | #3033 |
| 使い方の頁に前置き、見出し、編集画面とカタログへの釦 2 つ、特長の札と、今の記法 (箱、線、区画、段、帯、運ぶ物、JSON、書き出し) を説明する節が並び、本文の記法の例はすべて新しい形で読めて図が描かれる。dragon記法の全ての行の種類 (行の頭の語と、線の `->`) を節の例のどれかが使い、節の本文のどれかがその語で説明する | `pnpm test`の検査`docs-sections-cover-notation-and-examples-parse`が通る | #3034、#3079、#3137 |
| 概要の版の札と更新履歴の版が、`packages/dragon/package.json` の版を build 時に差し込んだ `v{major}.{minor}` になる | `pnpm test`の検査`version-badge-from-package`が通る | #3035 |
| 更新履歴の頁に版と、変更の記録 (`CHANGELOG.md`) を GitHub で見る釦 1 つが出る | `pnpm test`の検査`release-notes-shows-version-and-changelog-link`が通る | #3035 |
| 見つからない頁に大きな `404` と行き先の釦が並び、説明の入口の数が釦の数と一致する | `pnpm test`の検査`not-found-counts-destinations`が通る | #3035 |
| 編集画面の左の棚に新規作成の釦、見本と部品と記法の 3 つの見出し、絞り込みの入力欄があり、見本を選ぶとその記法が書く欄に入り、部品を選ぶとその部品の行が書く欄に足され、絞り込むと一覧が絞れる。新規作成で書類名の欄に拡張子の無い new と出て、そのまま書き出すと new.dragon で保存される | `pnpm test`の検査`editor-shelf-loads-samples-parts-and-filters`が通る | #3031、#3087、#3089 |
| 編集画面の書く欄の上に記法と JSON の切替、書類名、取り込みと書き出しの釦があり、取り込んだ file の記法が欄に入り、書き出しで今の記法が `.dragon` の file として保存される。書類名の欄は拡張子を出さず、見本の oauth は oauth、取り込んだ edited.dragon は edited と出て、書き出す file は edited.dragon、欄に memo と書くと memo.dragon になる | `pnpm test`の検査`editor-imports-and-exports-notation`が通る | #3031、#3087、#3089 |
| 編集画面の図の側に字の大きさ、拡大、縮小、全体に合わせる、格子、全画面の道具があり、拡大と縮小で図の大きさが変わり、格子を出すと 24px 刻みの点が出る | `pnpm test`の検査`editor-stage-tools-change-view`が通る | #3031、#3063、#3065、#3077 |
| 幅 1440 で編集画面に OAuth と CCIP の見本を出した時、箱の名前の字が 11px 以上で描かれ、どの箱も図の領域の内側に収まり、全体図が箱に重ならない | `pnpm test`の検査`editor-diagram-readable-and-not-clipped`が通る | #3031 |
| 編集画面で段を 2 つ以上持つ図を出した時、図の左上に `段 {N} / {全体} · {題}` の札が、下端に段の数だけ区切った進み具合の帯が出る | `pnpm test`の検査`editor-phase-badge-and-progress`が通る | #3031、#3061 |
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
| 画面の大きさ 360 × 780、390 × 844、430 × 932 で oauth と ccip を拡大の重ね窓で開いた時、見出しに説明が見えず、題は切れずに全部見える | `pnpm test`の検査`narrow-overlay-head-title-only`が通る | #3059 |
| 画面の大きさ 360 × 780 と 390 × 844 で oauth と ccip を拡大の重ね窓で開いた時、見出しが今 (360 × 780 で 133px と 156px、390 × 844 で 133px と 133px) より低く、図の枠の中が今 (472px と 435px、542px と 522px) より高い | `pnpm test`の検査`narrow-overlay-head-lower`が通る | #3059、#3067 |
| 画面の大きさ 360 × 780、390 × 844、430 × 932 で重ね窓を開いた時、見出しの題と閉じる釦が見出しの中に収まって重ならず、閉じる釦を押すと重ね窓が閉じる | `pnpm test`の検査`narrow-overlay-head-close-works`が通る | #3059、#3067 |
| 画面の大きさ 560 × 900 と 1440 × 900 で oauth と ccip を拡大の重ね窓で開いた時、見出しに題と説明が見える | `pnpm test`の検査`wide-overlay-head-keeps-description`が通る | #3059 |
| 1440 × 900 のカタログの頁で、拡大の釦で画面を覆う重ね窓に見本の題と図が出て、閉じる釦と Escape で閉じる | `pnpm test`の検査`category-item-opens-overlay-and-editor`が通る | #3059 |
| 重ね窓で、どの段でも送らずに図の全体が見え、全体図を出す時は図の枠の中にある | `pnpm test`の検査`catalog-overlay-figure-whole-without-scroll`が通る | #3059 |
| 390 × 844 と 1440 × 900 の oauth の重ね窓で、寄って追う窓の高さが図の枠の中で見える高さと合い、図が枠に収まる | `pnpm test`の検査`overlay-follow-window-fills-frame-height`が通る | #3059 |
| 360 × 780 から 430 × 932 の重ね窓で、oauth の寄って追う窓が枠の幅いっぱいで、図が枠の中に送らずに収まる | `pnpm test`の検査`narrow-follow-window-fills-frame-width`が通る | #3059 |
| 360 × 780 から 430 × 932 の重ね窓と編集画面で、段を 1 つずつ送った時、どの段でも帯の高さと図の大きさと位置が 1 段目と同じで、題と本文が帯の中身の幅に収まる | `pnpm test`の検査`narrow-caption-steady-and-inside`が通る | #3059、#3061 |
| 390 × 844 から 1440 × 900 で構成図と時系列図の全部の見本を重ね窓で開き、段を 1 つずつ送った時、どの段でも帯の高さと図の大きさと位置が 1 段目と同じ | `pnpm test`の検査`overlay-figure-steady-across-steps`が通る | #3059 |
| 画面の大きさ 360 × 780、390 × 844、430 × 932 で oauth と ccip を編集画面で開いた時、段の札が見えない | `pnpm test`の検査`narrow-editor-hides-phase-badge`が通る | #3061 |
| 画面の大きさ 360 × 780 と 390 × 844 で oauth と ccip を編集画面で開いた時、道具の帯と図の枠の中の間が今 (48px) より小さく、最初の画面に見える記法の欄が今 (360 × 780 で 93px と -41px、390 × 844 で 163px と 16px) より高い | `pnpm test`の検査`narrow-editor-figure-starts-higher`が通る | #3061、#3071 |
| 画面の大きさ 360 × 780、390 × 844、430 × 932 で oauth と ccip を編集画面で開いた時、図の箱が道具の帯に重ならず、図の枠の中の上端より上に出ない。寄って追う図では、窓の切り抜きの中に見える部分だけを箱として数える | `pnpm test`の検査`narrow-editor-figure-clear-of-toolbar`が通る | #3061、#3120 |
| 画面の大きさ 390 × 844 の編集画面で、記法に誤りがあり前の図を出している間、図の枠の上の余白が今と同じ 48px で、その旨の札が図の箱に重ならない | `pnpm test`の検査`narrow-editor-kept-notice-keeps-room`が通る | #3061 |
| 携帯の幅の編集画面で、前の図を出している旨の札が 1 行に収まり、寄って追う図の窓の上の頭の列の箱 (上から 8px) に重ならない | `pnpm test`の検査`narrow-editor-kept-notice-keeps-room`が通る | #3120 |
| 画面の大きさ 560 × 900 と 1440 × 900 で oauth と ccip を編集画面で開いた時、段の札が `段 {N} / {全体} · {題}` で出て、図の枠の上の余白が 48px のまま | `pnpm test`の検査`wide-editor-keeps-phase-badge`が通る | #3061 |
| 画面の大きさ 390 × 844 と 1440 × 900 のカタログの頁の見本の枠で、段の札が `段 {N} / {全体} · {題}` で出る | `pnpm test`の検査`catalog-preview-keeps-phase-badge`が通る | #3061 |
| 編集画面の見本の図で、箱の名前の字が 11px を割らず、箱が図の領域の外に出ず、全体図と段の札が箱に重ならない | `pnpm test`の検査`editor-diagram-readable-and-not-clipped`が通る | #3061 |
| 画面の大きさ 360 × 780、390 × 844、430 × 932 で intro と oauth を編集画面で開いた時、道具の帯が横に送る分を持たず、字の大小、方眼、全画面、縮小、拡大の釦と倍率が全部帯の中に見える | `pnpm test`の検査`narrow-editor-tools-fit-one-row`が通る | #3063、#3065、#3077 |
| 画面の大きさ 360 × 780、390 × 844、430 × 932 の編集画面で、道具の帯に実況表示の札と色味の 3 つの丸が見えない | `pnpm test`の検査`narrow-editor-tools-hide-live-and-swatches`が通る | #3063、#3065、#3077 |
| 画面の大きさ 360 × 780 で intro を編集画面で開いた時、拡大の釦で倍率が上がり、縮小の釦で下がり、頁が横にあふれない | `pnpm test`の検査`narrow-editor-tools-zoom-works`が通る | #3063、#3065 |
| 画面の大きさ 390 × 844 の編集画面で、上の帯の畳んだ面の色味の切替で夜の計器を選ぶと、編集画面の図が夜の計器の色味で描かれる | `pnpm test`の検査`narrow-editor-site-palette-recolors-figure`が通る | #3063、#3071 |
| 画面の大きさ 560 × 900 と 1440 × 900 の編集画面で、道具の帯に実況表示の札、色味の 3 つの丸、字の大小、方眼、全画面、合わせる、縮小、拡大、倍率が今と同じ並びで出て、帯が横に送る分を持たない | `pnpm test`の検査`wide-editor-tools-keep-all`が通る | #3063、#3065、#3077 |
| 色味 3 案を編集画面で、明暗を上の帯で選んだ時、図の地の色と字の色が選んだ色味と明暗の値になり、頁の地は色味で替わらず前のサイトの明暗の値になる | `pnpm test`の検査`palette-and-theme-apply-to-diagram`が通る | #3063、#3071 |
| 画面の大きさ 360 × 780、390 × 844、430 × 932 で intro と oauth を編集画面で開いた時、道具の帯と記法の欄の上の帯の釦、切替の札、ファイル名の欄が縦横 44px 以上あり、それぞれの四隅を押すとその部品に当たる | `pnpm test`の検査`narrow-editor-bars-touch-targets`が通る | #3065、#3077、#3085 |
| 画面の大きさ 360 × 780、390 × 844、430 × 932 で intro を編集画面で開いた時、道具の帯が合わせるの釦を出さず、字を小さく、字を大きく、方眼、全画面、縮小、倍率、拡大の順に並び、拡大した後に倍率の釦を押すと元の倍率に戻る。oauth では倍率の釦が押せない状態で「—」を出す | `pnpm test`の検査`narrow-editor-zoom-level-fits`が通る | #3065、#3067、#3077 |
| 画面の大きさ 360 × 780、390 × 844、430 × 932 の編集画面で、記法の欄の上の帯が横に送る分を持たず、棚を開く釦、記法と JSON の切替の札、ファイル名の欄、読み込みと書き出しの釦、畳むの釦が全部帯の中に見え、JSON の札で JSON の側に替わり、畳むの釦で書く欄が畳まれる | `pnpm test`の検査`narrow-editor-code-bar-works`が通る | #3065、#3077 |
| 画面の大きさ 560 × 900 と 1440 × 900 の編集画面で、2 つの帯の釦が 30 × 30px、切替の札の高さが 27px、ファイル名の欄の高さが 26px のままで、倍率は釦でなく字で出る | `pnpm test`の検査`wide-editor-bars-keep-size`が通る | #3065、#3077 |
| 画面の大きさ 360 × 780、390 × 844、430 × 932 で時系列図の分類の頁を開いて最初の見本を選んだ時、一覧の検索の欄と見本の行、見本の枠の図とコードの切替の札、色味の選択、縮小と倍率と拡大の釦、拡大の釦、編集画面で開くの字の釦が縦横 44px 以上あり、それぞれの四隅を押すとその部品に当たる | `pnpm test`の検査`narrow-catalog-touch-targets`が通る | #3067、#3078、#3085 |
| 同じ 3 つの大きさで、検索の欄に字を入れた時の消す釦、コードの側の記法と JSON の切替と写すの釦、重ね窓の閉じるの釦が縦横 44px 以上あり、それぞれの四隅を押すとその部品に当たる | `pnpm test`の検査`narrow-catalog-touch-targets-after-action`が通る | #3067、#3078、#3085 |
| 同じ 3 つの大きさで時系列図の分類の頁の最初の見本を選んだ時、縮小と拡大の組が合わせるの釦を出さず、縮小、倍率、拡大の順に並び、拡大した後に倍率の釦を押すと元の倍率に戻る。寄って追う窓で描く 2 つ目の見本では倍率の釦が押せない状態で「—」を出す | `pnpm test`の検査`narrow-catalog-zoom-level-fits`が通る | #3067、#3078 |
| 同じ 3 つの大きさで時系列図の分類の頁を開いた時、頁が横にあふれず、縮小の釦で倍率が下がり、コードの見出しでコードの側に替わって JSON の切替で JSON の側が選ばれ、色味の選択で紙と墨を選べる | `pnpm test`の検査`narrow-catalog-parts-work`が通る | #3067、#3078 |
| 画面の大きさ 560 × 900 と 1440 × 900 の時系列図の分類の頁で、縮小と拡大と合わせるの釦が 28 × 26px、色味の選択の高さが 29px、重ね窓の閉じるの釦が 34 × 34px のままで、合わせるの釦が見え、倍率は釦でなく字で出る | `pnpm test`の検査`wide-catalog-parts-keep-size`が通る | #3067、#3078 |
| 画面の大きさ 360 × 780、390 × 844、430 × 932 で概要の頁を開いた時、見出しの帯の押せる部品 (名前の札、日本語と英語の切替、明暗の釦、一覧を開く釦) が縦横 44px 以上あり、それぞれの四隅を押すとその部品に当たる | `pnpm test`の検査`narrow-header-touch-targets`が通る | #3071、#3075、#3085 |
| 携帯の幅 360 × 780、390 × 844、430 × 932 で見出しの帯の一覧を開いた時、行き先の札 6 つ、色味の札 3 つ、編集画面を開く釦が四捨五入しない幅と高さで 44px 以上あり、それぞれの四隅を押すとその部品に当たる | `pnpm test`の検査`narrow-header-sheet-touch-targets`が通る | #3071、#3075、#3085 |
| 画面の大きさ 360 × 780、390 × 844、430 × 932 の概要の頁で、日本語と英語の切替で帯の言葉が替わり、明暗の釦で明暗が替わり、一覧を開く釦で一覧が開いて閉じ、一覧の色味の札で色味が替わる | `pnpm test`の検査`narrow-header-controls-work`が通る | #3071、#3075、#3085 |
| 画面の大きさ 560 × 900 と 1440 × 900 で概要の頁を開いた時、見出しの帯の押せる部品の大きさが今と同じ (560 × 900 で名前の札 85 × 27、日本語と英語の切替 31 × 25 と 32 × 25、明暗と一覧の釦 29 × 27) | `pnpm test`の検査`wide-header-keeps-size`が通る | #3071、#3075、#3085 |
| 画面の大きさ 390 × 844 で概要の頁を開いた時、帯の行き先が畳まれ、一覧を開く釦で行き先 6 つが出て、Escape で閉じ、行き先を押すとその画面へ移って一覧が閉じる | `pnpm test`の検査`site-header-folds-at-narrow-width`が通る | #3071、#3075 |
| 指で触る端末を模して画面の大きさ 600 × 960、768 × 1024、1024 × 1366、1366 × 1024 で概要の頁を開いた時、見出しの帯の押せる部品が縦横 44px 以上あり、それぞれの四隅を押すとその部品に当たる | `pnpm test`の検査`coarse-header-touch-targets`が通る | #3075、#3085 |
| 指で触る端末を模して画面の大きさ 768 × 1024 で概要の頁を開いた時、帯の行き先と色味の切替が畳まれて一覧を開く釦が出る。901 × 1200 と 1000 × 1200 では行き先と色味の切替が帯に縮まずに並び、編集画面を開く釦と一覧を開く釦が出ない。1024 × 1366 では行き先と色味の切替と編集画面を開く釦が帯に並び、一覧を開く釦が出ない | `pnpm test`の検査`coarse-header-folds-below-900`が通る | #3075 |
| 指で触る端末を模して画面の大きさ 600 × 960、768 × 1024 で見出しの帯の一覧を開いた時、行き先の札 6 つ、色味の札 3 つ、編集画面を開く釦が四捨五入しない幅と高さで 44px 以上あり、それぞれの四隅を押すとその部品に当たり、行き先を押すとその画面へ移って一覧が閉じる | `pnpm test`の検査`coarse-header-sheet-touch-targets`が通る | #3075、#3085 |
| 指で触る端末を模して画面の大きさ 1366 × 1024 の概要の頁で、日本語と英語の切替で帯の言葉が替わり、明暗の釦で明暗が替わり、帯の色味の切替で色味が替わり、行き先を押すとその画面へ移る | `pnpm test`の検査`coarse-header-controls-work`が通る | #3075、#3085 |
| 指で触る端末を模して画面の大きさ 600 × 960、768 × 1024、1366 × 1024 で 7 画面のどれを開いても、頁が横にあふれない | `pnpm test`の検査`coarse-screens-no-overflow`が通る | #3075 |
| マウスで使う画面の大きさ 768 × 1024 で概要の頁を開いた時、帯の行き先と色味の切替が畳まれず、見出しの帯の押せる部品の大きさが今と同じ | `pnpm test`の検査`mouse-tablet-header-keeps-size`が通る | #3075、#3085 |
| 指で触る端末を模して画面の大きさ 360 × 780、768 × 1024、1024 × 1366、1366 × 1024 で intro を編集画面で開き、棚を開いた時、棚と記法の欄の上の帯と図の側の道具の帯の見える押せる部品が縦横 44px 以上あり、それぞれの四隅を押すとその部品に当たる | `pnpm test`の検査`coarse-editor-touch-targets`が通る | #3077、#3085、#3087 |
| 指で触る端末を模して編集画面を開いた時、図の側の道具の帯の幅が 720px より狭い画面の大きさ 768 × 1024 と 1180 × 820 では実況表示と色味の丸が出ず、720px 以上ある 1024 × 1366 と 1366 × 1024 では実況表示、色味の 3 つの丸、字の大小、方眼、全画面、合わせる、縮小、拡大、倍率が今と同じ並びで出る | `pnpm test`の検査`coarse-editor-tools-drop-when-narrow`が通る | #3077 |
| 指で触る端末を模して画面の大きさ 768 × 1024、1024 × 1366、1180 × 820、1366 × 1024 で編集画面を日本語と英語で開いた時、記法の欄の上の帯と図の側の道具の帯が横に送る分を持たず、見える部品が全部帯の中に収まる | `pnpm test`の検査`coarse-editor-bars-fit`が通る | #3077、#3087 |
| 指で触る端末を模して画面の大きさ 1366 × 1024 の編集画面で、棚の部品の札で部品の一覧に替わり、JSON の札で JSON の側に替わり、拡大の釦で倍率が上がり、色味の丸で図の色味が替わる。768 × 1024 では棚を開く釦で棚が開き、見本の行を押すとその見本が書く欄に入る | `pnpm test`の検査`coarse-editor-controls-work`が通る | #3077 |
| マウスで使う画面の大きさ 768 × 1024 と 1440 × 900 の編集画面で、2 つの帯の釦が 30 × 30px、色味の丸が 16 × 16px、切替の札の高さが 27px、ファイル名の欄の高さが 26px、棚の新しく書くの釦の高さが 41px、棚の札の高さが 39px、絞り込みの欄の高さが 34px、見本の行の高さが 35px のまま | `pnpm test`の検査`mouse-tablet-editor-keeps-size`が通る | #3077、#3087 |
| 指で触る端末を模して画面の大きさ 360 × 780、768 × 1024、1024 × 1366、1366 × 1024 で時系列図の分類の頁を開いた時、道筋の札、検索の欄、一覧の行、見本の枠の部品 (図とコードの切替、色味、縮小、拡大、合わせるか倍率、拡大して見る、編集画面で開く) が縦横 44px 以上あり、それぞれの四隅を押すとその部品に当たる。カタログの一覧の頁の道筋の札も同じ | `pnpm test`の検査`coarse-catalog-touch-targets`が通る | #3078、#3085 |
| 指で触る端末を模して同じ 4 つの大きさで、検索に字を入れた時の消す釦、コードの側の切替と写す釦、重ね窓の閉じる釦が縦横 44px 以上あり、それぞれの四隅を押すとその部品に当たる | `pnpm test`の検査`coarse-catalog-touch-targets-after-action`が通る | #3078、#3085 |
| 指で触る端末を模して画面の大きさ 768 × 1024、1024 × 1366、1180 × 820、1366 × 1024 で時系列図の分類の頁を日本語と英語で開いた時、見本の枠の上の帯の部品が全部帯の中に収まって互いに重ならず、頁が横にあふれない | `pnpm test`の検査`coarse-catalog-bar-fits`が通る | #3078 |
| 指で触る端末を模して時系列図の分類の頁を開いた時、道筋の最初の札の字の左端が頁の題の左端と揃い、札の押せる範囲が隣の札にも区切りの › にも掛からない | `pnpm test`の検査`coarse-catalog-crumb-keeps-place`が通る | #3078 |
| 指で触る端末を模して画面の大きさ 1366 × 1024 と 768 × 1024 の時系列図の分類の頁で、検索に字を入れると一覧が絞られ消す釦で戻り、一覧の行で見本が替わり、縮小と拡大と合わせるの釦で倍率が変わり、コードの札と JSON の切替でコードの側の JSON に替わり、色味の選択で色味が替わり、拡大して見るの釦で重ね窓が開いて閉じるの釦で閉じ、道筋のカタログの札でカタログの一覧の頁へ移る | `pnpm test`の検査`coarse-catalog-parts-work`が通る | #3078 |
| マウスで使う画面の大きさ 768 × 1024 と 1440 × 900 の時系列図の分類の頁で、道筋の札の高さが 19px、検索の欄の高さが 36px、検索の消す釦が 24 × 24px、一覧の行の高さが 34px 以上、図とコードの切替の高さが 38px、色味の選択の高さが 29px、縮小と拡大と合わせるの釦が 28 × 26px、編集画面で開くの高さが 21px、コードの側の切替の高さが 32px、写すの釦の高さが 34px、重ね窓の閉じるの釦が 34 × 34px のまま | `pnpm test`の検査`mouse-tablet-catalog-keeps-size`が通る | #3078 |
| 指で触る端末を模して画面の大きさ 360 × 780、768 × 1024、1366 × 1024 で概要の頁と使い方の頁を開いた時、本文の釦と字だけの札 (使い方の節の終わりの札を含む) が四捨五入しない幅と高さで 44px 以上あり、それぞれの四隅を押すとその部品に当たる | `pnpm test`の検査`coarse-pages-touch-targets`が通る | #3079、#3085 |
| 指で触る端末を模して 360 × 780、768 × 1024、1366 × 1024 で 2 つの頁を開いた時、字だけの札の字の位置と、すぐ上の部品や区画の下端までの間が、マウスで使う時と同じ | `pnpm test`の検査`coarse-pages-text-links-keep-place`が通る | #3079、#3085 |
| 指で触る端末を模して画面の大きさ 768 × 1024 で、概要の呼びかけの編集画面を開くで編集画面へ、用例の下のカタログで図を見るでカタログの一覧へ、使い方の呼びかけの 5 分で始めるで編集画面へ移り、使い方の節の終わりの続きの札でその節へ移る | `pnpm test`の検査`coarse-pages-links-work`が通る | #3079、#3085 |
| マウスで使う画面の大きさ 768 × 1024 と 1440 × 900 で、概要と使い方の頁の枠のある釦の高さが 40px、字だけの札の高さが 30px のまま | `pnpm test`の検査`mouse-tablet-pages-keep-size`が通る | #3079、#3085 |
| 携帯の幅と指で触る時の段を送る釦が、四捨五入しない幅と高さで 44px 以上あり、四隅を押すとその釦に当たる。マウスで使う広い画面では 36 × 36px のまま | `pnpm test`の検査`narrow-player-buttons-touch-targets`、`coarse-player-buttons-touch-targets`、`wide-player-buttons-keep-size`が通る | #3085 |
| 指で触る端末を模して画面の大きさ 768 × 1024、834 × 1194、1024 × 768 で見本の oauth を編集画面で開いた時、日本語でも英語でも記法の欄の上の帯の書類名の欄に拡張子の無い oauth と出て、字が欄の中で切れない | `pnpm test`の検査`coarse-editor-file-name-fits`が通る | #3087、#3089 |
| 指で触る端末を模して画面の大きさ 768 × 1024、834 × 1194、1024 × 768 の編集画面で、日本語でも英語でも棚の新規作成を押した時、記法の欄の上の帯の書類名の欄に new と出て、字が欄の中で切れない | `pnpm test`の検査`coarse-editor-new-file-name-fits`が通る | #3089 |
| カタログの時系列図の oauth を、見本の枠 (画面の幅 360px、390px、430px) と拡大の重ね窓 (360px、390px、430px、860px、1440px) で開いて段 1 から最後まで送った時、どの段でも頭の列の上に並べた点で一番上に在る要素が図の中の物である | `pnpm test`の検査`catalog-heads-strip-uncovered`が通る | #3124、#3128 |
| 編集画面で oauth を画面の幅 360px、390px、430px、860px で開き、ふだんの状態と記法に誤りがあって前の図を出している状態のそれぞれで段 1 から最後まで送った時、どの段でも頭の列の上に並べた点で一番上に在る要素が図の中の物である | `pnpm test`の検査`editor-heads-strip-uncovered`が通る | #3126、#3128 |
| `/dragon/catalog` を開いた時、一覧が部品、図の種類だけの部品、図の 3 つの段に分かれ、どの段にも 1 件以上の札が並ぶ | `pnpm test`の検査`catalog-index-three-sections`が通る | #3166 |
| どの図でも使う部品の頁 (`/dragon/catalog/part/<部品>`) を開いた時、時系列図と構成図の 2 つの図が並び、どちらも記法から描いた物として段を送れる | `pnpm test`の検査`catalog-common-part-shows-both-kinds`が通る | #3166 |
| 図の種類だけの部品 (生存線、区画) の頁を開いた時、図は 1 つで、それを使える図の種類の名前と、その図の頁への飛び先が載る | `pnpm test`の検査`catalog-kind-part-names-its-kind`が通る | #3166 |
| 図の頁 (`/dragon/catalog/<図の種類>`) を開いた時、その図が使う部品の一覧が載り、どの部品の札もその部品の頁へ飛ぶ | `pnpm test`の検査`catalog-kind-page-links-parts`が通る | #3166 |
| 部品の頁の図の記法を編集画面で開いた時、編集画面の欄にその記法がそのまま入る | `pnpm test`の検査`catalog-part-opens-in-editor`が通る | #3166 |
| 英語に切り替えた時、部品の頁の名前と説明と図の記法が英語で出る | `pnpm test`の検査`catalog-parts-in-english`が通る | #3166 |
| `words.ts` の表 (`KINDS`、`HEADS`、`ATTRS`) が持つ語と鍵のうち、どの部品にも割り当てられていない物が 0 件 | `pnpm test`の検査`catalog-parts-cover-every-word`が通る | #3166 |
| どの部品の図の記法も、その部品に割り当てた語と鍵を使い、記法から原本の JSON に変換できて JSON Schema の検査を通る | `pnpm test`の検査`catalog-part-snippets-use-their-words`が通る | #3166 |
| build した頁の置き場に、どの部品の頁の経路にも `.html` の写しがあり、直に開いても見つからない頁にならない | `pnpm test`の検査`catalog-part-routes-built`が通る | #3166 |
| 今の見本 (入門、OAuth、CCIP) は、今どおり図の頁から開いて重ね窓と編集画面で見られる | `pnpm test`の検査`category-item-opens-overlay-and-editor`が通る | #3166 |
| 表に無い深い経路 (`/dragon/catalog/sequence/extra` など) は、今どおり見つからない頁を出す | `pnpm test`の検査`site-routes-render-each-screen`が通る | #3166 |
| 一式 (型検査、build、lint、全ての検査) が通る | `bash -c 'pnpm typecheck && pnpm build && pnpm lint && pnpm exec vitest run --reporter=verbose'` が終了 0 | #3166 |
