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
| scriptの1行の入口が最初に読む量は、今と同じく上限の中に収まる | `pnpm exec vitest run`の検査`script-entry-within-budget`が通る | #3744 |
