# 軽い入口の頁の帯つきの図を別の入口`@cardenelabs/dragon/light/frame`から出す

## 決めたこと

軽い入口`@cardenelabs/dragon/light`だけを読む頁が帯つきの図を置く関数を、新しい入口`@cardenelabs/dragon/light/frame`から出す。
出す名前は`@cardenelabs/dragon/frame`と同じ (`mountFramedDiagram`、`createDragonFrame`、`createFigureHeader`、`diagramEditorUrl`) にする。
軽い入口の頁は`loadFor`を待った後に、`mountFramedDiagram`で同期で帯つきの図を置く。

## 選んだ案

既定の入口と`/frame`の組に、軽い入口と`/light/frame`の組を並べる。
`/frame`は既定の入口`dist/index.js`を読むので、軽い入口の頁で使うと全ての図の種類の部品が頁に入る。
`/light/frame`は軽い入口を外の物として読み、帯の部品だけを足す。
帯を使わない軽い入口の頁が最初に読む量は変わらず、帯の説明と型は2つの入口で同じになる。

## 却下した案とその理由

| 案 | 却下した理由 |
|---|---|
| 軽い入口`@cardenelabs/dragon/light`自身に`mountFramedDiagram`を足す | 束ねる道具を通さずに読む頁では、帯を使わない頁も帯の見た目とコードの窓とエクスポートの部品を最初に読む |
| 軽い入口に`loadFrame()`を足し、待った後に`mountFramedDiagram`を使う | 待ち忘れると誤りで止まり、既定の入口に無い関数が軽い入口にだけ増える |

## 拠り所

- 課題 #3789 の`## 決めたこと (step 2)`の採る行と、却下の行の「軽い入口自身に`mountFramedDiagram`を足す」「軽い入口に`loadFrame()`を足す」
- `packages/dragon/src/light.ts`の頭の、軽い入口と既定の入口を1つの頁で混ぜると全ての部品が頁に入るという行
- `packages/dragon/src/frame/framed.ts`の`mountInFrame`が、図の再生の部品を呼ぶ側から受け取り、package の入口を読まない形

## 決めた日

2026-11-21
