# 記事用の共通ヘッダー

`@cardenelabs/dragon/frame`の`mountFramedDiagram`は、記法から操作帯つきの図を置く。
図の描画と入力は本体の`mountDiagram`へ渡す。

```ts
import { mountFramedDiagram } from '@cardenelabs/dragon/frame';

const view = mountFramedDiagram(host, source);
// 記事を画面から取り除く時に呼ぶ。
view.destroy();
```

上段には、題の左にdragonの印を置き、コード、エディタ、コピー、エクスポート、拡大のボタンをこの順に並べる。
ボタンは全部枠を持ち、拡大は字を持たずにアイコンと読み上げの名前だけを持つ。
dragonの印は見本帳の頁を新しいタブで開き、エディタは同じ記法をdragonエディタで開く。
エディタは記法をブラウザの内で縮めてURLの`#z=`に詰め、記法を外のサーバーへ送らない。
縮めてもURLが8000字 (`EDITOR_URL_LIMIT`) を超える記法は、記法をクリップボードにコピーしてから貼るよう頼むエディタ (`#paste`) を開き、知らせの欄に貼るよう出す。
コードは拡大窓の左に図、右に構文色を付けた記法とJSONを並べ、閉じると元の場所へ戻す。
下段は再生や配色など、埋め込み先の操作を置く領域とする。
操作の無い下段は隠す。

コピーとエクスポートは押すと窓を開き、窓は1つだけ開く。
片方を開くともう片方を閉じ、帯と図のほかの所を押すとどちらも閉じる。
コピーの窓は記法、画像 (2倍のPNG)、エディタのURLをクリップボードに書く。
エクスポートの窓は、画像の見出しの下にPNGとSVG、動きの見出しの下にHTMLとGIFとMP4、記法の見出しの下にdragon記法 (`.dragon`) とJSONを並べる。
窓の下で大きさ (1倍、2倍、3倍) と地 (塗る、透明) を選ぶ。
PNGは選んだ倍の画素で保存し、透明を選ぶとPNGとSVGは図の地を塗らずに保存する。

```ts
const view = mountFramedDiagram(host, source, {
  headerColors: { surface: '#f2f5fb', accent: '#31558c', border: '#ccd7e8' },
  lang: 'en',
  nonce: 'r4nd0m',
});
view.frame.setHeaderColors({ accent: '#66408b' });
```

`headerColors`は背景の`surface`、ボタンの地の`background`、文字の`foreground`、補足の`muted`、線の`border`、強調の`accent`、選択時の`hover`を受け取る。
同じ名前の`--dragon-header-*`のCSS変数を親から渡すこともできる。
色はDOMのstyleへ値として設定し、HTMLやCSSの文章へ埋め込まない。

`look`は帯と枠を置き先に合わせる。
`colors`は`headerColors`と同じ欄を持ってこちらが勝ち、`font`と`fontSize`と`radius`と`height`は帯の書体と字の大きさとボタンの角と行の高さを、`frame`の`border`と`background`は図を囲む枠の線と地を変える。
値は`--dragon-header-font`、`--dragon-header-font-size`、`--dragon-header-radius`、`--dragon-header-height`、`--dragon-frame-border`、`--dragon-frame-background`のCSS変数として枠に置き、親から渡すこともできる。

```ts
mountFramedDiagram(host, source, {
  look: { font: 'Georgia, serif', fontSize: '14px', radius: '2px', height: '56px', frame: { border: '1px solid #333', background: '#111' } },
  buttons: ['export', 'code', { id: 'share', label: 'Share', onClick: (actions) => navigator.share({ url: actions.editorUrl }) }],
  notify: (type, detail) => console.log(type, detail),
});
```

`buttons`は帯のボタンを書いた順に並べ、書かなかった初めからのボタン (`code`、`editor`、`copy`、`export`、`expand`) を外す。
置く側のボタンは`id`と`label`と`onClick`で書き、`icon`に24四方のSVGの`path`の`d`を渡せる。
押すと`onClick`が図の処理 (`view.frame.actions`) を受け取る。
`notify`はエクスポートした時に`('export', { format })`、エディタで開いた時に`('share', { via: 'editor' })`、コピーした時に`('share', { via: 'copy', kind })`で呼ぶ。
`view.frame.actions`の`export(format, { scale, background })`と`copy(kind)`と`openEditor()`は、帯のボタンと同じ処理を関数で呼ぶ。
`openEditor()`は長い記法をコピーして開いた時に`true`で終わり、`editorUrl()`は縮めたエディタのURLを返す。
帯を出さずに図だけを置く時は、SDKの入口`@cardenelabs/dragon/embed`の`mountDragon`に`header: false`を渡す。

`lang`は帯と再生の部品の言葉を`ja`か`en`で決める。
書かない時は置いた所から上の`lang`属性に従い、`ja-JP`のような値は言葉の部分で読む。
どちらも無い時と、日本語でも英語でもない時は英語にする。

帯と図の見た目は、帯の内側の影の根へ`adoptedStyleSheets`で入れ、style要素を作らない。
置いた頁の頭には何も足さず、CSPがstyle要素を止める頁でも帯と再生の部品の見た目が入る。
`adoptedStyleSheets`を持たないブラウザでは、`nonce`を付けたstyle要素を帯の内側に置く。
図のSVGは書き出しが読む`<style>`を持つので残し、`nonce`を渡した時はその`<style>`にも付ける。
図の字は同梱した字の後に代わりの字の並びを持ち、字を読まない頁に置いても明朝に落ちない。

独自の軽い再生部品を持つサイトは`@cardenelabs/dragon/header`の`createFigureHeader`を使い、`actions`と`settings`へ既存の操作を置く。
`mark`を渡すと題の左にdragonの印を置き、`styles: false`を渡すとstyle要素を作らずに`HEADER_CSS`を呼ぶ側が入れる。
style要素を作る時は`nonce`を付ける。
この入口は描画本体や動画エンコーダーを読み込まない。
PNGとSVGは入力欄を含む表示全体を写す。
HTMLは本体の`captureHtml`で作り、開くと定義の初期条件から操作を始める。
HTMLを書き出す時は、ビルドした入口の隣にある`player.global.js`を取得できる配置にする。
GIFとMP4は直近の操作履歴を再生する。
連続した実画面録画は行わない。
MP4はブラウザのH.264対応を要する。
書き出し処理の読み込みは、メニューで形式を選んだ時に行う。

共通スナップショットでは中央寄せの余白を実測値へ解決し、コマごとの横ずれを防ぐ。
`destroy()`は購入図の入力処理、履歴の監視、書き出し、ダイアログと一時URLを破棄する。
