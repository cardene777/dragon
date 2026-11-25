# embed

| 条件 | 確かめ方 | 出元 |
|---|---|---|
| 帯つきの図の帯は、題の左にdragonの印を置き、コード、エディタ、コピー、エクスポート、拡大のボタンをこの順に並べ、ボタンは全部枠を持つ | `pnpm exec vitest run`の検査`bar-lists-mark-and-five-buttons-in-order`が通る | #3695 |
| dragonの印を押すと、見本帳の頁を新しいタブで開く | `pnpm exec vitest run`の検査`bar-mark-opens-gallery`が通る | #3695 |
| 拡大のボタンは字を持たず、アイコンと読み上げの名前だけを持つ | `pnpm exec vitest run`の検査`bar-expand-is-icon-only`が通る | #3695 |
| コピーの窓は記法、画像、エディタのURLの3つを名前だけで並べ、押した物をクリップボードに書く | `pnpm exec vitest run`の検査`bar-copy-menu-writes-clipboard`が通る | #3695 |
| エクスポートの窓は、画像の見出しの下にPNGとSVG、動きの見出しの下にHTMLとGIFとMP4、記法の見出しの下にdragon記法とJSONを、名前だけで並べる | `pnpm exec vitest run`の検査`export-menu-groups-seven-formats`が通る | #3695 |
| エクスポートの窓でdragon記法を押すと記法の`.dragon`のfileを、JSONを押すと図のJSONの`.json`のfileを保存する | `pnpm exec vitest run`の検査`export-menu-saves-notation-and-json`が通る | #3695 |
| エクスポートの窓の下で大きさ (1倍、2倍、3倍) と地 (塗る、透明) を選べ、PNGは選んだ倍の画素で保存し、透明を選ぶと地を塗らずに保存する | `pnpm exec vitest run`の検査`export-options-scale-and-transparent-png`が通る | #3695 |
| 帯の窓は1つだけ開き、片方を開くともう片方を閉じ、帯と図のほかの所を押すとどちらも閉じる | `pnpm exec vitest run`の検査`bar-opens-one-menu-at-a-time`が通る | #3695 |
| 帯の字の言葉は設定`lang`が勝ち、無ければ置いた所から上の`lang`属性に従い、どちらも無ければ英語になる | `pnpm exec vitest run`の検査`bar-text-follows-lang-setting-then-page`が通る | #3695 |
| 英語の頁に置いた図の帯は、ボタンの字をCode、Editor、Copy、Exportで出す | `pnpm exec vitest run`の検査`bar-text-english-on-english-page`が通る | #3695 |
| 帯つきの図は帯と図の見た目をstyle要素を作らずに`adoptedStyleSheets`で入れ、図の再生の部品の見た目も帯の内側に届く | `pnpm exec vitest run`の検査`frame-styles-without-style-elements`と`frame-player-styled-inside-frame`が通る | #3695 |
| `adoptedStyleSheets`を使えない頁では、設定`nonce`を付けたstyle要素で見た目を入れる | `pnpm exec vitest run`の検査`frame-falls-back-to-nonce-style`が通る | #3695 |
| 図の書体の変数は、dragonの書体の後に代わりの書体の並びを持ち、書体を読まない頁でも明朝に落ちない | `pnpm exec vitest run`の検査`diagram-font-has-fallback-stack`が通る | #3695 |
| 帯の色は今と同じく設定`headerColors`と`--dragon-header-*`の変数で変えられる | `pnpm exec vitest run`の検査`"header layout and controls remain the same when the embedder changes its colors"`が通る | #3695 |
| 今と同じ`mountFramedDiagram(host, source)`の呼び方で、帯つきの図が置け、`destroy()`で取り除ける | `pnpm exec vitest run`の検査`"shared frame mounts the native checkout player and destroys its input view"`が通る | #3695 |
| SDKの入口が出す関数と型と知らせの名前が、名前の一覧のfileと一致し、一覧に無い名前を出すか一覧の名前を出さないと検査が落ちる | `pnpm exec vitest run`の検査`sdk-entry-matches-name-list`が通る | #3698 |
| SDKの設定`look`で、帯の色、帯の書体と字の大きさと角と高さ、図を囲む枠の線と地を変えられる | `pnpm exec vitest run`の検査`sdk-look-sets-colors-font-radius-density-frame`が通る | #3698 |
| SDKの設定`buttons`で、帯のボタンを外し、並べ替え、置く側のボタンを足せ、足したボタンを押すと置く側の関数が図を受け取って呼ばれる | `pnpm exec vitest run`の検査`sdk-buttons-hide-reorder-and-add`が通る | #3698 |
| SDKで帯を出さずに図だけを置き、エクスポート、エディタで開く、コピーを関数で呼べる | `pnpm exec vitest run`の検査`sdk-headless-calls-export-editor-copy`が通る | #3698 |
| SDKで置いた図は、描けた・描けなかった、段が変わった、エクスポートした、エディタで開いた・コピーしたの4つを置いた頁へ知らせる | `pnpm exec vitest run`の検査`sdk-emits-four-events`が通る | #3698 |
| エディタのボタンは記法を縮めてURLの`#`に詰め、エディタはその記法を同じ字のまま開く | `pnpm exec vitest run`の検査`editor-url-compresses-notation`が通る | #3697 |
| エディタは今の縮めていない`#n=`のURLも同じ記法で開く | `pnpm exec vitest run`の検査`editor-url-roundtrip`が通る | #3697 |
| 縮めてもURLの上限を超える記法では、エディタのボタンが記法をクリップボードに写してエディタを開き、エディタに貼るよう知らせる | `pnpm exec vitest run`の検査`editor-open-copies-long-notation`が通る | #3697 |
| エディタのボタンとコピーの窓は、記法を外のサーバーへ送らない | `pnpm exec vitest run`の検査`editor-open-sends-nothing`が通る | #3697 |
| scriptの1行の入口は、属性`data-header`を持つ記法の塊を帯つきの図にし、持たない塊を今と同じ帯の無い図にする | `pnpm exec vitest run`の検査`script-entry-adds-bar-with-data-header`が通る | #3699 |
| scriptの1行の入口は、`data-header`を持つ塊が在る頁でだけ、図を描いた後に帯の塊を読む | `pnpm exec vitest run`の検査`script-entry-loads-bar-only-when-asked`が通る | #3699 |
| scriptの1行の入口だけを置いた頁で、塊が今と同じ動く図に置き換わる | `pnpm exec vitest run`の検査`script-entry-replaces-block-with-figure`が通る | #3699 |
| scriptの1行の入口が最初に読む量は、今の上限を超えない | `pnpm exec vitest run`の検査`script-entry-within-budget`が通る | #3699 |
| Web Componentの要素に記法を入れると帯つきの図が出て、属性で帯を外せる | `pnpm exec vitest run`の検査`element-renders-framed-diagram`が通る | #3700 |
| 見本帳の埋め込みの頁をiframeで開くと、URLの記法の帯つきの図が出て、置いた頁へ4つの知らせを`postMessage`で送る | `pnpm exec vitest run`の検査`embed-page-renders-hash-notation`と`embed-page-posts-events`が通る | #3700 |
| `packages/dragon/README.md`と`packages/dragon/README.ja.md`の組み込みの節に、scriptの1行、npmの関数、Web Component、iframeの4つの置き方の書き方が在る | `pnpm exec vitest run`の検査`readme-shows-four-embed-ways`が通る | #3701 |
| 見本帳の使い方の頁に組み込みの節が在り、4つの置き方ごとに写せるコードを出す | `pnpm exec vitest run`の検査`docs-page-has-embed-section`が通る | #3701 |
| 見本帳に、4つの置き方で同じ図を置いた見本の頁が在る | `pnpm exec vitest run`の検査`embed-sample-page-shows-four-ways`が通る | #3701 |
| プラグインの文書に組み込みの節が在り、AIが4つの置き方とSDKの設定を引ける | `pnpm exec vitest run`の検査`plugin-docs-has-embed-section`が通る | #3701 |
| 帯つきの図の帯の印は、段の鱗のアイコンだけを描き、`dragon`の字を持たず、読み上げの名前を持つ | `pnpm exec vitest run`の検査`bar-mark-is-icon-only`が通る | #3713 |
| 帯つきの図の帯は、題の左に印を置き、コード、エディタ、コピー、エクスポート、拡大のボタンをこの順に並べ、ボタンは全部枠を持つ | `pnpm exec vitest run`の検査`bar-lists-mark-and-five-buttons-in-order`が通る | #3713 |
| 帯の印を押すと、見本帳の頁を新しいタブで開く | `pnpm exec vitest run`の検査`bar-mark-opens-gallery`が通る | #3713 |
| 見本帳の見出しの印とファビコンは、帯の印と同じ段の鱗の形を描き、今の矢じりと波線を描かない | `pnpm exec vitest run`の検査`site-mark-and-favicon-match-the-bar-mark`が通る | #3713 |
| カタログの種類の頁の見本の札は帯を持ち、帯の1行目に段の鱗の印と見本の題と、コード、エディタ、コピー、エクスポート、拡大のボタンをこの順に並べる | `pnpm exec vitest run`の検査`catalog-card-has-the-bar`が通る | #3713 |
| カタログの帯の2行目に色味の切替と拡大縮小を置き、札は図とコードのタブと、帯の外の拡大のボタンを持たない | `pnpm exec vitest run`の検査`catalog-bar-holds-theme-and-zoom`が通る | #3713 |
| カタログの帯のコードのボタンを押すと記法の本文を出し、もう一度押すと図に戻る | `pnpm exec vitest run`の検査`catalog-bar-code-toggles-source`が通る | #3713 |
| カタログの帯のエディタのボタンは、その見本の記法を入れたエディタを開く | `pnpm exec vitest run`の検査`catalog-bar-editor-opens-notation`が通る | #3713 |
| カタログの帯のコピーのボタンで、その見本の記法をクリップボードに写せる | `pnpm exec vitest run`の検査`catalog-bar-copies-notation`が通る | #3713 |
| カタログの帯のエクスポートのボタンを押すと、書き出す形を選ぶ窓を開く | `pnpm exec vitest run`の検査`catalog-bar-export-opens-menu`が通る | #3713 |
| カタログの帯の拡大のボタンを押すと、今の拡大の重ね窓を開く | `pnpm exec vitest run`の検査`catalog-bar-fullscreen-opens-overlay`が通る | #3713 |
| 帯の釦の絵柄の線の決まりは、帯つきの図のSVGの中の字と線と地の四角に縁取りを付けず、どの要素も帯の無い図と同じ縁取りの有無と線の太さで描く | `pnpm exec vitest run`の検査`frame-diagram-keeps-plain-strokes`が通る | #3744 |
| 帯の釦の絵柄は今と同じく1.6pxの線で描き、dragonの印は線を持たずに塗って描く | `pnpm exec vitest run`の検査`frame-icons-keep-their-lines`が通る | #3744 |
| 帯つきの図の再生の帯は、段の番号の左の端と次の段の釦の右の端を`.stage`の左右の縁から16px離し、段ごとの進み具合の下の端を`.stage`の下の縁から12px離す | `pnpm exec vitest run`の検査`frame-bar-keeps-room-from-edges`が通る | #3744 |
| 帯の無い図の再生の帯は自分では余白を付けず、段の番号の左の端を図の枠の左の端に揃えて、余白を置いた頁に任せる | `pnpm exec vitest run`の検査`plain-bar-leaves-room-to-page`が通る | #3744 |
| 1 fileのHTMLは、今と同じく再生の部品の下に12px、再生の帯と呼び出しの欄の左右に16pxの余白を付ける | `pnpm exec vitest run`の検査`html-page-keeps-bar-room`が通る | #3744 |
| scriptの1行の入口が最初に読む量は、今と同じく上限の中に収まる | `pnpm exec vitest run`の検査`script-entry-within-budget`が通る | #3744 #3788 |
| `dragon embed`で埋めた頁を通信を止めて開いた時、`data-header`を持つ塊ごとに帯 (`[data-dragon-header]`) が1つ付き、帯のボタンがjsDelivrの1行の入口の頁と同じコード、エディタ、コピー、エクスポート、拡大の順に並ぶ | `pnpm exec vitest run`の検査`offline-page-frames-header-blocks`が通る | #3786 |
| 埋めた頁で`data-header`を持たない塊は、帯の無い図のまま描ける | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`offline-page-leaves-plain-blocks-bare`が通る | #3786 #3792 |
| 通信を止めて開いた埋めた頁で、帯のボタンとエクスポートの窓とコピーの窓の項目を1つずつ押した時、書き出せなかった知らせか頁の例外を出す項目が0個になる | `pnpm exec vitest run`の検査`offline-header-buttons-work-without-network`が通る | #3786 |
| 埋めた頁の帯は、どのボタンを押しても頁の外のfileを読みに行くことができない | `pnpm exec vitest run`の検査`offline-header-buttons-work-without-network`が通る | #3786 |
| npmの帯 (`mountFramedDiagram`) のエクスポートの窓は、今と同じく画像、動き、記法の見出しの下に7つの形式を並べる | `pnpm exec vitest run`の検査`export-menu-groups-seven-formats`が通る | #3786 |
| jsDelivrの1行の入口の頁で帯のエクスポートのHTMLを押すと、今と同じく入口の置き場から書き出す部品を読み、再生のscriptを埋めたHTMLを保存できる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-adds-bar-with-data-header`が通る | #3786 #3792 |
| npmの帯 (`mountFramedDiagram`) でエクスポートのHTMLを押すと、今と同じく隣の書き出す部品を読み、再生のscriptを埋めたHTMLを保存できる | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts`の検査`frame-export-html-loads-capture`が通る | #3786 #3792 |
| 帯を出さずに置いた図 (`mountDragon`の`header: false`) の`export("html")`は、今と同じく再生のscriptを埋めたHTMLを返す | `pnpm exec vitest run packages/dragon/test/embed-sdk.test.ts`の検査`sdk-headless-exports-html`が通る | #3786 #3792 |
| 頁の幅360px (左右に16pxの余白) で帯のエクスポートの窓とコピーの窓を開いた時、どちらの窓も左端が0px以上、右端が360px以下になる | `pnpm exec vitest run`の検査`frame-menus-fit-narrow-page`が通る | #3786 |
| 帯の枠の幅が280px (頁の幅312px、左右に16pxの余白) の時、エクスポートの窓の幅は枠の幅から20pxを引いた260pxになり、窓は枠の左右の縁を越えられない | `pnpm exec vitest run`の検査`frame-menus-fit-narrow-page`が通る | #3786 |
| 頁の幅1000pxで帯のエクスポートの窓を開いた時、窓の右端は今と同じくエクスポートのボタンの右端と揃い、窓の幅は300pxのまま | `pnpm exec vitest run`の検査`frame-menu-aligns-right-on-wide-page`が通る | #3786 |
| jsDelivrの1行の入口が最初に読むscriptの量 (gzipした後) は、上限の90,000 byteを超えられない | `pnpm exec vitest run`の検査`script-entry-within-budget`が通る | #3786 |
| `dragon embed`が書く頁は今と同じく1つのfileで、外への通信を止めて開くと塊が図に置き換わる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`embed-writes-offline-file`が通る | #3786 #3792 |
| 頁が`body{letter-spacing:.12em;word-spacing:.3em;text-transform:uppercase}`を持つ時、帯つきの図と`mountDiagram`で置いた帯の無い図の両方で、図のSVGの全ての`text`の`letter-spacing`と`word-spacing`と`text-transform`の計算値と描いた字の幅が、頁のCSSの無い時と同じになる。字の間を自分で決めない字では、計算値は`normal`と`0px`と`none`になる | `pnpm exec vitest run`の検査`frame-text-ignores-page-spacing`が通る | #3787 |
| 同じ頁で、帯つきの図の帯の題と、`<a>`で作るエディタを含む帯の全てのボタンの`letter-spacing`が`normal`、`text-transform`が`none`になり、帯の高さと各ボタンの幅が頁のCSSの無い時と同じになる | `pnpm exec vitest run`の検査`frame-text-ignores-page-spacing`が通る | #3787 |
| 同じ頁で、帯の無い図の再生の帯 (`.dg-player`) の段の題と段の本文の`letter-spacing`が`normal`、`text-transform`が`none`になる | `pnpm exec vitest run`の検査`player-text-ignores-page-spacing`が通る | #3787 |
| 頁が`button{background:#e11d48;color:#fff;border:0;border-radius:999px;padding:12px 24px;font-size:18px;font-weight:700;text-transform:uppercase;min-height:48px;min-width:96px;box-shadow:0 3px 0 #9f1239}`と`div{line-height:2.4}`を持つ時、頁のCSSは`createFigureHeader`で作った帯のボタンに影と最小の幅と大文字を付けられない。ボタンの`box-shadow`は`none`、`min-width`は`0px`、`text-transform`は`none`になる | `pnpm exec vitest run`の検査`figure-header-ignores-page-css`が通る | #3787 |
| 同じ頁で、題と4つのボタンを置いた`createFigureHeader`の帯は、ボタンの高さが30px、帯の高さが49pxのまま描かれる | `pnpm exec vitest run`の検査`figure-header-ignores-page-css`が通る | #3787 |
| 頁が`body{letter-spacing:.12em;word-spacing:.3em;text-transform:uppercase}`を持つ時、`createFigureHeader`で作った帯の題と全てのボタンの`letter-spacing`が`normal`、`text-transform`が`none`になる | `pnpm exec vitest run`の検査`figure-header-ignores-page-css`が通る | #3787 |
| `createFigureHeader`は今と同じく`element`、`title`、`actions`、`settings`、`setColors`を返し、帯の頭を頁の中に置く | `pnpm exec vitest run`の検査`site-mark-and-favicon-match-the-bar-mark`と`catalog-card-has-the-bar`と`"header layout and controls remain the same when the embedder changes its colors"`が通る | #3787 |
| 見本帳の帯は今と同じく、帯の頭の`actions`と`settings`へ見本帳のボタンと色味の選ぶ欄と拡大縮小を差し込む | `pnpm exec vitest run`の検査`catalog-bar-holds-theme-and-zoom`と`catalog-bar-code-toggles-source`が通る | #3787 |
| 帯つきの図のSVGの全ての要素の縁取りの有無と線の太さは、同じ記法の帯の無い図と同じ | `pnpm exec vitest run`の検査`frame-diagram-keeps-plain-strokes`が通る | #3787 |
| jsDelivrの1行の入口が時系列図の頁で最初に読むscriptのgzip後の合計は90,000 byte以下 | `pnpm exec vitest run`の検査`script-entry-within-budget`が通る | #3787 |
| 頁の幅360px (左右に16pxの余白) に`oauth.dragon`と`day-hours.dragon`を帯つきで置いた時、帯のコード、エディタ、コピー、エクスポート、拡大の5つのボタンが字を見せない36px角のアイコンになって題の下に1段で並び、帯の高さが100px以下になる | `pnpm exec vitest run`の検査`frame-header-fits-narrow-page`が通る | #3788 |
| 頁の幅360pxの帯の5つのボタンは、字を隠しても`aria-label`に読み上げの名前 (コード、dragonエディタで開く、コピー、エクスポート、図を拡大) を持つ | `pnpm exec vitest run`の検査`frame-header-names-icon-buttons`が通る | #3788 |
| 頁の幅360pxの帯で、ボタンどうしが重なることと、ボタンが帯の枠の外へ出ることができない | `pnpm exec vitest run`の検査`frame-header-buttons-stay-inside`が通る | #3788 |
| 頁の幅1000pxの帯は高さ49pxのまま、5つのボタンが字とアイコンを見せて1段に並ぶ | `pnpm exec vitest run`の検査`frame-header-keeps-wide-page`が通る | #3788 |
| 置く側が設定`buttons`で足したボタンは、頁の幅360pxの帯でも字を見せたまま描ける | `pnpm exec vitest run`の検査`frame-header-keeps-added-button-text`が通る | #3788 |
| 頁の幅360pxと312pxで、エクスポートとコピーの窓は今と同じく帯の枠の中に開く | `pnpm exec vitest run`の検査`frame-menus-fit-narrow-page`が通る | #3788 |
| 帯のボタンの字は、今と同じく設定`lang`、置いた所から上の`lang`属性、英語の順で決まる | `pnpm exec vitest run`の検査`bar-text-follows-lang-setting-then-page`が通る | #3788 |
| 軽い入口だけを読む頁で、`loadFor`を待った後に`@cardenelabs/dragon/light/frame`の`mountFramedDiagram`で帯つきの図を置け、その頁が読み込むfileに既定の入口`dist/index.js`が入らない | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-entry-mounts-framed-diagram`が通る | #3789 |
| packageの`exports`は`./light/frame`をimportとrequireの両方で型つきで出す | `pnpm exec vitest run packages/dragon/test/pack-check.test.ts`の検査`entries-derived-from-exports`と`typed-entries`が通る | #3789 |
| `@cardenelabs/dragon/light/frame`の帯のエクスポートは、書き出す部品を入口の隣の`capture.js`から後で読み、書き出す部品の中身を入口に束ねない | `pnpm exec vitest run packages/dragon/test/package-entries.test.ts`の検査`entries-load-capture-beside`と`entries-skip-capture-body`が通る | #3789 |
| `@cardenelabs/dragon/light/frame`の`mountFramedDiagram`は、`loadFor`を待っていない種類の図を種類の名前を含む誤りで拒み、置き先に帯を残さない | `pnpm exec vitest run packages/dragon/test/light-entry.test.ts`の検査`light-frame-refuses-unloaded-kind`が通る | #3789 |
| jsDelivrの1行の頁で、`data-header`の塊の図を描く回数が1回になり、帯の塊が届く前に帯の無い図を描かない | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-draws-framed-block-once`が通る | #3789 |
| jsDelivrの1行の頁で、`data-header`の塊を描いた後の頁の揺れ (layout shiftの合計) が0になる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-draws-framed-block-once`が通る | #3789 |
| `dragon embed`が埋めるscriptの頁でも、`data-header`の塊の図を描く回数が1回になる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`offline-page-draws-framed-block-once`が通る | #3789 |
| `data-header`の無い頁は帯の塊を読まず、1行の入口が最初に読むscriptのgzip後の合計は上限の90,000 byteに収まる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-loads-bar-only-when-asked`と`script-entry-within-budget`が通る | #3789 |
| `<html lang="ja">`の頁で`mountDragon`と`mountFramedDiagram`に誤りのある記法を渡すと、誤りの文が日本語で出る | `pnpm exec vitest run packages/dragon/test/embed-sdk.test.ts`の検査`embed-sdk-errors-follow-page-lang`が通る | #3789 |
| `lang`属性の無い頁で`mountDragon`と`mountFramedDiagram`に誤りのある記法を渡すと、誤りの文は今と同じく英語で出る | `pnpm exec vitest run packages/dragon/test/embed-sdk.test.ts`の検査`embed-sdk-errors-stay-english-without-lang`が通る | #3789 |
| jsDelivrの1行の頁で、`<script type="application/json" id="dragon-header">`の塊に書いた`buttons`と`look.colors`で、全ての`data-header`の塊の帯のボタンの並びと色を変えられる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-reads-header-options`が通る | #3789 |
| `#dragon-header`の塊に知らないボタンの名前か読めないJSONを書いた頁では、`data-header`の塊をその誤りの文に置き換え、既定の帯で黙って描くことを拒む | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-rejects-bad-header-options`が通る | #3789 |
| `#dragon-header`の塊の無い頁の帯は、今と同じくコード、エディタ、コピー、エクスポート、拡大の5つのボタンを並べる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-adds-bar-with-data-header`が通る | #3789 |
| mdの頭の`---`の間に書いた`header-buttons`と`header-<色>`の行から、`dragon export`が書いた頁に`#dragon-header`の塊が入り、帯のボタンの並びと色がその行のとおりになる | `pnpm exec vitest run packages/dragon/test/page-export.test.ts`の検査`page-header-lines-set-header-block`が通る | #3789 |
| `dragon export`は、mdの頭の`header-buttons`の知らないボタンの名前と、`;`か`<`を含む色の値を行の番号つきの誤りで拒み、頁を書かない | `pnpm exec vitest run packages/dragon/test/page-export.test.ts`の検査`page-rejects-bad-header-lines`が通る | #3789 |
| `header-`で始まる行の無いmdから書き出した頁は、今と同じく`#dragon-header`の塊を持たない | `pnpm exec vitest run packages/dragon/test/page-export.test.ts`の検査`page-without-header-lines-has-no-header-block`が通る | #3789 |
| 今と同じ`mountFramedDiagram(host, source)`の呼び方で、既定の入口の頁に帯つきの図が置け、`destroy()`で取り除ける | `pnpm exec vitest run packages/dragon/test/article-frame.test.ts`の検査`"shared frame mounts the native checkout player and destroys its input view"`が通る | #3789 |
| packageのREADMEの英語と日本語が、`@cardenelabs/dragon/light/frame`の使い方と、`#dragon-header`の塊の書き方と、mdの頭の`header-`の行の書き方を載せる | `pnpm exec vitest run packages/dragon/test/embed-sdk.test.ts`の検査`readme-documents-header-settings`が通る | #3789 |
| `dragon embed`で埋めた頁の帯のエクスポートの窓は、jsDelivrの1行の入口の頁と同じく、画像の見出しの下にPNGとSVG、動きの見出しの下にHTMLとGIFとMP4、記法の見出しの下にdragon記法とJSONを、この順に並べる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`offline-export-menu-lists-seven-formats`が通る | #3792 |
| 通信を止めて開いた埋めた頁で、帯のエクスポートの7つの形式を1つずつ押した時、7つともファイルを保存し、書き出せなかった知らせか頁の例外を出す形式が0個になる | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`offline-header-buttons-work-without-network`が通る | #3792 |
| 通信を止めて開いた埋めた頁の帯で、HTMLとGIFとMP4を押しても、頁の外のfileを読みに行けない | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`offline-header-buttons-work-without-network`が通る | #3792 |
| 埋めた頁の帯で保存したGIFとMP4は、GIFとMP4のfileの形を持ち、コマを2つ以上持つ | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`offline-exported-motion-files-have-format`が通る | #3792 |
| 埋めた頁の帯で保存したHTMLを通信を止めて開くと、図を1つ描き、頁の例外を出さない | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`offline-exported-html-plays-without-network`が通る | #3792 |
| 埋めた頁の帯で保存したHTMLを通信を止めて開いた時、頁の外のfileを読みに行けない | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`offline-exported-html-plays-without-network`が通る | #3792 |
| 埋めるscript (`dist/offline.global.js`) は、絵柄集の表 (`src/blocks/icon/tabler.js`) を束ねない | `pnpm exec vitest run packages/dragon/test/package-entries.test.ts`の検査`offline-script-skips-icon-table`が通る | #3792 |
| 配る入口の file (`dist/offline.global.js`を含む) は、書き出す部品のPNGを作る処理を持たない | `pnpm exec vitest run packages/dragon/test/package-entries.test.ts`の検査`entries-skip-capture-body`が通る | #3792 |
| jsDelivrの1行の入口が最初に読むscriptの量 (gzipした後) は、上限の90,000byteを超えられない | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-within-budget`が通る | #3792 |
| `box api as API server`を持つ流れの図を描いた時、その箱を描いた要素が`data-node="api"`を持つ | `pnpm exec vitest run`の検査`box-carries-notation-id`が通る | #3795 |
| 同じ名前の箱が2つ在る図を描いた時、2つの箱を描いた要素がそれぞれ自分の記法のidを`data-node`に持つ | `pnpm exec vitest run`の検査`same-name-boxes-carry-distinct-ids`が通る | #3795 |
| 記法の`group <id> as <name>`を持つ図を描いた時、囲みを描いた要素が`data-node="<id>"`を持つ | `pnpm exec vitest run`の検査`group-carries-notation-id`が通る | #3795 |
| 見本帳の見本のうち記法に`box`を持つ全ての図を描いた時、各`box <id>`のidを`data-node`に持つ要素が描いた図に在る | `pnpm exec vitest run`の検査`every-gallery-box-carries-its-id`が通る | #3795 |
| 図を置いたページで箱を押した時、ページのscriptが押された要素から`closest('[data-node]')`で箱のidを読め、囲みの中の箱を押すと囲みでなく箱のidを返す | `pnpm exec vitest run`の検査`click-reads-innermost-node-id`が通る | #3795 |
| `dragon embed`で書き出した1枚のHTMLでも、箱と囲みを描いた要素が`data-node`に記法のidを持つ | `pnpm exec vitest run`の検査`embed-html-keeps-node-ids`が通る | #3795 |
| 組み込みの文書 (`plugins/dragon/skills/dragon/references/embed.md`と`packages/dragon/README.md`と`packages/dragon/README.ja.md`) が、箱と囲みのidを持つ属性`data-node`と、押した箱のidを`closest('[data-node]')`で読む書き方を持つ | `pnpm exec vitest run`の検査`embed-docs-name-node-attribute`が通る | #3795 |
| 線と札を描いた要素は`data-node`を持たない | `pnpm exec vitest run`の検査`lines-and-labels-carry-no-node-id`が通る | #3795 |
| 量の帯の図の棒は、今と同じく`data-node`に記法のidを持つ | `pnpm exec vitest run`の検査`sankey-band-grows-at-its-step`が通る | #3795 |
| 帯つきの図の帯の書き出す窓で判定の表のSVGを保存すると、例の名前を行の上の帯 (`data-dragon="judge-band"`) に置いた帯の形の表のSVGを書き、`foreignObject`を持たず、字の書体を`data:`で埋める | `pnpm exec vitest run packages/dragon/test/frame-judge-picture.test.ts`の検査`frame-judge-svg-draws-band-table`が通る | #3945 |
| 同じ窓で判定の表のPNGを保存すると、読み手が2番目の段まで送った後でも列を照らさない帯の形の表を撮る。PNGの幅は選んだ倍率を掛けた728px以下で、見出しの番号の丸は規則の数だけ写り、最初の丸は左の端から倍率を掛けた100px以内に在り、判定の札は例の数だけ写る | `pnpm exec vitest run packages/dragon/test/frame-judge-picture.test.ts`の検査`frame-judge-png-draws-band-table`が通る | #3945 |
| 帯のコピーの窓で判定の表の画像を写すと、帯の形の表を列を照らさずに撮ったPNGを写す | `pnpm exec vitest run packages/dragon/test/frame-judge-picture.test.ts`の検査`frame-judge-copy-draws-band-table`が通る | #3945 |
| 帯の書き出す窓で判定の表のGIFとmp4を保存すると、帯の形の表で規則の列を1段ずつ照らす1周を撮る。GIFのコマの幅は728px以下で、最初のコマは判定の札を見せず、最後の段のコマは判定の札を見せ、mp4は`video/mp4`のfileになる | `pnpm exec vitest run packages/dragon/test/frame-judge-picture.test.ts`の検査`frame-judge-film-lights-columns-by-step`が通る | #3945 |
| `mountDragon`に`header: false`を渡して帯を出さずに置いた判定の表の`export("svg")`も、帯の形の表のSVGを書き、`foreignObject`を持たない | `pnpm exec vitest run packages/dragon/test/frame-judge-picture.test.ts`の検査`sdk-headless-judge-svg-draws-band-table`が通る | #3945 |
| 判定の表でない図の帯のPNGは、今どおり選んだ大きさと地 (透明か塗るか) で撮る | `pnpm exec vitest run packages/dragon/test/embed-bar.test.ts`の検査`export-options-scale-and-transparent-png`が通る | #3945 |
| script の1行で置いた頁が最初に読む script の合計は、gzip した後で90,000バイトを超えない | `pnpm exec vitest run packages/dragon/test/script-entry.test.ts`の検査`script-entry-within-budget`が通る | #3945 |
