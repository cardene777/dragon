# 記事用の共通ヘッダー

`@cardenelabs/dragon/frame`の`mountFramedDiagram`は、記法から操作帯つきの図を置く。
図の描画と入力は本体の`mountDiagram`へ渡す。

```ts
import { mountFramedDiagram } from '@cardenelabs/dragon/frame';

const view = mountFramedDiagram(host, source);
// 記事を画面から取り除く時に呼ぶ。
view.destroy();
```

図とコードの切り替え、記法とJSONの構文色、コピー、拡大、公式エディタへの遷移を提供する。
PNGとSVGは入力欄を含む表示全体を写す。
HTMLは本体の`captureHtml`で作り、開くと定義の初期条件から操作を始める。
HTMLを書き出す時は、ビルドした入口の隣にある`player.global.js`を取得できる配置にする。
GIFとMP4は直近の操作履歴を再生する。
連続した実画面録画は行わない。
MP4はブラウザのH.264対応を要する。
書き出し処理の読み込みは、メニューで形式を選んだ時に行う。

共通スナップショットでは中央寄せの余白を実測値へ解決し、コマごとの横ずれを防ぐ。
`destroy()`は購入図の入力処理、履歴の監視、書き出し、ダイアログと一時URLを破棄する。
