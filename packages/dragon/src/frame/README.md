# 記事用の共通ヘッダー

`@cardenelabs/dragon/frame`の`mountFramedDiagram`は、記法から操作帯つきの図を置く。
図の描画と入力は本体の`mountDiagram`へ渡す。

```ts
import { mountFramedDiagram } from '@cardenelabs/dragon/frame';

const view = mountFramedDiagram(host, source);
// 記事を画面から取り除く時に呼ぶ。
view.destroy();
```

上段には図の題、コード、dragonで開く、書き出す、拡大をこの順に置く。
コードは拡大窓の左に図、右に構文色を付けた記法とJSONを並べ、閉じると元の場所へ戻す。
下段は再生や配色など、埋め込み先の操作を置く領域とする。
操作の無い下段は隠す。

```ts
const view = mountFramedDiagram(host, source, {
  headerColors: { surface: '#f2f5fb', accent: '#31558c', border: '#ccd7e8' },
});
view.frame.setHeaderColors({ accent: '#66408b' });
```

`headerColors`は背景の`surface`、ボタンの地の`background`、文字の`foreground`、補足の`muted`、線の`border`、強調の`accent`、選択時の`hover`を受け取る。
同じ名前の`--dragon-header-*`のCSS変数を親から渡すこともできる。
色はDOMのstyleへ値として設定し、HTMLやCSSの文章へ埋め込まない。
独自の軽い再生部品を持つサイトは`@cardenelabs/dragon/header`の`createFigureHeader`を使い、`actions`と`settings`へ既存の操作を置く。
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
