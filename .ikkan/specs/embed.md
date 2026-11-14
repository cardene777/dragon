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
